import os
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler

try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

# Ensure reliable absolute paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")

def train_anomaly_model(csv_path=None, save_path=None):
    if save_path is None:
        save_path = os.path.join(SAVED_MODELS_DIR, "anomaly.pkl")
        
    print("Generating synthetic data for training demonstration...")
    np.random.seed(42)
    normal_data = np.random.normal(loc=40, scale=10, size=1000)
    anomaly_data = np.random.normal(loc=95, scale=5, size=50)
    data = np.concatenate([normal_data, anomaly_data]).reshape(-1, 1)
    
    print("Training Isolation Forest...")
    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(data)
    
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    joblib.dump(model, save_path)
    print(f"✅ Anomaly model saved successfully to {save_path}")

def train_lstm_model(save_path=None):
    if save_path is None:
        save_path = os.path.join(SAVED_MODELS_DIR, "lstm.keras")
        
    print("\n--- LSTM Training ---")
    if not TF_AVAILABLE:
        print("⚠️  TensorFlow is not installed! Skipping LSTM training.")
        return

    print("Downloading UCI Metro Interstate Traffic Volume dataset...")
    url = "https://archive.ics.uci.edu/ml/machine-learning-databases/00492/Metro_Interstate_Traffic_Volume.csv.gz"
    
    try:
        df = pd.read_csv(url, compression='gzip')
        print("Dataset loaded successfully!")
    except Exception as e:
        print(f"Failed to download dataset: {e}")
        return
        
    volumes = df['traffic_volume'].values.reshape(-1, 1)
    
    scaler = MinMaxScaler(feature_range=(0, 100))
    scaled_data = scaler.fit_transform(volumes)
    
    scaler_path = os.path.join(SAVED_MODELS_DIR, "scaler.pkl")
    joblib.dump(scaler, scaler_path)
    
    seq_length = 10
    
    def create_sequences(data, seq_length):
        X, y = [], []
        limit = min(len(data), 10000)
        for i in range(limit - seq_length):
            X.append(data[i:i+seq_length])
            y.append(data[i+seq_length])
        return np.array(X), np.array(y)
        
    print("Creating sequences...")
    X, y = create_sequences(scaled_data, seq_length)
    
    model = Sequential([
        LSTM(32, activation='relu', input_shape=(seq_length, 1)),
        Dense(16, activation='relu'),
        Dense(1)
    ])
    
    model.compile(optimizer='adam', loss='mse')
    
    print("Training LSTM... (This might take a few minutes)")
    model.fit(X, y, epochs=5, batch_size=64, validation_split=0.2)
    
    model.save(save_path)
    print(f"✅ Real LSTM model trained and saved to {save_path}")

if __name__ == "__main__":
    print("--- Smart Traffic Model Training ---")
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    
    train_anomaly_model()
    train_lstm_model()
    
    print("\nTraining Complete! You can now use the models in your backend.")
