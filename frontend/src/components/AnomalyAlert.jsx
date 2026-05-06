import React from 'react';
import { AlertTriangle } from 'lucide-react';

const AnomalyAlert = ({ anomalies }) => {
  return (
    <div>
      <h2 className="section-title" style={{ color: '#fca5a5', marginBottom: '0.25rem' }}>
        <AlertTriangle />
        Traffic Alerts
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Live updates on sudden traffic jams, accidents, or abnormal congestion detected by our system.
      </p>

      {(!anomalies || anomalies.length === 0) ? (
        <p style={{ color: '#94a3b8' }}>No Traffic Issues detected. Traffic is flowing smoothly.</p>
      ) : (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {anomalies.map((anomaly, idx) => (
            <div key={idx} className="alert-item">
              <h4>{anomaly.type.replace('_', ' ').toUpperCase()}</h4>
              <p>{anomaly.description}</p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#fca5a5', fontWeight: 600 }}>
                Severity: {anomaly.severity} | Density: {anomaly.density}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnomalyAlert;
