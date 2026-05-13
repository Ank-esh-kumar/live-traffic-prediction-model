from datetime import datetime
import threading

class StateManager:
    """
    Holds the latest traffic data, predictions, and anomalies.
    Thread-safe implementation.
    """
    def __init__(self):
        self._lock = threading.Lock()
        self._state = {
            "timestamp": datetime.now().isoformat(),
            "nodes": {},       # Traffic density per node (junction/road)
            "anomalies": [],   # Active anomalies
            "predictions": {}, # Future traffic density predictions
            "incidents": []    # User-reported incidents
        }
        self._emergency_route = []
        
    def update_state(self, nodes=None, anomalies=None, predictions=None):
        with self._lock:
            self._state["timestamp"] = datetime.now().isoformat()
            if nodes is not None:
                self._state["nodes"] = nodes
            if anomalies is not None:
                self._state["anomalies"] = anomalies
            if predictions is not None:
                self._state["predictions"] = predictions

    def add_incident(self, incident):
        with self._lock:
            self._state["incidents"].insert(0, incident)
            # Keep only the last 50 active incidents in memory for the websocket
            self._state["incidents"] = self._state["incidents"][:50]
            self._state["timestamp"] = datetime.now().isoformat()

    def set_incidents(self, incidents):
        with self._lock:
            self._state["incidents"] = incidents
            self._state["timestamp"] = datetime.now().isoformat()

    def set_emergency_route(self, route):
        with self._lock:
            self._emergency_route = route

    def clear_emergency_route(self):
        with self._lock:
            self._emergency_route = []

    def get_emergency_route(self):
        with self._lock:
            return list(self._emergency_route)

    def get_current_state(self):
        with self._lock:
            state_copy = dict(self._state)
            # Apply emergency overrides if an emergency route is active
            if self._emergency_route:
                nodes_copy = dict(state_copy["nodes"])
                from optimization.graph_builder import get_graph
                try:
                    G = get_graph()
                    # 1. Set all nodes on the emergency route to 0 (green)
                    for node in self._emergency_route:
                        nodes_copy[node] = 0
                        # 2. Set cross-roads (neighbors not on the route) to 100 (red)
                        if node in G:
                            for neighbor in G.neighbors(node):
                                if neighbor not in self._emergency_route:
                                    nodes_copy[neighbor] = 100
                except Exception as e:
                    print(f"Error applying emergency overrides: {e}")
                    pass
                state_copy["nodes"] = nodes_copy
            
            # Explicitly expose the global emergency route to clients
            state_copy["emergency_route"] = self._emergency_route
            return state_copy

# Global instance to avoid circular imports
global_state_manager = StateManager()
