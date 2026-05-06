from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from optimization.dijkstra import calculate_optimal_route

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

@router.post("/")
def get_route(request: RouteRequest):
    """
    Calculates optimal route based on live traffic data.
    """
    state = state_manager.get_current_state()
    current_traffic = state.get("nodes", {})
    
    result = calculate_optimal_route(request.start_node, request.end_node, current_traffic)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

@router.post("/via")
def get_via_route(request: ViaRouteRequest):
    """
    Calculates route through a specific waypoint.
    Combines: start -> via and via -> end.
    """
    state = state_manager.get_current_state()
    current_traffic = state.get("nodes", {})
    
    # Calculate first segment: start -> via
    seg1 = calculate_optimal_route(request.start_node, request.via_node, current_traffic)
    if "error" in seg1:
        raise HTTPException(status_code=400, detail=f"No route from {request.start_node} to {request.via_node}")
    
    # Calculate second segment: via -> end
    seg2 = calculate_optimal_route(request.via_node, request.end_node, current_traffic)
    if "error" in seg2:
        raise HTTPException(status_code=400, detail=f"No route from {request.via_node} to {request.end_node}")
    
    # Combine paths (avoid duplicating the via node)
    combined_path = seg1["ai_path"] + seg2["ai_path"][1:]
    combined_distance = seg1.get("ai_distance", 0) + seg2.get("ai_distance", 0)
    combined_cost = seg1["ai_cost"] + seg2["ai_cost"]
    combined_time = seg1.get("ai_time", 0) + seg2.get("ai_time", 0)
    
    return {
        "path": combined_path,
        "ai_path": combined_path,
        "ai_distance": round(combined_distance, 2),
        "ai_cost": round(combined_cost, 2),
        "ai_time": combined_time,
        "shortest_path": seg1["shortest_path"] + seg2["shortest_path"][1:],
        "shortest_cost": round(seg1["shortest_cost"] + seg2["shortest_cost"], 2),
        "shortest_time": seg1.get("shortest_time", 0) + seg2.get("shortest_time", 0),
        "via_node": request.via_node,
        "all_routes": [{
            "path": combined_path,
            "distance": round(combined_distance, 2),
            "expected_time": combined_time,
            "is_ai": True,
            "is_shortest": False
        }]
    }

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
    area_lower = area_name.lower()
    
    def matches_area(node):
        n_lower = node.lower()
        if area_lower in n_lower:
            return True
        if area_lower == "muzaffarnagar" and "mzn" in n_lower:
            return True
        return False

    for u, v, data in G.edges(data=True):
        if matches_area(u) or matches_area(v):
            traffic_avg = (current_traffic.get(u, 20) + current_traffic.get(v, 20)) / 2
            edges.append({
                "start": u,
                "end": v,
                "distance": data["distance"],
                "traffic": traffic_avg
            })
            
    return {"edges": edges}
