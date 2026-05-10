import random
import os
import joblib
import numpy as np

try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

class RealLSTMPredictor:
    """
    Genuine LSTM traffic predictor using the model trained on the UCI Metro dataset.
    """
    def __init__(self, model_dir="saved_models"):
        self.model_path = os.path.join(model_dir, "lstm.h5")
        self.scaler_path = os.path.join(model_dir, "scaler.pkl")
        self.history = {} # node_id -> list of last 10 densities
        self.seq_length = 10
        self.model = None
        self.scaler = None
        self.is_ready = False
        
        self.load_model()
            
    def load_model(self):
        if TF_AVAILABLE and (os.path.exists(self.model_path) or os.path.exists(self.model_path.replace(".h5", ".keras"))) and os.path.exists(self.scaler_path):
            try:
                # Prefer .keras if it exists
                actual_model_path = self.model_path.replace(".h5", ".keras") if os.path.exists(self.model_path.replace(".h5", ".keras")) else self.model_path
                # Use compile=False to bypass metric deserialization errors in newer Keras versions
                self.model = load_model(actual_model_path, compile=False)
                self.scaler = joblib.load(self.scaler_path)
                self.is_ready = True
                print("✅ Real LSTM Model and Scaler loaded successfully!")
            except Exception as e:
                print(f"⚠️ Error loading LSTM model: {e}")
        else:
            if not TF_AVAILABLE:
                print("⚠️ TensorFlow not available. Falling back to Mock predictions.")
            else:
                print("⚠️ LSTM model files not found. Falling back to Mock predictions.")
                print("Run 'python pipeline/train_models.py' to train the real model.")
                
    def _update_history(self, current_traffic):
        for node, density in current_traffic.items():
            if node not in self.history:
                # Initialize with 10 copies of current density
                self.history[node] = [density] * self.seq_length
            else:
                self.history[node].append(density)
                if len(self.history[node]) > self.seq_length:
                    self.history[node].pop(0)

    def predict(self, current_traffic):
        """
        Takes current traffic dict, updates history, and predicts traffic.
        Returns a dict of node_id -> predicted_density.
        """
        self._update_history(current_traffic)
        predictions = {}
        
        if not self.is_ready:
            # Fallback Mock Logic
            for node, density in current_traffic.items():
                trend = (50 - density) * 0.1
                predicted = density + trend + random.uniform(-5, 5)
                predictions[node] = max(0, min(100, int(predicted)))
            return predictions
            
        # Real Inference
        for node, seq in self.history.items():
            # The simulator already outputs 0-100 density, which perfectly matches 
            # the 0-100 scale the LSTM was trained on. We don't need the scaler!
            input_tensor = np.array(seq).reshape(1, self.seq_length, 1)
            
            # Predict (model outputs a value directly in the 0-100 range)
            pred_density = self.model.predict(input_tensor, verbose=0)[0][0]
            
            # Ensure it stays within our 0-100 system density bounds
            predictions[node] = max(0, min(100, int(pred_density)))
            
        return predictions

# Factory object replacement so other files importing MockLSTMPredictor don't break
MockLSTMPredictor = RealLSTMPredictor
