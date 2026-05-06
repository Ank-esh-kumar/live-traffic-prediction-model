import networkx as nx
import math
import urllib.request
import json
import time

def haversine(lat1, lon1, lat2, lon2):
    """Calculate distance between two lat/lng points in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def get_osrm_distance(lat1, lon1, lat2, lon2):
    """
    Fetch the real driving distance between two points using OSRM.
    Returns distance in km. Falls back to haversine on failure.
    """
    try:
        url = f"https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            if data.get("routes") and len(data["routes"]) > 0:
                return data["routes"][0]["distance"] / 1000.0
    except Exception as e:
        print(f"  ⚠️  OSRM failed for ({lat1},{lon1})->({lat2},{lon2}): {e}")
    return haversine(lat1, lon1, lat2, lon2)

def _generate_synthetic_graph():
    G = nx.Graph()
    
    locations = {
        # Delhi
        "India Gate (Delhi)": {"lat": 28.6129, "lng": 77.2295, "is_arterial": False},
        "Connaught Place (Delhi)": {"lat": 28.6304, "lng": 77.2177, "is_arterial": True},
        "Kashmiri Gate (Delhi)": {"lat": 28.6665, "lng": 77.2289, "is_arterial": True},
        "Anand Vihar (Delhi)": {"lat": 28.6469, "lng": 77.3160, "is_arterial": True},
        
        # Meerut Region
        "Partapur (Meerut)": {"lat": 28.9186, "lng": 77.6599, "is_arterial": True},
        "Meerut Bypass": {"lat": 28.9845, "lng": 77.7064, "is_arterial": True},
        "Meerut City Center": {"lat": 28.9845, "lng": 77.7364, "is_arterial": False}, # Parallel
        
        # Muzaffarnagar Region
        "Khatauli Bypass (MZN)": {"lat": 29.2801, "lng": 77.7212, "is_arterial": True},
        "Mansurpur (MZN)": {"lat": 29.3789, "lng": 77.7126, "is_arterial": True},
        "Muzaffarnagar Toll": {"lat": 29.4727, "lng": 77.7085, "is_arterial": True},
        "Muzaffarnagar City": {"lat": 29.4727, "lng": 77.7385, "is_arterial": False}, # Parallel
        
        # Roorkee Region
        "Roorkee Bypass": {"lat": 29.8315, "lng": 77.8920, "is_arterial": True},
        "IIT Roorkee": {"lat": 29.8649, "lng": 77.8966, "is_arterial": False}, # Parallel city route
        
        # Dehradun Region
        "ISBT Dehradun": {"lat": 30.2858, "lng": 77.9959, "is_arterial": True},
        "Clement Town (Dehradun)": {"lat": 30.2662, "lng": 78.0069, "is_arterial": True},
        "Niranjanpur Mandi (Dehradun)": {"lat": 30.3060, "lng": 78.0040, "is_arterial": True},
        "Kargi Chowk (Dehradun)": {"lat": 30.2905, "lng": 78.0195, "is_arterial": True},
        "Saharanpur Chowk (Dehradun)": {"lat": 30.3150, "lng": 78.0260, "is_arterial": True},
        "Prince Chowk (Dehradun)": {"lat": 30.3175, "lng": 78.0335, "is_arterial": True},
        "Clock Tower (Dehradun)": {"lat": 30.3243, "lng": 78.0418, "is_arterial": True},
        "Bindal Pull (Dehradun)": {"lat": 30.3275, "lng": 78.0330, "is_arterial": True},
        "Ballupur Chowk (Dehradun)": {"lat": 30.3340, "lng": 78.0160, "is_arterial": True},
        "GMS Road (Dehradun)": {"lat": 30.3200, "lng": 78.0050, "is_arterial": False},
        "Vasant Vihar (Dehradun)": {"lat": 30.3320, "lng": 77.9950, "is_arterial": False},
        "Prem Nagar (Dehradun)": {"lat": 30.3350, "lng": 77.9650, "is_arterial": False},
        "Dalanwala (Dehradun)": {"lat": 30.3250, "lng": 78.0550, "is_arterial": False},
        "Rispana Pull (Dehradun)": {"lat": 30.3015, "lng": 78.0461, "is_arterial": True},
        "Jogiwala (Dehradun)": {"lat": 30.2954, "lng": 78.0573, "is_arterial": True},
        "Raipur (Dehradun)": {"lat": 30.3080, "lng": 78.0960, "is_arterial": False},
        "Rajpur Road (Dehradun)": {"lat": 30.3421, "lng": 78.0558, "is_arterial": False},
        "Jakhan (Dehradun)": {"lat": 30.3640, "lng": 78.0750, "is_arterial": False},
        "Sahastradhara Crossing (Dehradun)": {"lat": 30.3550, "lng": 78.0710, "is_arterial": False},
        
        # Haridwar Region
        "Har Ki Pauri (Haridwar)": {"lat": 29.9538, "lng": 78.1719, "is_arterial": True},
        "Shantikunj (Haridwar)": {"lat": 29.9926, "lng": 78.1963, "is_arterial": False},
        "Haridwar Railway Station": {"lat": 29.9472, "lng": 78.1614, "is_arterial": True},
        "Chandi Devi (Haridwar)": {"lat": 29.9332, "lng": 78.1751, "is_arterial": False},
        
        # Rishikesh Region
        "Triveni Ghat (Rishikesh)": {"lat": 30.1030, "lng": 78.2970, "is_arterial": True},
        "Laxman Jhula (Rishikesh)": {"lat": 30.1227, "lng": 78.3276, "is_arterial": False},
        "AIIMS Rishikesh": {"lat": 30.0763, "lng": 78.2934, "is_arterial": True},
        "Ram Jhula (Rishikesh)": {"lat": 30.1130, "lng": 78.3129, "is_arterial": False}
    }
    
    for id, data in locations.items():
        G.add_node(id, lat=data["lat"], lng=data["lng"], is_arterial=data["is_arterial"])
        
    # Define edges (Start, End)
    edges = [
        # Delhi internal
        ("India Gate (Delhi)", "Connaught Place (Delhi)"),
        ("Connaught Place (Delhi)", "Kashmiri Gate (Delhi)"),
        ("Connaught Place (Delhi)", "Anand Vihar (Delhi)"),
        ("Kashmiri Gate (Delhi)", "Partapur (Meerut)"),
        ("Anand Vihar (Delhi)", "Partapur (Meerut)"),
        
        # Meerut branching (Bypass vs City)
        ("Partapur (Meerut)", "Meerut Bypass"),
        ("Partapur (Meerut)", "Meerut City Center"),
        ("Meerut Bypass", "Khatauli Bypass (MZN)"),
        ("Meerut City Center", "Khatauli Bypass (MZN)"), # Re-merge
        
        # MZN branching
        ("Khatauli Bypass (MZN)", "Mansurpur (MZN)"),
        ("Mansurpur (MZN)", "Muzaffarnagar Toll"), # Highway route
        ("Mansurpur (MZN)", "Muzaffarnagar City"), # City route
        ("Muzaffarnagar Toll", "Roorkee Bypass"),
        ("Muzaffarnagar City", "Roorkee Bypass"), # Re-merge
        
        # Roorkee branching
        ("Roorkee Bypass", "IIT Roorkee"), # City
        ("Roorkee Bypass", "Clement Town (Dehradun)"), # Direct highway
        ("IIT Roorkee", "Clement Town (Dehradun)"),
        
        # Dehradun internal
        ("Clement Town (Dehradun)", "ISBT Dehradun"),
        ("ISBT Dehradun", "Niranjanpur Mandi (Dehradun)"),
        ("ISBT Dehradun", "Kargi Chowk (Dehradun)"),
        ("Kargi Chowk (Dehradun)", "Jogiwala (Dehradun)"),
        ("Jogiwala (Dehradun)", "Rispana Pull (Dehradun)"),
        ("Jogiwala (Dehradun)", "Raipur (Dehradun)"),
        ("Rispana Pull (Dehradun)", "Dalanwala (Dehradun)"),
        ("Dalanwala (Dehradun)", "Clock Tower (Dehradun)"),
        ("Niranjanpur Mandi (Dehradun)", "Saharanpur Chowk (Dehradun)"),
        ("Saharanpur Chowk (Dehradun)", "Prince Chowk (Dehradun)"),
        ("Prince Chowk (Dehradun)", "Clock Tower (Dehradun)"),
        ("Prince Chowk (Dehradun)", "Rispana Pull (Dehradun)"),
        ("Saharanpur Chowk (Dehradun)", "Bindal Pull (Dehradun)"),
        ("Bindal Pull (Dehradun)", "Clock Tower (Dehradun)"),
        ("Bindal Pull (Dehradun)", "Ballupur Chowk (Dehradun)"),
        ("Niranjanpur Mandi (Dehradun)", "GMS Road (Dehradun)"),
        ("GMS Road (Dehradun)", "Ballupur Chowk (Dehradun)"),
        ("GMS Road (Dehradun)", "Vasant Vihar (Dehradun)"),
        ("Ballupur Chowk (Dehradun)", "Vasant Vihar (Dehradun)"),
        ("Vasant Vihar (Dehradun)", "Prem Nagar (Dehradun)"),
        ("Clock Tower (Dehradun)", "Rajpur Road (Dehradun)"),
        ("Rajpur Road (Dehradun)", "Jakhan (Dehradun)"),
        ("Rajpur Road (Dehradun)", "Sahastradhara Crossing (Dehradun)"),
        ("Sahastradhara Crossing (Dehradun)", "Raipur (Dehradun)"),
        
        # Connecting Roorkee to Haridwar
        ("IIT Roorkee", "Haridwar Railway Station"),
        ("Roorkee Bypass", "Haridwar Railway Station"),
        
        # Haridwar internal
        ("Haridwar Railway Station", "Har Ki Pauri (Haridwar)"),
        ("Haridwar Railway Station", "Chandi Devi (Haridwar)"),
        ("Har Ki Pauri (Haridwar)", "Shantikunj (Haridwar)"),
        
        # Connecting Haridwar to Rishikesh
        ("Shantikunj (Haridwar)", "AIIMS Rishikesh"),
        
        # Rishikesh internal
        ("AIIMS Rishikesh", "Triveni Ghat (Rishikesh)"),
        ("Triveni Ghat (Rishikesh)", "Ram Jhula (Rishikesh)"),
        ("Ram Jhula (Rishikesh)", "Laxman Jhula (Rishikesh)"),
        
        # Connecting Rishikesh to Dehradun
        ("Triveni Ghat (Rishikesh)", "Jogiwala (Dehradun)")
    ]
    
    print("📡 Fetching real road distances from OSRM...")
    for u, v in edges:
        dist = get_osrm_distance(
            locations[u]["lat"], locations[u]["lng"],
            locations[v]["lat"], locations[v]["lng"]
        )
        G.add_edge(u, v, distance=round(dist, 2))
        print(f"  ✅ {u} → {v}: {round(dist, 2)} km")
        time.sleep(0.15)  # Rate-limit OSRM requests
    
    print("✅ Graph built with real road distances!")
    return G

# Singleton graph instance for the app
city_graph = _generate_synthetic_graph()

def get_graph_nodes():
    """
    Returns list of dicts for nodes.
    """
    nodes = []
    for n, data in city_graph.nodes(data=True):
        nodes.append({
            "id": n,
            "lat": data["lat"],
            "lng": data["lng"],
            "is_arterial": data["is_arterial"]
        })
    return nodes

def get_graph():
    return city_graph

