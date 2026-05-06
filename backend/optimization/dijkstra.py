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

    # 3. Find ALL possible routes (capped to avoid explosion)
    all_routes = []
    try:
        max_length = len(shortest_path) + 4  # Allow slightly longer detours
        for path in nx.all_simple_paths(G, source=start_node, target=end_node, cutoff=max_length):
            dist = sum(G[path[i]][path[i+1]]['distance'] for i in range(len(path)-1))
            eta = calculate_expected_time(path, G, current_traffic)
            is_ai = (path == ai_path)
            is_shortest = (path == shortest_path)
            all_routes.append({
                "path": path,
                "distance": round(dist, 2),
                "expected_time": eta,
                "is_ai": is_ai,
                "is_shortest": is_shortest
            })
    except Exception:
        pass
    
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
