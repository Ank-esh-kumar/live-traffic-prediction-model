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
            "predictions": {}  # Future traffic density predictions
        }
        
    def update_state(self, nodes=None, anomalies=None, predictions=None):
        with self._lock:
            self._state["timestamp"] = datetime.now().isoformat()
            if nodes is not None:
                self._state["nodes"] = nodes
            if anomalies is not None:
                self._state["anomalies"] = anomalies
            if predictions is not None:
                self._state["predictions"] = predictions

    def get_current_state(self):
        with self._lock:
            return dict(self._state)

# Global instance to avoid circular imports
global_state_manager = StateManager()
