import React, { useState } from 'react';
import { X, ShieldAlert, BadgeInfo, CheckCircle } from 'lucide-react';

const EmergencyAuthModal = ({ isOpen, onClose, onAuthSuccess, apiUrl, token }) => {
  const [reason, setReason] = useState('');
  const [idBadge, setIdBadge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError("Please select an authorization type.");
      return;
    }
    
    if (reason !== 'medical' && !idBadge.trim()) {
      setError("Please provide an ID or Badge Number for verification.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/auth/emergency-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason, id_badge: idBadge })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to authorize");
      }

      await onAuthSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div className="glass-panel" style={{
        width: '90%', maxWidth: '500px', padding: '2rem', position: 'relative',
        background: 'rgba(30, 30, 30, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '1rem', right: '1rem', background: 'none',
          border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
        }}>
          <X size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#ef4444' }}>
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Emergency Authorization</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Request access to Emergency Service Mode</p>
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Authorization Type
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontSize: '1rem'
              }}
            >
              <option value="" disabled>Select your role...</option>
              <option value="police">Police Officer</option>
              <option value="ambulance">Ambulance Driver</option>
              <option value="fire">Fire Brigade</option>
              <option value="medical">Normal User (Temporary Medical Emergency)</option>
            </select>
          </div>

          {reason && reason !== 'medical' && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <BadgeInfo size={16} /> ID or Badge Number
              </label>
              <input
                type="text"
                placeholder="Enter verification ID..."
                value={idBadge}
                onChange={(e) => setIdBadge(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px',
                  background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: '1rem'
                }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                In a production environment, this badge number is verified against the national registry.
              </p>
            </div>
          )}

          {reason === 'medical' && (
            <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#f59e0b', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>You are requesting a temporary medical emergency pass. This pass will automatically expire in 2 hours. Limited to 3 requests per day with a 2-hour cooldown. Misuse may result in account suspension.</span>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.875rem', borderRadius: '8px', fontWeight: 600, fontSize: '1rem',
              background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: loading ? 'var(--text-secondary)' : 'white',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem', transition: 'all 0.2s ease',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
          >
            {loading ? 'Verifying...' : 'Request Authorization'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmergencyAuthModal;
