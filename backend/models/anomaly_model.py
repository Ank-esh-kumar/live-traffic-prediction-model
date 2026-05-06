class MockAnomalyDetector:
    """
    Mock implementation of an Isolation Forest for traffic anomalies.
    In a real scenario, this would use sklearn's IsolationForest or similar.
    """
    def __init__(self, model_path=None):
        self.model_path = model_path
        # if model_path:
        #     self.model = joblib.load(model_path)
            
    def detect(self, current_traffic):
        """
        Detects anomalies in the current traffic state.
        Returns a list of dicts describing the anomalies.
        """
        anomalies = []
        for node, density in current_traffic.items():
            # For mockup: Any density > 85 is considered a severe anomaly (accident/gridlock)
            if density > 85:
                severity = "CRITICAL" if density > 95 else "HIGH"
                anomalies.append({
                    "node_id": node,
                    "density": density,
                    "severity": severity,
                    "type": "congestion_spike",
                    "description": f"Unusually high traffic detected at {node}"
                })
        return anomalies
