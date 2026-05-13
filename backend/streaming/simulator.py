import asyncio
import random
import math
from optimization.graph_builder import get_graph_nodes
from models.anomaly_model import MockAnomalyDetector

# ── GNN-first model loading with LSTM fallback ──
try:
    from models.gnn_model import SpatioTemporalGNN, GNN_AVAILABLE
    if GNN_AVAILABLE:
        TrafficPredictor = SpatioTemporalGNN
        print("🧠 Using Spatial-Temporal GNN for traffic prediction")
    else:
        from models.lstm_model import MockLSTMPredictor as TrafficPredictor
        print("📊 GNN dependencies not available. Using LSTM predictor.")
except ImportError:
    from models.lstm_model import MockLSTMPredictor as TrafficPredictor
    GNN_AVAILABLE = False
    print("📊 GNN module not found. Using LSTM predictor.")

# ── Weather service ──
try:
    from models.weather_service import get_weather_service
    WEATHER_AVAILABLE = True
except ImportError:
    WEATHER_AVAILABLE = False

try:
    from database import save_traffic_snapshot, log_anomalies, log_prediction_accuracy
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
        self.predictor = TrafficPredictor()
        
        # Weather
        self.weather_service = get_weather_service() if WEATHER_AVAILABLE else None
        self.weather_data = None

        # Internal state
        self.current_step = 0
        
        # Feedback Loop State
        self.prediction_cycle_steps = 300 # 300 steps * 3s = 900s = 15 minutes
        self.pending_prediction = None # { "history": {}, "predicted": {}, "timestamp": datetime }

    async def run(self):
        """
        Background loop to simulate live data feed.
        """
        while True:
            # 1. Generate or read current traffic data
            current_traffic = self._generate_traffic()
            
            # 2. Detect anomalies
            anomalies = self.anomaly_detector.detect(current_traffic)
            
            # 3. Refresh weather every 15 minutes (aligned with feedback loop)
            if self.weather_service and (self.current_step % self.prediction_cycle_steps == 0 or self.weather_data is None):
                self.weather_data = self.weather_service.get_weather()
                # Pass weather to GNN if it supports it
                if hasattr(self.predictor, 'set_weather'):
                    self.predictor.set_weather(self.weather_data)
            
            # 4. Predict future traffic (GNN or LSTM)
            if hasattr(self.predictor, 'predict') and 'weather' in self.predictor.predict.__code__.co_varnames:
                predictions = self.predictor.predict(current_traffic, weather=self.weather_data)
            else:
                predictions = self.predictor.predict(current_traffic)
            
            # 5. Update global state
            self.state_manager.update_state(
                nodes=current_traffic,
                anomalies=anomalies,
                predictions=predictions
            )

            # 6. Accuracy Feedback Loop (Every 15 mins)
            if self.current_step > 0 and self.current_step % self.prediction_cycle_steps == 0:
                await self._process_feedback_loop(current_traffic)
            
            # 7. Persist to MongoDB every 10th tick (~30s) for historical data
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

    async def _process_feedback_loop(self, current_live_data):
        """
        Compares previous prediction with current live data and improves the model.
        """
        if self.pending_prediction:
            print(f"📊 [AI Feedback Loop] Step {self.current_step}: Comparing 15-min prediction with reality...")
            
            predicted_data = self.pending_prediction["predicted"]
            history_at_t0 = self.pending_prediction["history"]
            
            # Calculate Accuracy (Mean Absolute Error)
            errors = []
            for node_id, actual_val in current_live_data.items():
                if node_id in predicted_data:
                    errors.append(abs(actual_val - predicted_data[node_id]))
            
            avg_error = sum(errors) / len(errors) if errors else 0
            accuracy = max(0, 100 - avg_error)
            
            print(f"📉 Accuracy: {accuracy:.2f}% (Avg Error: {avg_error:.2f} units)")
            
            # Log to DB
            if MONGO_AVAILABLE:
                log_prediction_accuracy({
                    "accuracy": accuracy,
                    "avg_error": avg_error,
                    "sample_size": len(errors),
                    "cycle_step": self.current_step,
                    "model_type": "GNN" if GNN_AVAILABLE else "LSTM"
                })
            
            # Improve the model using the actual data that just arrived
            if hasattr(self.predictor, 'improve_model'):
                success = self.predictor.improve_model(history_at_t0, current_live_data)
                if success:
                    print("🧠 Model updated with new live data patterns. Prediction accuracy should improve.")

        # Set up the NEXT prediction for comparison 15 mins from now
        # We capture the history and the prediction made RIGHT NOW
        self.pending_prediction = {
            "history": {node: list(seq) for node, seq in getattr(self.predictor, 'history', {}).items()},
            "predicted": self.predictor.predict(current_live_data) if not hasattr(self.predictor.predict, '__code__') or 'weather' not in self.predictor.predict.__code__.co_varnames else self.predictor.predict(current_live_data, weather=self.weather_data),
            "timestamp": self.current_step
        }
        print(f"🔮 [AI Feedback Loop] New 15-min prediction generated for comparison at step {self.current_step + self.prediction_cycle_steps}")

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
