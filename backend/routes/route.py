from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import urllib.parse
from optimization.dijkstra import calculate_optimal_route, calculate_multi_stop_route

# Note: We must import state_manager inside the function or use a dependency to avoid circular imports.
# For simplicity in this structure, we'll import it lazily or assume app.state_manager is accessible,
# but it's cleaner to just import it here.
from streaming.state_manager import global_state_manager as state_manager

router = APIRouter()

class RouteRequest(BaseModel):
    start_node: str
    end_node: str

class ViaRouteRequest(BaseModel):
    start_node: str
    via_node: str
    end_node: str

class MultiRouteRequest(BaseModel):
    waypoints: List[str]  # Minimum 2: [start, stop1?, stop2?, ..., end]

@router.post("/")
def get_route(request: RouteRequest):
    """
    Calculates optimal route based on live traffic data.
    Delegates to multi-stop logic with [start, end].
    """
    state = state_manager.get_current_state()
    current_traffic = state.get("nodes", {})
    
    result = calculate_multi_stop_route([request.start_node, request.end_node], current_traffic)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

@router.post("/via")
def get_via_route(request: ViaRouteRequest):
    """
    Calculates route through a specific waypoint.
    Delegates to multi-stop logic with [start, via, end].
    """
    state = state_manager.get_current_state()
    current_traffic = state.get("nodes", {})
    
    result = calculate_multi_stop_route(
        [request.start_node, request.via_node, request.end_node],
        current_traffic
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.post("/multi")
def get_multi_stop_route(request: MultiRouteRequest):
    """
    Unified multi-stop routing endpoint.
    
    Accepts an ordered list of waypoints: [start, stop1?, stop2?, ..., end]
    Minimum 2 waypoints required.
    
    Always returns:
      - Direct shortest/AI path from start → end (ignoring middle stops)
    
    If middle stops are provided:
      - Also returns a via_route with the route through all stops + per-leg breakdown
      - User can compare direct vs via-stops distances/times
    """
    # Validation
    if len(request.waypoints) < 2:
        raise HTTPException(status_code=400, detail="At least 2 waypoints (start and end) are required")
    
    # Remove empty strings
    waypoints = [w.strip() for w in request.waypoints if w.strip()]
    if len(waypoints) < 2:
        raise HTTPException(status_code=400, detail="At least 2 valid waypoints are required")
    
    # Validate all nodes exist in graph
    from optimization.graph_builder import get_graph
    G = get_graph()
    for wp in waypoints:
        if wp not in G.nodes:
            raise HTTPException(status_code=400, detail=f"Unknown location: '{wp}'")
    
    state = state_manager.get_current_state()
    current_traffic = state.get("nodes", {})
    
    result = calculate_multi_stop_route(waypoints, current_traffic)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.get("/area/{area_name}")
def get_area_roads(area_name: str):
    """
    Returns all graph edges (roads) that are connected to a specific area or place.
    """
    from optimization.graph_builder import get_graph
    G = get_graph()
    
    state = state_manager.get_current_state()
    current_traffic = state.get("nodes", {})
    
    edges = []
    
    import re
    area_lower = area_name.lower()
    search_area = area_lower
    
    def matches_area(node):
        n_lower = node.lower()
        if search_area in n_lower:
            return True
        if search_area == "muzaffarnagar" and "mzn" in n_lower:
            return True
        return False

    main_cities = {"dehradun", "rishikesh", "haridwar", "meerut", "new delhi", "delhi", "muzaffarnagar", "roorkee"}
    is_main_city = search_area in main_cities

    def get_node_city(node):
        n_lower = node.lower()
        if "mzn" in n_lower or "muzaffarnagar" in n_lower:
            return "muzaffarnagar"
        for city in main_cities:
            if city in n_lower:
                return city
        return None

    for u, v, data in G.edges(data=True):
        include_edge = False
        if is_main_city:
            # City mode: REQUIRE BOTH nodes to be in the city so inter-city highways are clipped
            include_edge = matches_area(u) and matches_area(v)
        else:
            # Specific place mode: Show roads connected to this specific node,
            # BUT only if the road stays within the same city (clip inter-city roads)
            if matches_area(u) or matches_area(v):
                city_u = get_node_city(u)
                city_v = get_node_city(v)
                # Only include if both nodes belong to the same city (or if city cannot be determined)
                if city_u == city_v or not city_u or not city_v:
                    include_edge = True
            
        if include_edge:
            traffic_avg = (current_traffic.get(u, 20) + current_traffic.get(v, 20)) / 2
            edges.append({
                "start": u,
                "end": v,
                "distance": data["distance"],
                "traffic": traffic_avg
            })
            
    return {"edges": edges}

# Search queries for Nominatim that return good boundary polygons
AREA_SEARCH_QUERIES = {
    "dehradun": "Dehradun, Uttarakhand, India",
    "delhi": "New Delhi, Delhi, India",
    "meerut": "Meerut, Uttar Pradesh, India",
    "muzaffarnagar": "Muzaffarnagar, Uttar Pradesh, India",
    "roorkee": "Roorkee, Uttarakhand, India",
    "haridwar": "Haridwar, Uttarakhand, India",
    "rishikesh": "Rishikesh, Uttarakhand, India",
}

@router.get("/area/{area_name}/boundary")
def get_area_boundary(area_name: str):
    """
    Returns the boundary polygon for a city/area.
    Uses precise Nominatim bounding boxes to set the exact real-world city limits.
    """
    import re
    area_lower = area_name.lower()
    search_area = area_lower
    
    match = re.search(r'\((.*?)\)', area_lower)
    if match:
        search_area = match.group(1).strip()
    else:
        from optimization.graph_builder import get_graph_nodes
        nodes = get_graph_nodes()
        for n in nodes:
            k = n["id"]
            if area_lower in k.lower():
                m = re.search(r'\((.*?)\)', k.lower())
                if m:
                    search_area = m.group(1).strip()
                break
                
    main_cities = {"dehradun", "rishikesh", "haridwar", "meerut", "new delhi", "delhi", "muzaffarnagar", "roorkee"}
    for city in main_cities:
        if city in search_area:
            search_area = city
            break
    
    # Precise Nominatim bounding boxes: [min_lat, max_lat, min_lon, max_lon]
    NOMINATIM_BOUNDING_BOXES = {
        "dehradun": ["30.1655646", "30.4855646", "77.8836813", "78.2036813"],
        "delhi": ["28.4042", "28.8835", "76.8389", "77.3484"],
        "meerut": ["28.8500", "29.1000", "77.6000", "77.8500"],
        "muzaffarnagar": ["29.3500", "29.6000", "77.6000", "77.8000"],
        "roorkee": ["29.7500", "29.9800", "77.8000", "78.0000"],
        "haridwar": ["29.8300", "30.0500", "78.0500", "78.2500"],
        "rishikesh": ["30.0100", "30.1500", "78.2100", "78.3500"]
    }
    
    if search_area in NOMINATIM_BOUNDING_BOXES:
        min_lat, max_lat, min_lon, max_lon = map(float, NOMINATIM_BOUNDING_BOXES[search_area])
        boundary_coords = [
            [min_lat, min_lon],
            [min_lat, max_lon],
            [max_lat, max_lon],
            [max_lat, min_lon],
            [min_lat, min_lon]
        ]
        return {"area": area_name, "coordinates": boundary_coords, "cached": True, "fallback": False}

    # Dynamic Fallback: Convex Hull from graph nodes
    from optimization.graph_builder import get_graph_nodes
    nodes = get_graph_nodes()
    
    def matches_area_for_boundary(node):
        n_lower = node.lower()
        if search_area in n_lower:
            return True
        if search_area == "muzaffarnagar" and "mzn" in n_lower:
            return True
        return False
        
    matching_nodes = {k: v for k, v in nodes.items() if matches_area_for_boundary(k)}
    
    if matching_nodes:
        points = []
        for v in matching_nodes.values():
            points.append((v["lat"], v["lng"]))
            
        points = sorted(list(set(points)))
        if len(points) <= 1:
            hull = points
        elif len(points) == 2:
            hull = points + [points[0]]
        else:
            def cross(o, a, b):
                return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
                
            lower = []
            for p in points:
                while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
                    lower.pop()
                lower.append(p)
                
            upper = []
            for p in reversed(points):
                while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
                    upper.pop()
                upper.append(p)
                
            hull = lower[:-1] + upper[:-1]
            
        import math
        if len(hull) > 0:
            centroid_lat = sum(p[0] for p in hull) / len(hull)
            centroid_lng = sum(p[1] for p in hull) / len(hull)
            
            padded_hull = []
            pad_distance = 0.015 
            for lat, lng in hull:
                dl = lat - centroid_lat
                dg = lng - centroid_lng
                dist = math.hypot(dl, dg)
                if dist > 0:
                    padded_hull.append([lat + (dl / dist) * pad_distance, lng + (dg / dist) * pad_distance])
                else:
                    padded_hull.append([lat, lng])
                    
            if len(padded_hull) > 0 and padded_hull[0] != padded_hull[-1]:
                padded_hull.append(padded_hull[0])
                
            return {"area": area_name, "coordinates": padded_hull, "cached": False, "fallback": True}
        
    return {"area": area_name, "coordinates": [], "error": "Boundary not found"}

