import React from 'react';
import { useAuth } from '../context/AuthContext';
import { History, MapPin, Clock, ArrowRight, Trash2 } from 'lucide-react';

const HistoryPanel = ({ onSelectRoute }) => {
  const { user } = useAuth();

  if (!user || !user.history || user.history.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
        <History size={32} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>No route history yet.</p>
        <small style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>Saved routes will appear here.</small>
      </div>
    );
  }

  return (
    <div className="glass-panel">
      <h2 className="section-title">
        <History size={20} />
        Recent Routes
      </h2>
      <div className="history-list">
        {user.history.map((item, idx) => (
          <div key={idx} className="history-item" onClick={() => onSelectRoute(item.path)}>
            <div className="history-main">
              <div className="history-route">
                <span className="node-name">{item.start_node.split('(')[0]}</span>
                <ArrowRight size={14} />
                <span className="node-name">{item.end_node.split('(')[0]}</span>
              </div>
              <div className="history-meta">
                <span><MapPin size={12} /> {item.distance} km</span>
                <span><Clock size={12} /> {new Date(item.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="history-badge">{item.time_taken}m</div>
          </div>
        ))}
      </div>

      <style>{`
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .history-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--accent-blue);
          transform: translateX(4px);
        }

        .history-main {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }

        .history-route {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
          overflow: hidden;
        }

        .node-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        .history-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
          flex-wrap: wrap;
        }

        .history-meta span { display: flex; align-items: center; gap: 0.25rem; }

        .history-badge {
          background: rgba(96, 165, 250, 0.1);
          color: var(--accent-blue);
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: bold;
          white-space: nowrap;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};

export default HistoryPanel;
