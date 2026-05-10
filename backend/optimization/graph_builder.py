import networkx as nx
import math
import urllib.request
import json
import time

try:
    from database import get_cached_distance, cache_distance
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False

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
        "Rajiv Chowk (Delhi)": {"lat": 28.6328, "lng": 77.2195, "is_arterial": True},
        "Hauz Khas (Delhi)": {"lat": 28.5430, "lng": 77.2062, "is_arterial": True},
        "Botanical Garden (Delhi)": {"lat": 28.5640, "lng": 77.3340, "is_arterial": True},
        "Chandni Chowk (Delhi)": {"lat": 28.6577, "lng": 77.2310, "is_arterial": True},
        "Karol Bagh (Delhi)": {"lat": 28.6433, "lng": 77.1901, "is_arterial": True},
        "Lajpat Nagar (Delhi)": {"lat": 28.5668, "lng": 77.2435, "is_arterial": True},
        "Dhaula Kuan (Delhi)": {"lat": 28.5912, "lng": 77.1627, "is_arterial": True},
        "INA (Delhi)": {"lat": 28.5750, "lng": 77.2085, "is_arterial": True},
        "Dwarka Sector 21 (Delhi)": {"lat": 28.5521, "lng": 77.0583, "is_arterial": True},
        "Kalkaji Mandir (Delhi)": {"lat": 28.5398, "lng": 77.2562, "is_arterial": True},
        
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
        "Graphic Era University (Dehradun)": {"lat": 30.2678, "lng": 77.9942, "is_arterial": False},
        "Niranjanpur Mandi (Dehradun)": {"lat": 30.3060, "lng": 78.0040, "is_arterial": True},
        "Kargi Chowk (Dehradun)": {"lat": 30.2905, "lng": 78.0195, "is_arterial": True},
        "Saharanpur Chowk (Dehradun)": {"lat": 30.3150, "lng": 78.0260, "is_arterial": True},
        "Prince Chowk (Dehradun)": {"lat": 30.3175, "lng": 78.0335, "is_arterial": True},
        "Clock Tower (Dehradun)": {"lat": 30.3243, "lng": 78.0418, "is_arterial": True},
        "Bindal Pull (Dehradun)": {"lat": 30.3275, "lng": 78.0330, "is_arterial": True},
        "Ballupur Chowk (Dehradun)": {"lat": 30.3340, "lng": 78.0160, "is_arterial": True},
        "GMS Road (Dehradun)": {"lat": 30.3200, "lng": 78.0050, "is_arterial": False},
        "Vasant Vihar (Dehradun)": {"lat": 30.3320, "lng": 77.9950, "is_arterial": False},
        "Uttaranchal University (Dehradun)": {"lat": 30.3400, "lng": 77.9540, "is_arterial": False},
        "Shivalik College (Dehradun)": {"lat": 30.3359, "lng": 77.8700, "is_arterial": False},
        "Dalanwala (Dehradun)": {"lat": 30.3250, "lng": 78.0550, "is_arterial": False},
        "Rispana Pull (Dehradun)": {"lat": 30.3015, "lng": 78.0461, "is_arterial": True},
        "Jogiwala (Dehradun)": {"lat": 30.2954, "lng": 78.0573, "is_arterial": True},
        "Raipur Stadium (Dehradun)": {"lat": 30.3142, "lng": 78.0903, "is_arterial": False},
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
        
    # ── Helper: generate all unique pairs for full intra-city mesh ──
    from itertools import combinations
    
    delhi_nodes = [
        "India Gate (Delhi)", "Connaught Place (Delhi)", "Kashmiri Gate (Delhi)", "Anand Vihar (Delhi)",
        "Rajiv Chowk (Delhi)", "Hauz Khas (Delhi)", "Botanical Garden (Delhi)", "Chandni Chowk (Delhi)",
        "Karol Bagh (Delhi)", "Lajpat Nagar (Delhi)", "Dhaula Kuan (Delhi)", "INA (Delhi)",
        "Dwarka Sector 21 (Delhi)", "Kalkaji Mandir (Delhi)"
    ]
    meerut_nodes = ["Partapur (Meerut)", "Meerut Bypass", "Meerut City Center"]
    mzn_nodes = ["Khatauli Bypass (MZN)", "Mansurpur (MZN)", "Muzaffarnagar Toll", "Muzaffarnagar City"]
    roorkee_nodes = ["Roorkee Bypass", "IIT Roorkee"]
    dehradun_nodes = [
        "ISBT Dehradun", "Graphic Era University (Dehradun)", "Niranjanpur Mandi (Dehradun)",
        "Kargi Chowk (Dehradun)", "Saharanpur Chowk (Dehradun)", "Prince Chowk (Dehradun)",
        "Clock Tower (Dehradun)", "Bindal Pull (Dehradun)", "Ballupur Chowk (Dehradun)",
        "GMS Road (Dehradun)", "Vasant Vihar (Dehradun)", "Uttaranchal University (Dehradun)",
        "Shivalik College (Dehradun)", "Dalanwala (Dehradun)", "Rispana Pull (Dehradun)",
        "Jogiwala (Dehradun)", "Raipur Stadium (Dehradun)", "Rajpur Road (Dehradun)",
        "Jakhan (Dehradun)", "Sahastradhara Crossing (Dehradun)"
    ]
    haridwar_nodes = ["Har Ki Pauri (Haridwar)", "Shantikunj (Haridwar)", "Haridwar Railway Station", "Chandi Devi (Haridwar)"]
    rishikesh_nodes = ["Triveni Ghat (Rishikesh)", "Laxman Jhula (Rishikesh)", "AIIMS Rishikesh", "Ram Jhula (Rishikesh)"]
    
    # Build full intra-city meshes
    edges = []
    for city_nodes in [delhi_nodes, meerut_nodes, mzn_nodes, roorkee_nodes, dehradun_nodes, haridwar_nodes, rishikesh_nodes]:
        for a, b in combinations(city_nodes, 2):
            edges.append((a, b))
    
    # Inter-city highway connections
    edges += [
        ("Kashmiri Gate (Delhi)", "Partapur (Meerut)"),
        ("Anand Vihar (Delhi)", "Partapur (Meerut)"),
        ("Meerut Bypass", "Khatauli Bypass (MZN)"),
        ("Meerut City Center", "Khatauli Bypass (MZN)"),
        ("Muzaffarnagar Toll", "Roorkee Bypass"),
        ("Muzaffarnagar City", "Roorkee Bypass"),
        ("Roorkee Bypass", "Graphic Era University (Dehradun)"),
        ("IIT Roorkee", "Graphic Era University (Dehradun)"),
        ("IIT Roorkee", "Haridwar Railway Station"),
        ("Roorkee Bypass", "Haridwar Railway Station"),
        ("Shantikunj (Haridwar)", "AIIMS Rishikesh"),
        ("Chandi Devi (Haridwar)", "AIIMS Rishikesh"),
        ("Triveni Ghat (Rishikesh)", "Jogiwala (Dehradun)"),
        ("Laxman Jhula (Rishikesh)", "Jakhan (Dehradun)"),
    ]
    
    # Deduplicate (since some inter-city edges may already exist from intra-city mesh)
    edges = list(set(edges))
    
    print("📡 Building road distance graph...")
    cache_hits = 0
    osrm_fetches = 0
    
    for u, v in edges:
        # 1. Try MongoDB cache first
        cached = None
        if MONGO_AVAILABLE:
            try:
                cached = get_cached_distance(u, v)
            except Exception:
                pass
        
        if cached is not None:
            dist = cached
            cache_hits += 1
            G.add_edge(u, v, distance=round(dist, 2))
        else:
            # 2. Fetch from OSRM
            dist = get_osrm_distance(
                locations[u]["lat"], locations[u]["lng"],
                locations[v]["lat"], locations[v]["lng"]
            )
            dist = round(dist, 2)
            G.add_edge(u, v, distance=dist)
            print(f"  ✅ {u} → {v}: {dist} km (OSRM)")
            osrm_fetches += 1
            time.sleep(0.15)  # Rate-limit OSRM requests
            
            # 3. Save to MongoDB cache for next startup
            if MONGO_AVAILABLE:
                try:
                    cache_distance(u, v, dist)
                except Exception:
                    pass
    
    print(f"✅ Graph built! ({cache_hits} cached, {osrm_fetches} fetched from OSRM)")
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

