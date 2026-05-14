import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const TABS = [
  { id: 'live', label: '📊 Live Density', icon: '📊' },
  { id: 'timeline', label: '📈 Timeline', icon: '📈' },
  { id: 'accuracy', label: '🎯 Prediction Accuracy', icon: '🎯' },
];

const NODE_COLORS = [
  '#3b82f6', '#a855f7', '#22c55e', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6'
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.95)',
      border: '1px solid rgba(139, 92, 246, 0.3)',
      borderRadius: '12px',
      padding: '0.75rem 1rem',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
          <span style={{ color: '#e2e8f0', fontSize: '0.8rem' }}>{entry.name}:</span>
          <span style={{ color: entry.color, fontWeight: 700, fontSize: '0.85rem' }}>
            {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            {entry.name.includes('Accuracy') ? '%' : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

const TrafficChart = ({ trafficData, predictions }) => {
  const [activeTab, setActiveTab] = useState('live');
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [timelineHistory, setTimelineHistory] = useState([]);
  const [accuracyHistory, setAccuracyHistory] = useState([]);
  const prevPredictions = useRef({});
  const tickCount = useRef(0);

  // Get all available node names
  const allNodes = useMemo(() => {
    if (!trafficData) return [];
    return Object.keys(trafficData).sort();
  }, [trafficData]);

  // Auto-select nodes when the available list changes (filtering by route or area)
  useEffect(() => {
    if (allNodes.length === 0) {
      setSelectedNodes([]);
      return;
    }

    // Filter out any currently selected nodes that are no longer in the available list
    const stillValid = selectedNodes.filter(node => allNodes.includes(node));
    
    // If we have no valid nodes selected, or the list changed significantly (e.g. new exploration)
    // we take the first few from the new list.
    if (stillValid.length === 0) {
      setSelectedNodes(allNodes.slice(0, 8)); // Show up to 8 nodes by default
    } else {
      setSelectedNodes(stillValid);
    }
  }, [allNodes]);

  // Track timeline history (append new snapshots every update)
  useEffect(() => {
    if (!trafficData || Object.keys(trafficData).length === 0) return;

    const now = new Date();
    const timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const snapshot = { time: timeLabel };
    selectedNodes.forEach(node => {
      snapshot[node] = trafficData[node] ?? 0;
      if (predictions && predictions[node]) {
        snapshot[node + '_pred'] = predictions[node];
      }
    });

    setTimelineHistory(prev => {
      const updated = [...prev, snapshot];
      return updated.slice(-30); // Keep last 30 data points
    });
  }, [trafficData, selectedNodes]);

  // Track prediction accuracy over time
  const updateAccuracy = useCallback(() => {
    if (!trafficData || !prevPredictions.current || Object.keys(prevPredictions.current).length === 0) {
      // Store current predictions for next comparison
      if (predictions) {
        prevPredictions.current = { ...predictions };
      }
      return;
    }

    tickCount.current += 1;
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let totalError = 0;
    let count = 0;

    selectedNodes.forEach(node => {
      const predicted = prevPredictions.current[node];
      const actual = trafficData[node];
      if (predicted !== undefined && actual !== undefined) {
        const error = Math.abs(predicted - actual);
        totalError += error;
        count++;
      }
    });

    if (count > 0) {
      const avgError = totalError / count;
      const accuracy = Math.max(0, 100 - avgError);

      setAccuracyHistory(prev => {
        const updated = [...prev, {
          time: timeLabel,
          accuracy: parseFloat(accuracy.toFixed(1)),
          avgError: parseFloat(avgError.toFixed(1)),
          tick: tickCount.current
        }];
        return updated.slice(-30);
      });
    }

    // Store current predictions for next comparison
    if (predictions) {
      prevPredictions.current = { ...predictions };
    }
  }, [trafficData, predictions, selectedNodes]);

  useEffect(() => {
    updateAccuracy();
  }, [trafficData]);

  // ── Live Density Bar Chart Data ──
  const barData = useMemo(() => {
    if (!trafficData) return [];
    return selectedNodes.map(key => ({
      name: key.split(' (')[0], // Short name
      fullName: key,
      current: trafficData[key] || 0,
      predicted: predictions && predictions[key] ? predictions[key] : 0,
      diff: predictions && predictions[key]
        ? Math.round(predictions[key] - (trafficData[key] || 0))
        : 0
    }));
  }, [trafficData, predictions, selectedNodes]);

  const toggleNode = (node) => {
    setSelectedNodes(prev => {
      if (prev.includes(node)) {
        return prev.filter(n => n !== node);
      }
      if (prev.length >= 10) return prev; // Max 10
      return [...prev, node];
    });
  };

  // ── Avg accuracy stat ──
  const avgAccuracy = useMemo(() => {
    if (accuracyHistory.length === 0) return null;
    const sum = accuracyHistory.reduce((a, b) => a + b.accuracy, 0);
    return (sum / accuracyHistory.length).toFixed(1);
  }, [accuracyHistory]);

  const getBarColor = (density) => {
    if (density < 30) return '#22c55e';
    if (density < 60) return '#eab308';
    if (density < 80) return '#f97316';
    return '#ef4444';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem' }}>
      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: '0.5rem',
        background: 'rgba(15, 23, 42, 0.5)',
        padding: '4px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(168,85,247,0.3))'
                : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 2px 12px rgba(59,130,246,0.2)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Node Selector Pills */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.35rem',
        maxHeight: '60px', overflowY: 'auto',
        padding: '0.25rem'
      }}>
        {allNodes.map((node, i) => {
          const isSelected = selectedNodes.includes(node);
          return (
            <button
              key={node}
              onClick={() => toggleNode(node)}
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '20px',
                border: `1px solid ${isSelected ? NODE_COLORS[selectedNodes.indexOf(node) % NODE_COLORS.length] : 'rgba(255,255,255,0.1)'}`,
                background: isSelected
                  ? `${NODE_COLORS[selectedNodes.indexOf(node) % NODE_COLORS.length]}22`
                  : 'transparent',
                color: isSelected ? '#fff' : '#64748b',
                fontSize: '0.65rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {node.split(' (')[0]}
            </button>
          );
        })}
      </div>

      {/* Chart Area */}
      <div style={{ height: '300px', width: '100%', marginTop: '0.5rem' }}>

        {/* ── TAB: Live Density ── */}
        {activeTab === 'live' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 20, left: -10, bottom: 30 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                angle={-25}
                textAnchor="end"
                height={50}
              />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
              <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Critical', fill: '#ef4444', fontSize: 10, position: 'right' }} />
              <ReferenceLine y={40} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'Moderate', fill: '#eab308', fontSize: 10, position: 'right' }} />
              <Bar dataKey="current" name=" Live Density" fill="#3bf66aff" radius={[6, 6, 0, 0]} barSize={20} isAnimationActive={false}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.current)} />
                ))}
              </Bar>
              <Bar dataKey="predicted" name="Predicted (+15m)" fill="url(#predGrad)" radius={[6, 6, 0, 0]} barSize={20} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* ── TAB: Timeline ── */}
        {activeTab === 'timeline' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineHistory} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                {selectedNodes.map((node, i) => (
                  <linearGradient key={node} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NODE_COLORS[i % NODE_COLORS.length]} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={NODE_COLORS[i % NODE_COLORS.length]} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }} />
              {selectedNodes.map((node, i) => (
                <Area
                  key={node}
                  type="monotone"
                  dataKey={node}
                  name={node.split(' (')[0]}
                  stroke={NODE_COLORS[i % NODE_COLORS.length]}
                  fill={`url(#grad-${i})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* ── TAB: Prediction Accuracy ── */}
        {activeTab === 'accuracy' && (
          <>
            {/* Stat Cards */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: '12px',
                padding: '0.6rem 0.8rem',
                textAlign: 'center'
              }}>
                <div style={{ color: '#22c55e', fontSize: '1.4rem', fontWeight: 800 }}>
                  {avgAccuracy ? `${avgAccuracy}%` : '—'}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>Avg Accuracy</div>
              </div>
              <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '12px',
                padding: '0.6rem 0.8rem',
                textAlign: 'center'
              }}>
                <div style={{ color: '#3b82f6', fontSize: '1.4rem', fontWeight: 800 }}>
                  {accuracyHistory.length > 0
                    ? `${accuracyHistory[accuracyHistory.length - 1].accuracy}%`
                    : '—'}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>Latest</div>
              </div>
              <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))',
                border: '1px solid rgba(168,85,247,0.2)',
                borderRadius: '12px',
                padding: '0.6rem 0.8rem',
                textAlign: 'center'
              }}>
                <div style={{ color: '#a855f7', fontSize: '1.4rem', fontWeight: 800 }}>
                  {accuracyHistory.length}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>Samples</div>
              </div>
            </div>

            {accuracyHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={accuracyHistory} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }} />
                  <ReferenceLine y={90} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Target 90%', fill: '#22c55e', fontSize: 10, position: 'right' }} />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    name="🎯 Accuracy"
                    stroke="#22c55e"
                    fill="url(#accGrad)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#22c55e' }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgError"
                    name="📉 Avg Error"
                    stroke="#ef4444"
                    fill="url(#errGrad)"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '180px', color: '#64748b', fontSize: '0.85rem',
                background: 'rgba(15,23,42,0.3)', borderRadius: '12px',
                border: '1px dashed rgba(255,255,255,0.1)'
              }}>
                ⏳ Collecting prediction data... accuracy chart will appear after a few updates.
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: '#475569', fontSize: '0.7rem', padding: '0.25rem 0' }}>
        {activeTab === 'accuracy'
          ? '🎯 Accuracy = 100% − |predicted − actual|. Compared each update cycle.'
          : '💡 Click node pills above to toggle which locations are displayed.'}
      </div>
    </div>
  );
};

export default TrafficChart;
