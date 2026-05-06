import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import IsolationForest

try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense
    from sklearn.preprocessing import MinMaxScaler
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

def train_anomaly_model(csv_path, save_path="saved_models/anomaly.pkl"):
    """
    Trains an Isolation Forest model for anomaly detection.
    Expects a CSV with columns: ['timestamp', 'node_id', 'density']
    """
    print(f"Loading data from {csv_path}...")
    # 1. Load Data
    # df = pd.read_csv(csv_path)
    
    # --- MOCK DATA GENERATION FOR DEMONSTRATION ---
    # If you don't have a CSV yet, this creates a fake dataset to train on
    print("Generating synthetic data for training demonstration...")
    np.random.seed(42)
    normal_data = np.random.normal(loc=40, scale=10, size=1000) # Normal traffic (mean 40 density)
    anomaly_data = np.random.normal(loc=95, scale=5, size=50)   # Anomalies (accidents/jams)
    data = np.concatenate([normal_data, anomaly_data]).reshape(-1, 1)
    # ----------------------------------------------
    
    # In a real scenario with CSV:
    # X = df[['density']].values
    X = data
    
    print("Training Isolation Forest...")
    # 2. Initialize and train model
    # contamination is the estimated percentage of anomalies in the dataset
    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(X)
    
    # 3. Save the model
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    joblib.dump(model, save_path)
    print(f"✅ Anomaly model saved successfully to {save_path}")

def train_lstm_model(csv_path, save_path="saved_models/lstm.h5"):
    """
    Trains an LSTM model for future traffic prediction.
    Expects a CSV with time-series traffic data.
    """
    print("\n--- LSTM Training ---")
    if not TF_AVAILABLE:
        print("⚠️  TensorFlow is not installed! Skipping LSTM training.")
        print("To run this, run: pip install tensorflow")
        return

    print("LSTM Training template ready.")
    
    """
    # 1. Load Data
    df = pd.read_csv(csv_path)
    # Pivot so each column is a node, rows are timestamps
    # df_pivot = df.pivot(index='timestamp', columns='node_id', values='density')
    
    # 2. Scale Data
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(df_pivot.values)
    joblib.dump(scaler, "saved_models/scaler.pkl")
    
    # 3. Create Sequences (e.g., look back 10 steps to predict the next step)
    def create_sequences(data, seq_length=10):
        X, y = [], []
        for i in range(len(data) - seq_length):
            X.append(data[i:i+seq_length])
            y.append(data[i+seq_length])
        return np.array(X), np.array(y)
        
    X, y = create_sequences(scaled_data)
    
    # 4. Build LSTM Model
    model = Sequential([
        LSTM(64, activation='relu', return_sequences=True, input_shape=(X.shape[1], X.shape[2])),
        LSTM(32, activation='relu'),
        Dense(X.shape[2]) # Output layer size = number of nodes
    ])
    
    model.compile(optimizer='adam', loss='mse')
    
    # 5. Train and Save
    print("Training LSTM...")
    model.fit(X, y, epochs=20, batch_size=32, validation_split=0.2)
    
    model.save(save_path)
    print(f"✅ LSTM model saved to {save_path}")
    """

if __name__ == "__main__":
    print("--- Smart Traffic Model Training ---")
    
    # Create save directory
    os.makedirs("../saved_models", exist_ok=True)
    
    # Train the Anomaly Model
    train_anomaly_model(csv_path="dummy_path.csv", save_path="../saved_models/anomaly.pkl")
    
    # Train the LSTM Model (uncomment inside the function when TF is installed)
    train_lstm_model(csv_path="dummy_path.csv", save_path="../saved_models/lstm.h5")
    
    print("\nNext steps: Update backend/models/anomaly_model.py to load 'anomaly.pkl' instead of using the Mock logic!")
