import random

class MockLSTMPredictor:
    """
    Mock implementation of an LSTM traffic predictor.
    In a real scenario, this would load 'saved_models/lstm.h5' and predict.
    """
    def __init__(self, model_path=None):
        self.model_path = model_path
        # if model_path:
        #     self.model = keras.models.load_model(model_path)
            
    def predict(self, current_traffic):
        """
        Takes current traffic dict and predicts traffic 15 mins into the future.
        Returns a dict of node_id -> predicted_density.
        """
        predictions = {}
        for node, density in current_traffic.items():
            # Mock prediction: smooth out spikes, trend slightly towards mean (50)
            trend = (50 - density) * 0.1
            predicted = density + trend + random.uniform(-5, 5)
            predictions[node] = max(0, min(100, int(predicted)))
            
        return predictions
