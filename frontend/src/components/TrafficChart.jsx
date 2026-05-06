import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const TrafficChart = ({ trafficData, predictions }) => {
  // We'll aggregate the average density for chart visualization.
  // In a real app, this might track historical data. 
  // Here we just display a snapshot comparing current vs predicted for top nodes.
  
  const chartData = useMemo(() => {
    if (!trafficData || Object.keys(trafficData).length === 0) return [];
    
    // Take first 5 nodes for clarity
    const keys = Object.keys(trafficData).slice(0, 5);
    
    return keys.map(key => ({
      name: key.replace('node_', ''),
      current: trafficData[key] || 0,
      predicted: predictions && predictions[key] ? predictions[key] : 0
    }));
  }, [trafficData, predictions]);

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend />
          <Line type="monotone" dataKey="current" name="Live Density" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="predicted" name="Predicted (+15m)" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.5rem' }}>
        *Note: Predictions are AI-generated and may occasionally be incorrect due to unforeseen traffic events.
      </div>
    </div>
  );
};

export default TrafficChart;
