import os
import pandas as pd
import numpy as np
import joblib
import math
import random
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler

try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

try:
    from torch_geometric.nn import SAGEConv
    PYG_AVAILABLE = True
except ImportError:
    PYG_AVAILABLE = False

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


def train_gnn_model(save_path=None, num_snapshots=500, epochs=50):
    """
    Train the Spatial-Temporal GNN on synthetic traffic data.
    
    This generates realistic training data by simulating traffic patterns
    across all nodes with time-of-day and weather variation, then trains
    the GNN to predict traffic density from these contextual features.
    """
    if save_path is None:
        save_path = os.path.join(SAVED_MODELS_DIR, "gnn.pt")
    
    print("\n--- GNN Training ---")
    
    if not TORCH_AVAILABLE or not PYG_AVAILABLE:
        missing = []
        if not TORCH_AVAILABLE:
            missing.append("torch")
        if not PYG_AVAILABLE:
            missing.append("torch-geometric")
        print(f"⚠️  {', '.join(missing)} not installed! Skipping GNN training.")
        print(f"   Install with: pip install {' '.join(missing)}")
        return
    
    import sys
    sys.path.insert(0, BASE_DIR)
    
    from optimization.graph_builder import get_graph
    from models.gnn_model import TrafficGNNModule, encode_time_features, encode_weather_features
    
    print("Building graph topology from road network...")
    G = get_graph()
    node_order = sorted(G.nodes())
    node_to_idx = {node: i for i, node in enumerate(node_order)}
    N = len(node_order)
    
    # Build edge_index
    src, dst = [], []
    for u, v in G.edges():
        i, j = node_to_idx[u], node_to_idx[v]
        src.extend([i, j])
        dst.extend([j, i])
    edge_index = torch.tensor([src, dst], dtype=torch.long)
    
    print(f"Graph: {N} nodes, {len(G.edges())} edges")
    
    # ── Generate synthetic training snapshots ──
    print(f"Generating {num_snapshots} synthetic traffic snapshots with weather/time features...")
    
    # Determine which nodes are arterial
    arterial = {node: G.nodes[node].get("is_arterial", False) for node in node_order}
    
    # Weather templates for variety
    weather_templates = [
        {"temperature": 35.0, "precipitation": 0.0, "wind_speed": 3.0},    # Hot, dry
        {"temperature": 25.0, "precipitation": 0.0, "wind_speed": 8.0},    # Pleasant
        {"temperature": 15.0, "precipitation": 5.0, "wind_speed": 15.0},   # Cold, rainy
        {"temperature": 20.0, "precipitation": 20.0, "wind_speed": 25.0},  # Storm
        {"temperature": 30.0, "precipitation": 2.0, "wind_speed": 5.0},    # Warm, light rain
    ]
    
    all_X = []
    all_y = []
    
    for snap_idx in range(num_snapshots):
        # Simulate a random time of day
        sim_hour = random.uniform(0, 24)
        sim_dow = random.randint(0, 6)
        
        hour_sin = math.sin(2 * math.pi * sim_hour / 24.0)
        hour_cos = math.cos(2 * math.pi * sim_hour / 24.0)
        dow_onehot = [1.0 if i == sim_dow else 0.0 for i in range(7)]
        time_feat = [hour_sin, hour_cos] + dow_onehot
        
        # Pick a weather condition
        weather = random.choice(weather_templates)
        weather_feat = encode_weather_features(weather)
        
        # Generate traffic: rush hours (7-9, 17-19) have higher base
        is_rush = (7 <= sim_hour <= 9) or (17 <= sim_hour <= 19)
        is_night = (22 <= sim_hour or sim_hour <= 5)
        is_weekend = sim_dow >= 5
        
        # Rain increases congestion
        rain_factor = 1.0 + (weather["precipitation"] / 20.0) * 0.3
        
        features = []
        targets = []
        
        for node_id in node_order:
            # Base density
            if is_night:
                base = 15
            elif is_rush and not is_weekend:
                base = 65
            elif is_weekend:
                base = 35
            else:
                base = 40
            
            # Arterial roads get more traffic
            if arterial.get(node_id, False):
                base += 15
            
            # Apply weather effect
            base = base * rain_factor
            
            # Add noise
            noise = random.gauss(0, 10)
            density = max(0, min(100, int(base + noise)))
            
            # Random spikes (3% chance)
            if random.random() < 0.03:
                density = min(100, density + 35)
            
            norm_density = density / 100.0
            node_feat = [norm_density] + time_feat + weather_feat
            features.append(node_feat)
            targets.append(norm_density)
        
        all_X.append(features)
        all_y.append(targets)
    
    X = torch.tensor(all_X, dtype=torch.float32)   # [num_snapshots, N, 13]
    y = torch.tensor(all_y, dtype=torch.float32)    # [num_snapshots, N]
    
    print(f"Training data shape: X={list(X.shape)}, y={list(y.shape)}")
    
    # ── Train the GNN ──
    model = TrafficGNNModule(in_features=13, hidden=64, out_features=1, dropout=0.2)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.005)
    loss_fn = nn.MSELoss()
    
    # Train/val split
    split = int(0.8 * num_snapshots)
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]
    
    print(f"\nTraining GNN for {epochs} epochs...")
    print(f"  Train: {split} snapshots | Val: {num_snapshots - split} snapshots")
    
    best_val_loss = float('inf')
    patience = 10
    patience_counter = 0
    
    for epoch in range(epochs):
        model.train()
        total_train_loss = 0
        
        # Mini-batch: process all training snapshots
        indices = list(range(split))
        random.shuffle(indices)
        
        for idx in indices:
            optimizer.zero_grad()
            pred = model(X_train[idx], edge_index)
            loss = loss_fn(pred, y_train[idx])
            loss.backward()
            optimizer.step()
            total_train_loss += loss.item()
        
        avg_train_loss = total_train_loss / split
        
        # Validation
        model.eval()
        with torch.no_grad():
            total_val_loss = 0
            for idx in range(len(X_val)):
                pred = model(X_val[idx], edge_index)
                loss = loss_fn(pred, y_val[idx])
                total_val_loss += loss.item()
            avg_val_loss = total_val_loss / len(X_val)
        
        if (epoch + 1) % 5 == 0 or epoch == 0:
            print(f"  Epoch {epoch+1:3d}/{epochs} | Train Loss: {avg_train_loss:.6f} | Val Loss: {avg_val_loss:.6f}")
        
        # Early stopping
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            patience_counter = 0
            # Save best model
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            torch.save(model.state_dict(), save_path)
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"  Early stopping at epoch {epoch+1} (no improvement for {patience} epochs)")
                break
    
    print(f"\n✅ GNN model trained! Best val loss: {best_val_loss:.6f}")
    print(f"   Saved to: {save_path}")
    
    # Quick accuracy test
    model.eval()
    with torch.no_grad():
        test_pred = model(X_val[0], edge_index)
        test_actual = y_val[0]
        mae = torch.mean(torch.abs(test_pred - test_actual)).item() * 100
        print(f"   Sample MAE: {mae:.1f}% density units")


if __name__ == "__main__":
    print("--- Smart Traffic Model Training ---")
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    
    train_anomaly_model()
    train_lstm_model()
    train_gnn_model()
    
    print("\nTraining Complete! You can now use the models in your backend.")
