import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const LiveTicker = ({ trafficData }) => {
  // Get top 5 most congested nodes
  const topCongested = useMemo(() => {
    if (!trafficData) return [];
    
    return Object.entries(trafficData)
      .map(([id, density]) => ({ id, density }))
      .sort((a, b) => b.density - a.density)
      .slice(0, 5);
  }, [trafficData]);

  const getDensityClass = (density) => {
    if (density < 40) return 'density-low';
    if (density < 75) return 'density-med';
    return 'density-high';
  };

  const getIcon = (density) => {
    if (density < 40) return <TrendingDown size={16} />;
    if (density < 75) return <Minus size={16} />;
    return <TrendingUp size={16} />;
  };

  return (
    <div>
      <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>Top Congested Places</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        The top 5 locations currently experiencing the highest traffic density across the network.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {topCongested.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>Waiting for data...</p>
        ) : (
          topCongested.map((node) => (
            <div key={node.id} className="ticker-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#94a3b8' }}>{node.id}</span>
              </div>
              <div className={`density-indicator ${getDensityClass(node.density)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {getIcon(node.density)}
                {node.density}%
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveTicker;
