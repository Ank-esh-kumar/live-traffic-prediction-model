import asyncio
import random
import math
from optimization.graph_builder import get_graph_nodes
from models.anomaly_model import MockAnomalyDetector
from models.lstm_model import MockLSTMPredictor

try:
    from database import save_traffic_snapshot, log_anomalies
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False

class TrafficSimulator:
    def __init__(self, state_manager, csv_path=None):
        """
        Initializes the simulator.
        If csv_path is provided later, it can read from there.
        For now, it uses synthetic data generation to simulate various terrains/cities.
        """
        self.state_manager = state_manager
        self.csv_path = csv_path
        
        self.nodes = None
        
        # Models
        self.anomaly_detector = MockAnomalyDetector()
        self.lstm_predictor = MockLSTMPredictor()

        # Internal state
        self.current_step = 0

    async def run(self):
        """
        Background loop to simulate live data feed.
        """
        while True:
            # 1. Generate or read current traffic data
            current_traffic = self._generate_traffic()
            
            # 2. Detect anomalies
            anomalies = self.anomaly_detector.detect(current_traffic)
            
            # 3. Predict future traffic (LSTM mockup)
            predictions = self.lstm_predictor.predict(current_traffic)
            
            # 4. Update global state
            self.state_manager.update_state(
                nodes=current_traffic,
                anomalies=anomalies,
                predictions=predictions
            )
            
            # 5. Persist to MongoDB every 10th tick (~30s) for historical data
            if MONGO_AVAILABLE and self.current_step % 10 == 0:
                try:
                    save_traffic_snapshot(current_traffic, anomalies)
                    if anomalies:
                        log_anomalies(anomalies)
                except Exception:
                    pass  # Don't crash the simulator if DB is down
            
            self.current_step += 1
            # Wait 3 seconds before next update (simulating streaming interval)
            await asyncio.sleep(3)

    def _generate_traffic(self):
        """
        Generates synthetic traffic densities (0-100) for all nodes.
        Simulates rush hours using sine waves.
        """
        traffic = {}
        if self.nodes is None:
            from optimization.graph_builder import get_graph_nodes
            self.nodes = get_graph_nodes()
            
        # Simulate a daily cycle pattern (simplified to a faster cycle for demo)
        cycle = math.sin(self.current_step * 0.1) 
        
        for node in self.nodes:
            # Base load
            base = 30 + (cycle * 20)
            
            # Random fluctuations
            noise = random.uniform(-10, 10)
            
            # Some nodes (arterial roads) have higher variance
            if node["is_arterial"]:
                base += 20
                noise *= 1.5
                
            density = max(0, min(100, int(base + noise)))
            
            # Random spikes to simulate accidents/jams (5% chance)
            if random.random() < 0.05:
                density = min(100, density + 40)
                
            traffic[node["id"]] = density
            
        return traffic
