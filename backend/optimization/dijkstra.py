import networkx as nx
from optimization.graph_builder import get_graph

def calculate_expected_time(path, G, current_traffic):
    """
    Calculates ETA in minutes based on distance and traffic.
    Base speed: 50 km/h -> 1.2 min/km.
    Traffic penalty: up to 4x slower at 100% traffic.
    """
    total_mins = 0
    for i in range(len(path)-1):
        u = path[i]
        v = path[i+1]
        dist = G[u][v]['distance']
        base_time = dist * 1.2
        traffic_v = current_traffic.get(v, 0)
        multiplier = 1.0 + (traffic_v / 33.3)
        total_mins += base_time * multiplier
    return round(total_mins)

def calculate_optimal_route(start_node, end_node, current_traffic):
    """
    Finds:
    1. Shortest Physical Path (ignoring traffic)
    2. AI Optimal Path (factoring in live traffic density)
    3. All possible routes between start and end (for visualization)
    """
    G = get_graph()
    
    # 1. Base Graph (Shortest Path)
    try:
        shortest_path = nx.shortest_path(G, source=start_node, target=end_node, weight='distance')
        shortest_cost = sum(G[shortest_path[i]][shortest_path[i+1]]['distance'] for i in range(len(shortest_path)-1))
        shortest_time = calculate_expected_time(shortest_path, G, current_traffic)
    except nx.NetworkXNoPath:
        return {"error": "No path found"}
    except nx.NodeNotFound:
        return {"error": "Invalid start or end node"}

    # 2. Dynamic Graph (AI Optimal Path)
    DG = nx.DiGraph()
    for u, v, data in G.edges(data=True):
        traffic_u = current_traffic.get(u, 0)
        traffic_v = current_traffic.get(v, 0)
        
        # Traffic scale: 0 is empty (speed 1x), 100 is jam (speed 0.1x -> cost 10x)
        cost_u_to_v = data['distance'] * (1 + (traffic_v / 10.0))
        cost_v_to_u = data['distance'] * (1 + (traffic_u / 10.0))
        
        DG.add_edge(u, v, weight=cost_u_to_v)
        DG.add_edge(v, u, weight=cost_v_to_u)
        
    try:
        ai_path = nx.shortest_path(DG, source=start_node, target=end_node, weight='weight')
        ai_cost = sum(DG[ai_path[i]][ai_path[i+1]]['weight'] for i in range(len(ai_path)-1))
        # Also compute the raw physical distance (without traffic weighting)
        ai_distance = sum(G[ai_path[i]][ai_path[i+1]]['distance'] for i in range(len(ai_path)-1))
        ai_time = calculate_expected_time(ai_path, G, current_traffic)
    except nx.NetworkXNoPath:
        ai_path = shortest_path
        ai_cost = shortest_cost
        ai_distance = shortest_cost
        ai_time = shortest_time

    # 3. Find alternative routes (strictly capped to avoid combinatorial explosion on dense meshes)
    all_routes = []
    MAX_ROUTES = 20
    try:
        max_length = len(shortest_path) + 2  # Tighter cutoff for dense graphs
        count = 0
        for path in nx.all_simple_paths(G, source=start_node, target=end_node, cutoff=max_length):
            dist = sum(G[path[i]][path[i+1]]['distance'] for i in range(len(path)-1))
            eta = calculate_expected_time(path, G, current_traffic)
            is_ai = (path == list(ai_path))
            is_shortest = (path == list(shortest_path))
            all_routes.append({
                "path": path,
                "distance": round(dist, 2),
                "expected_time": eta,
                "is_ai": is_ai,
                "is_shortest": is_shortest
            })
            count += 1
            if count >= MAX_ROUTES:
                break
    except Exception:
        pass
    
    # Always ensure AI path is in the list
    if not any(r["is_ai"] for r in all_routes):
        all_routes.append({
            "path": ai_path,
            "distance": round(ai_distance, 2),
            "expected_time": ai_time,
            "is_ai": True,
            "is_shortest": (ai_path == shortest_path)
        })
    
    # Always ensure shortest path is in the list
    if not any(r["is_shortest"] for r in all_routes):
        all_routes.append({
            "path": shortest_path,
            "distance": round(shortest_cost, 2),
            "expected_time": shortest_time,
            "is_ai": (shortest_path == ai_path),
            "is_shortest": True
        })
    
    # Sort by distance
    all_routes.sort(key=lambda r: r["distance"])

    return {
        "path": ai_path, # Backward compatibility for UI
        "ai_path": ai_path,
        "ai_distance": round(ai_distance, 2),  # Actual road km
        "ai_time": ai_time,                      # Expected time in mins
        "ai_cost": round(ai_cost, 2),            # Traffic-weighted cost (not km)
        "shortest_path": shortest_path,
        "shortest_cost": round(shortest_cost, 2),
        "shortest_time": shortest_time,
        "all_routes": all_routes
    }

def calculate_multi_stop_route(waypoints, current_traffic):
    """
    Unified routing for 2 or more waypoints.
    
    Always computes:
      1. Direct route: start -> end (ignoring middle stops)
    
    If middle stops are provided (len > 2), also computes:
      2. Via-stops route: start -> stop1 -> stop2 -> ... -> end
         with a per-leg breakdown.
    
    This lets the user compare the direct shortest path against
    the route through their chosen stops.
    """
    if len(waypoints) < 2:
        return {"error": "At least 2 waypoints (start and end) are required"}
    
    start_node = waypoints[0]
    end_node = waypoints[-1]
    
    if start_node == end_node:
        return {"error": "Start and end locations cannot be the same"}
    
    # ── 1. Always compute the DIRECT route (start → end) ──
    direct = calculate_optimal_route(start_node, end_node, current_traffic)
    if "error" in direct:
        return direct
    
    result = {
        "waypoints": waypoints,
        # Direct route (always the primary result)
        "ai_path": direct["ai_path"],
        "ai_distance": direct["ai_distance"],
        "ai_time": direct["ai_time"],
        "ai_cost": direct["ai_cost"],
        "shortest_path": direct["shortest_path"],
        "shortest_cost": direct["shortest_cost"],
        "shortest_time": direct["shortest_time"],
        "all_routes": direct["all_routes"],
        "path": direct["ai_path"],  # Backward compat
    }
    
    # ── 2. If middle stops exist, compute the via-stops route ──
    middle_stops = waypoints[1:-1]
    
    if len(middle_stops) > 0:
        legs = []
        via_ai_path = []
        via_shortest_path = []
        via_ai_distance = 0
        via_ai_time = 0
        via_ai_cost = 0
        via_shortest_cost = 0
        via_shortest_time = 0
        has_error = False
        
        # Compute each leg: waypoints[i] → waypoints[i+1]
        for i in range(len(waypoints) - 1):
            seg_start = waypoints[i]
            seg_end = waypoints[i + 1]
            
            if seg_start == seg_end:
                continue  # Skip duplicate consecutive waypoints
            
            seg = calculate_optimal_route(seg_start, seg_end, current_traffic)
            if "error" in seg:
                has_error = True
                legs.append({
                    "from": seg_start,
                    "to": seg_end,
                    "error": seg["error"]
                })
                continue
            
            # Stitch paths (avoid duplicating the joining node)
            if len(via_ai_path) == 0:
                via_ai_path = list(seg["ai_path"])
            else:
                via_ai_path.extend(seg["ai_path"][1:])
            
            if len(via_shortest_path) == 0:
                via_shortest_path = list(seg["shortest_path"])
            else:
                via_shortest_path.extend(seg["shortest_path"][1:])
            
            via_ai_distance += seg.get("ai_distance", 0)
            via_ai_time += seg.get("ai_time", 0)
            via_ai_cost += seg.get("ai_cost", 0)
            via_shortest_cost += seg.get("shortest_cost", 0)
            via_shortest_time += seg.get("shortest_time", 0)
            
            legs.append({
                "from": seg_start,
                "to": seg_end,
                "ai_path": seg["ai_path"],
                "ai_distance": seg["ai_distance"],
                "ai_time": seg.get("ai_time", 0),
                "shortest_path": seg["shortest_path"],
                "shortest_distance": seg["shortest_cost"],
                "shortest_time": seg.get("shortest_time", 0),
                "all_routes": seg.get("all_routes", [])
            })
        
        if not has_error and len(via_ai_path) > 0:
            result["via_route"] = {
                "ai_path": via_ai_path,
                "ai_distance": round(via_ai_distance, 2),
                "ai_time": via_ai_time,
                "ai_cost": round(via_ai_cost, 2),
                "shortest_path": via_shortest_path,
                "shortest_cost": round(via_shortest_cost, 2),
                "shortest_time": via_shortest_time,
                "legs": legs,
                "stops": middle_stops
            }
        elif has_error:
            result["via_route"] = {
                "error": "One or more legs could not be computed",
                "legs": legs,
                "stops": middle_stops
            }
    
    return result
