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


def _yen_k_shortest_paths(G, source, target, k=3, weight='distance'):
    """
    Yen's K-Shortest Loopless Paths algorithm.
    
    Finds exactly K shortest paths from source to target with NO unnecessary
    detours or intermediate stops. Each path is guaranteed to be the next-shortest
    unique path in the graph.
    
    This replaces the naive all_simple_paths approach which could return
    paths with arbitrary detours through irrelevant nodes.
    
    Returns: list of (path, cost) tuples, sorted by cost ascending.
    """
    import heapq
    
    try:
        shortest = nx.shortest_path(G, source=source, target=target, weight=weight)
        shortest_cost = sum(
            G[shortest[i]][shortest[i+1]][weight] for i in range(len(shortest)-1)
        )
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return []
    
    A = [(shortest, shortest_cost)]  # Confirmed k-shortest paths
    B = []  # Candidate heap: (cost, unique_id, path)
    candidate_id = 0  # Tie-breaker for heap
    
    for k_idx in range(1, k):
        prev_path = A[k_idx - 1][0]
        
        for i in range(len(prev_path) - 1):
            spur_node = prev_path[i]
            root_path = prev_path[:i + 1]
            root_cost = (
                sum(G[root_path[j]][root_path[j+1]][weight] for j in range(len(root_path)-1))
                if len(root_path) > 1 else 0
            )
            
            # Work on a copy — remove conflicting edges and nodes
            G_copy = G.copy()
            
            # Remove edges from spur_node that overlap with existing k-shortest paths
            for (path_k, _) in A:
                if len(path_k) > i and path_k[:i + 1] == root_path:
                    next_node = path_k[i + 1]
                    if G_copy.has_edge(spur_node, next_node):
                        G_copy.remove_edge(spur_node, next_node)
                    if not G_copy.is_directed() and G_copy.has_edge(next_node, spur_node):
                        G_copy.remove_edge(next_node, spur_node)
            
            # Remove root path nodes (except spur_node) to prevent loops
            for node in root_path[:-1]:
                if node in G_copy:
                    G_copy.remove_node(node)
            
            try:
                spur_path = nx.shortest_path(G_copy, source=spur_node, target=target, weight=weight)
                spur_cost = sum(
                    G_copy[spur_path[j]][spur_path[j+1]][weight] for j in range(len(spur_path)-1)
                )
                
                total_path = root_path[:-1] + spur_path
                total_cost = root_cost + spur_cost
                
                # Check for duplicates
                is_dup = (
                    any(total_path == bp for _, _, bp in B) or
                    any(total_path == ap for ap, _ in A)
                )
                if not is_dup:
                    heapq.heappush(B, (total_cost, candidate_id, total_path))
                    candidate_id += 1
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                continue
        
        if not B:
            break
        
        best_cost, _, best_path = heapq.heappop(B)
        A.append((best_path, best_cost))
    
    return A


def calculate_optimal_route(start_node, end_node, current_traffic, mode="fast"):
    """
    Finds:
    1. Top 3 Shortest Physical Paths (Yen's algorithm — guaranteed no unnecessary stops)
    2. AI Optimal Path (factoring in live traffic density)
       - If mode="eco", heavily penalizes high traffic to avoid stop-and-go.
    3. Up to 3 AI-weighted alternative routes
    
    All paths are clean, direct routes with no detours.
    """
    G = get_graph()
    
    # ── 1. K-Shortest Physical Paths (no detours) ──
    k_shortest = _yen_k_shortest_paths(G, start_node, end_node, k=3, weight='distance')
    
    if not k_shortest:
        return {"error": "No path found between the selected locations"}
    
    shortest_path, shortest_cost = k_shortest[0]
    shortest_time = calculate_expected_time(shortest_path, G, current_traffic)

    # ── 2. Dynamic Graph (AI Optimal Path with traffic weighting) ──
    DG = nx.DiGraph()
    for u, v, data in G.edges(data=True):
        traffic_u = current_traffic.get(u, 0)
        traffic_v = current_traffic.get(v, 0)
        
        if mode == "eco":
            # Eco mode: Penalize high-traffic quadratically (stop-and-go burns more fuel)
            penalty_v = (traffic_v / 20.0) ** 1.5
            penalty_u = (traffic_u / 20.0) ** 1.5
            cost_u_to_v = data['distance'] * (1 + penalty_v)
            cost_v_to_u = data['distance'] * (1 + penalty_u)
        else:
            # Fast mode (default): Standard linear penalty
            cost_u_to_v = data['distance'] * (1 + (traffic_v / 10.0))
            cost_v_to_u = data['distance'] * (1 + (traffic_u / 10.0))
            
        DG.add_edge(u, v, weight=cost_u_to_v, distance=data['distance'])
        DG.add_edge(v, u, weight=cost_v_to_u, distance=data['distance'])
        
    try:
        ai_path = nx.shortest_path(DG, source=start_node, target=end_node, weight='weight')
        ai_cost = sum(DG[ai_path[i]][ai_path[i+1]]['weight'] for i in range(len(ai_path)-1))
        ai_distance = sum(G[ai_path[i]][ai_path[i+1]]['distance'] for i in range(len(ai_path)-1))
        ai_time = calculate_expected_time(ai_path, G, current_traffic)
        
        if mode == "eco":
            base_co2 = ai_distance * 150
            traffic_penalty = sum(
                (current_traffic.get(ai_path[i], 0)/100) * (G[ai_path[i]][ai_path[i+1]]['distance'] * 300)
                for i in range(len(ai_path)-1)
            )
            ai_co2 = round(base_co2 + traffic_penalty)
        else:
            ai_co2 = None
            
    except nx.NetworkXNoPath:
        ai_path = shortest_path
        ai_cost = shortest_cost
        ai_distance = shortest_cost
        ai_time = shortest_time
        ai_co2 = None

    # ── 3. Build deduplicated route list from K-shortest + AI routes ──
    all_routes = []
    seen_paths = set()
    
    # Add the K-shortest physical paths
    for path, cost in k_shortest:
        path_key = tuple(path)
        if path_key not in seen_paths:
            seen_paths.add(path_key)
            eta = calculate_expected_time(path, G, current_traffic)
            all_routes.append({
                "path": path,
                "distance": round(cost, 2),
                "expected_time": eta,
                "is_ai": (path == list(ai_path)),
                "is_shortest": (path == shortest_path)
            })
    
    # Ensure AI optimal path is always included
    ai_key = tuple(ai_path)
    if ai_key not in seen_paths:
        seen_paths.add(ai_key)
        all_routes.append({
            "path": ai_path,
            "distance": round(ai_distance, 2),
            "expected_time": ai_time,
            "is_ai": True,
            "is_shortest": (ai_path == shortest_path)
        })
    else:
        for r in all_routes:
            if tuple(r["path"]) == ai_key:
                r["is_ai"] = True
    
    # Find up to 3 AI-weighted alternatives (traffic-aware)
    k_ai = _yen_k_shortest_paths(DG, start_node, end_node, k=3, weight='weight')
    for path, cost in k_ai:
        path_key = tuple(path)
        if path_key not in seen_paths:
            seen_paths.add(path_key)
            dist = sum(G[path[i]][path[i+1]]['distance'] for i in range(len(path)-1))
            eta = calculate_expected_time(path, G, current_traffic)
            all_routes.append({
                "path": path,
                "distance": round(dist, 2),
                "expected_time": eta,
                "is_ai": False,
                "is_shortest": False
            })
            
    # Sort by a mixed score of time and distance (to ensure the "best" 3 are kept)
    all_routes.sort(key=lambda r: r["expected_time"] * 0.7 + r["distance"] * 0.3)
    all_routes = all_routes[:3]

    # Assign an alternate index so the frontend can ask OSRM for native alternative routes
    # without passing intermediate waypoints (which caused the zigzag deviations).
    for idx, r in enumerate(all_routes):
        r["full_path"] = list(r["path"]) # Keep full path for UI display
        if len(r["path"]) > 1:
            r["path"] = [r["path"][0], r["path"][-1]]
        r["alt_index"] = idx
        # Add a synthetic cost based on distance and time for comparison
        r["cost"] = round(r["distance"] * 0.5 + (r["expected_time"] / 2), 1)

    clean_ai_path = [ai_path[0], ai_path[-1]] if len(ai_path) > 1 else ai_path
    full_ai_path = list(ai_path)
    
    # Find the alt_index for the primary AI path
    primary_alt_index = 0
    for r in all_routes:
        if r["is_ai"]:
            primary_alt_index = r.get("alt_index", 0)
            break

    result = {
        "path": clean_ai_path,
        "ai_path": clean_ai_path,
        "full_ai_path": full_ai_path,
        "alt_index": primary_alt_index,
        "ai_distance": round(ai_distance, 2),
        "ai_time": ai_time,
        "ai_cost": round(ai_cost, 2),
        "shortest_path": clean_ai_path,
        "full_shortest_path": list(shortest_path),
        "shortest_cost": round(shortest_cost, 2),
        "shortest_time": shortest_time,
        "all_routes": all_routes,
        "mode": mode
    }
    
    if ai_co2 is not None:
        result["ai_co2"] = ai_co2
        
    return result

def calculate_multi_stop_route(waypoints, current_traffic, mode="fast"):
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
    direct = calculate_optimal_route(start_node, end_node, current_traffic, mode)
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
        "shortest_time": direct["shortest_time"],
        "all_routes": direct["all_routes"],
        "full_ai_path": direct["full_ai_path"],
        "full_shortest_path": direct["full_shortest_path"],
        "path": direct["ai_path"],  # Backward compat
    }
    
    # ── 2. If middle stops exist, compute the via-stops route ──
    middle_stops = waypoints[1:-1]
    
    if len(middle_stops) > 0:
        legs = []
        legs = []
        via_ai_path = [] # Truncated
        via_full_ai_path = [] # Full node sequence
        via_shortest_path = [] # Truncated
        via_full_shortest_path = [] # Full node sequence
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
            
            seg = calculate_optimal_route(seg_start, seg_end, current_traffic, mode)
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
                via_full_ai_path = list(seg["full_ai_path"])
            else:
                via_ai_path.extend(seg["ai_path"][1:])
                via_full_ai_path.extend(seg["full_ai_path"][1:])
            
            if len(via_shortest_path) == 0:
                via_shortest_path = list(seg["shortest_path"])
                via_full_shortest_path = list(seg["full_shortest_path"])
            else:
                via_shortest_path.extend(seg["shortest_path"][1:])
                via_full_shortest_path.extend(seg["full_shortest_path"][1:])
            
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
                "full_ai_path": via_full_ai_path,
                "ai_distance": round(via_ai_distance, 2),
                "ai_time": via_ai_time,
                "ai_cost": round(via_ai_cost, 2),
                "shortest_path": via_shortest_path,
                "full_shortest_path": via_full_shortest_path,
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
