"""
Spatial-Temporal Graph Neural Network (GNN) for Traffic Prediction.

Replaces the per-node LSTM with a graph-aware model that captures
inter-intersection relationships using GraphSAGE message passing.

Input Features per node (13 total):
  - traffic_density (0-100)
  - hour_sin, hour_cos (cyclical time encoding)
  - day_of_week (7 one-hot features)
  - temperature, precipitation, wind_speed (weather)

Architecture:
  SAGEConv(13→64) → ReLU → Dropout → SAGEConv(64→32) → ReLU → Linear(32→1)
"""

import os
import math
import random
import numpy as np
from datetime import datetime
from collections import deque

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

try:
    from torch_geometric.nn import SAGEConv
    from torch_geometric.data import Data
    PYG_AVAILABLE = True
except ImportError:
    PYG_AVAILABLE = False

GNN_AVAILABLE = TORCH_AVAILABLE and PYG_AVAILABLE


# ─── PyTorch GNN Module ───

if GNN_AVAILABLE:
    class TrafficGNNModule(nn.Module):
        """
        2-layer GraphSAGE with a linear prediction head.
        Designed to scale from 50 to 200+ nodes.
        """
        def __init__(self, in_features=13, hidden=64, out_features=1, dropout=0.2):
            super().__init__()
            self.conv1 = SAGEConv(in_features, hidden)
            self.conv2 = SAGEConv(hidden, hidden // 2)
            self.head = nn.Linear(hidden // 2, out_features)
            self.dropout = dropout
        
        def forward(self, x, edge_index):
            # Layer 1: Aggregate neighbor features
            x = self.conv1(x, edge_index)
            x = F.relu(x)
            x = F.dropout(x, p=self.dropout, training=self.training)
            
            # Layer 2: Refine with deeper neighborhood
            x = self.conv2(x, edge_index)
            x = F.relu(x)
            
            # Prediction head
            x = self.head(x)
            return x.squeeze(-1)  # [N] predicted densities


# ─── Feature Engineering ───

def encode_time_features():
    """
    Encodes current time as cyclical features + day-of-week one-hot.
    Returns: list of 9 floats [hour_sin, hour_cos, dow_0, ..., dow_6]
    """
    now = datetime.now()
    hour = now.hour + now.minute / 60.0
    
    # Cyclical encoding: sin/cos so 23:00 is close to 00:00
    hour_sin = math.sin(2 * math.pi * hour / 24.0)
    hour_cos = math.cos(2 * math.pi * hour / 24.0)
    
    # Day of week one-hot (Monday=0, Sunday=6)
    dow = now.weekday()
    dow_onehot = [1.0 if i == dow else 0.0 for i in range(7)]
    
    return [hour_sin, hour_cos] + dow_onehot


def encode_weather_features(weather_dict):
    """
    Normalizes weather features to roughly [-1, 1] range.
    Input: {temperature, precipitation, wind_speed}
    Returns: list of 3 floats
    """
    if weather_dict is None:
        return [0.0, 0.0, 0.0]
    
    # Normalize: temp around 25±25°C, precip 0-50mm, wind 0-50km/h
    temp = (weather_dict.get("temperature", 25.0) - 25.0) / 25.0
    precip = min(weather_dict.get("precipitation", 0.0) / 25.0, 2.0)
    wind = min(weather_dict.get("wind_speed", 5.0) / 25.0, 2.0)
    
    return [temp, precip, wind]


# ─── Main GNN Predictor Class ───

class SpatioTemporalGNN:
    """
    Drop-in replacement for MockLSTMPredictor / RealLSTMPredictor.
    
    Same interface:
      - predict(current_traffic) → {node_id: predicted_density}
      - improve_model(history_data, actual_data) → bool
    
    But internally uses a graph neural network that models spatial dependencies.
    """
    
    def __init__(self, model_dir="saved_models"):
        self.model_path = os.path.join(model_dir, "gnn.pt")
        self.history = {}  # node_id → deque of last 10 densities
        self.seq_length = 10
        self.node_order = []  # Fixed ordering for tensor construction
        self.node_to_idx = {}
        self.edge_index = None
        self.model = None
        self.is_ready = False
        self.weather_cache = {}  # region → weather dict
        
        self._build_graph_topology()
        self._load_or_init_model()
    
    def _build_graph_topology(self):
        """
        Builds the edge_index tensor from the existing NetworkX graph.
        This captures the spatial relationships between intersections.
        """
        if not GNN_AVAILABLE:
            return
        
        try:
            from optimization.graph_builder import get_graph
            G = get_graph()
            
            # Fixed node ordering (deterministic)
            self.node_order = sorted(G.nodes())
            self.node_to_idx = {node: i for i, node in enumerate(self.node_order)}
            
            # Build edge_index [2, E] — both directions for undirected graph
            src, dst = [], []
            for u, v in G.edges():
                i, j = self.node_to_idx[u], self.node_to_idx[v]
                src.extend([i, j])  # Both directions
                dst.extend([j, i])
            
            self.edge_index = torch.tensor([src, dst], dtype=torch.long)
            print(f"📊 GNN graph topology: {len(self.node_order)} nodes, {len(G.edges())} edges")
            
        except Exception as e:
            print(f"⚠️  Failed to build GNN graph topology: {e}")
    
    def _load_or_init_model(self):
        """Load saved model or initialize a fresh one."""
        if not GNN_AVAILABLE or self.edge_index is None:
            if not GNN_AVAILABLE:
                print("⚠️  PyTorch Geometric not available. GNN disabled, using fallback predictions.")
            return
        
        self.model = TrafficGNNModule(in_features=13, hidden=64, out_features=1)
        
        if os.path.exists(self.model_path):
            try:
                state = torch.load(self.model_path, map_location="cpu", weights_only=True)
                self.model.load_state_dict(state)
                print("✅ GNN model loaded from saved checkpoint!")
            except Exception as e:
                print(f"⚠️  Could not load GNN checkpoint: {e}. Using fresh model.")
        else:
            print("🧠 GNN model initialized (no checkpoint found — will learn online).")
        
        self.model.eval()
        self.is_ready = True
    
    def set_weather(self, weather_data):
        """
        Update the weather cache. Called by the simulator.
        weather_data: {region_name: {temperature, precipitation, wind_speed}}
        """
        self.weather_cache = weather_data or {}
    
    def _get_weather_for_node(self, node_id):
        """Look up weather for a node based on its region."""
        if not self.weather_cache:
            return {"temperature": 25.0, "precipitation": 0.0, "wind_speed": 5.0}
        
        try:
            from models.weather_service import _get_region_for_node
            region = _get_region_for_node(node_id)
            return self.weather_cache.get(region, {"temperature": 25.0, "precipitation": 0.0, "wind_speed": 5.0})
        except Exception:
            return {"temperature": 25.0, "precipitation": 0.0, "wind_speed": 5.0}
    
    def _build_feature_matrix(self, current_traffic):
        """
        Constructs the [N, 13] feature tensor for the GNN.
        
        Features per node:
          [0]    : normalized traffic density (0-1)
          [1-2]  : hour_sin, hour_cos
          [3-9]  : day_of_week one-hot (7 features)
          [10-12]: temperature, precipitation, wind_speed (normalized)
        """
        time_features = encode_time_features()  # 9 values, shared across all nodes
        
        features = []
        for node_id in self.node_order:
            density = current_traffic.get(node_id, 50) / 100.0  # Normalize to [0, 1]
            weather = self._get_weather_for_node(node_id)
            weather_feat = encode_weather_features(weather)  # 3 values
            
            # [density, hour_sin, hour_cos, dow_0..6, temp, precip, wind] = 13
            node_feat = [density] + time_features + weather_feat
            features.append(node_feat)
        
        return torch.tensor(features, dtype=torch.float32)
    
    def _update_history(self, current_traffic):
        """Maintain a rolling window of traffic history per node."""
        for node, density in current_traffic.items():
            if node not in self.history:
                self.history[node] = deque([density] * self.seq_length, maxlen=self.seq_length)
            else:
                self.history[node].append(density)
    
    def predict(self, current_traffic, weather=None):
        """
        Predicts future traffic density for all nodes.
        
        Args:
            current_traffic: dict of {node_id: density (0-100)}
            weather: optional dict from WeatherService (auto-uses cache if None)
        
        Returns:
            dict of {node_id: predicted_density (0-100)}
        """
        self._update_history(current_traffic)
        
        if weather:
            self.set_weather(weather)
        
        # ─── Fallback: Mock predictions if GNN is not ready ───
        if not self.is_ready or not GNN_AVAILABLE:
            predictions = {}
            for node, density in current_traffic.items():
                trend = (50 - density) * 0.1
                predicted = density + trend + random.uniform(-5, 5)
                predictions[node] = max(0, min(100, int(predicted)))
            return predictions
        
        # ─── GNN Inference ───
        try:
            self.model.eval()
            with torch.no_grad():
                x = self._build_feature_matrix(current_traffic)
                pred = self.model(x, self.edge_index)
                
                # Convert back to 0-100 density scale
                predictions = {}
                for i, node_id in enumerate(self.node_order):
                    raw = pred[i].item() * 100.0  # De-normalize
                    predictions[node_id] = max(0, min(100, int(raw)))
                
                return predictions
                
        except Exception as e:
            print(f"⚠️  GNN prediction failed: {e}. Falling back to mock.")
            predictions = {}
            for node, density in current_traffic.items():
                trend = (50 - density) * 0.1
                predicted = density + trend + random.uniform(-5, 5)
                predictions[node] = max(0, min(100, int(predicted)))
            return predictions
    
    def improve_model(self, history_data, actual_data):
        """
        Online learning: Fine-tune the GNN on new live data.
        Called by the simulator's 15-minute feedback loop.
        
        Args:
            history_data: dict of {node_id: [10 history values]} (unused for GNN, kept for interface compat)
            actual_data: dict of {node_id: actual_density} — the ground truth
        
        Returns:
            bool: True if training succeeded
        """
        if not self.is_ready or not GNN_AVAILABLE:
            return False
        
        try:
            # Build target tensor from actual data
            targets = []
            for node_id in self.node_order:
                density = actual_data.get(node_id, 50) / 100.0
                targets.append(density)
            
            y = torch.tensor(targets, dtype=torch.float32)
            
            # Build feature matrix from the actual data (self-supervised snapshot)
            x = self._build_feature_matrix(actual_data)
            
            # Fine-tune
            self.model.train()
            optimizer = torch.optim.Adam(self.model.parameters(), lr=0.0005)
            loss_fn = nn.MSELoss()
            
            for epoch in range(3):
                optimizer.zero_grad()
                pred = self.model(x, self.edge_index)
                loss = loss_fn(pred, y)
                loss.backward()
                optimizer.step()
            
            self.model.eval()
            
            final_loss = loss.item()
            print(f"🧠 GNN fine-tuned (3 epochs). Loss: {final_loss:.6f}")
            
            # Save checkpoint periodically
            try:
                os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
                torch.save(self.model.state_dict(), self.model_path)
            except Exception:
                pass
            
            return True
            
        except Exception as e:
            print(f"⚠️  GNN fine-tuning failed: {e}")
            return False


# ─── Factory alias for backward compatibility ───
# The simulator imports MockLSTMPredictor — this ensures GNN is used when available

MockLSTMPredictor = SpatioTemporalGNN
