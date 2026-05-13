import React, { useState } from 'react';
import { AlertTriangle, X, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const IncidentModal = ({ isOpen, onClose, citiesDb, apiUrl }) => {
  const { user } = useAuth();
  const [nodeId, setNodeId] = useState('');
  const [incidentType, setIncidentType] = useState('Accident');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nodeId) {
      setError('Please select a location');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch(`${apiUrl}/api/live/incident`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node_id: nodeId,
          incident_type: incidentType,
          description,
          user_id: user?.email || 'Anonymous'
        })
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        // We will rely on Dashboard to show a toast, or we can just close
        onClose();
      } else {
        setError(data.message || 'Failed to submit incident');
      }
    } catch (err) {
      setError('Network error submitting incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
        
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', marginBottom: '1.5rem', marginTop: 0 }}>
          <AlertTriangle size={24} />
          Report Incident
        </h2>
        
        {error && <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Incident Type</label>
            <select 
              value={incidentType} 
              onChange={e => setIncidentType(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
            >
              <option value="Accident">Accident</option>
              <option value="Roadblock">Roadblock</option>
              <option value="Hazard">Hazard / Debris</option>
              <option value="Heavy Traffic">Heavy Traffic</option>
              <option value="Construction">Construction</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nearest Location / Intersection</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0 0.5rem' }}>
              <MapPin size={18} color="var(--text-secondary)" />
              <select 
                value={nodeId} 
                onChange={e => setNodeId(e.target.value)}
                style={{ flex: 1, padding: '0.75rem 0', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value="">Select a location...</option>
                {Object.keys(citiesDb).map(node => (
                  <option key={node} value={node}>{node}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Description (Optional)</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g., Two cars involved, blocking left lane"
              rows={3}
              style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              marginTop: '0.5rem', padding: '0.75rem', borderRadius: '8px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white',
              border: 'none', fontWeight: 600, cursor: isSubmitting ? 'wait' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default IncidentModal;
