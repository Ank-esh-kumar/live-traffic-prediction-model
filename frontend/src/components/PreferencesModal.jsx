import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Bell, MapPin, Zap, Save, Settings } from 'lucide-react';

const PreferencesModal = ({ isOpen, onClose }) => {
  const { user, updatePreferences } = useAuth();
  const [prefs, setPrefs] = useState({
    theme: 'dark',
    notifications_enabled: false,
    location_enabled: false,
    preferred_mode: 'fastest'
  });
  const [permissionError, setPermissionError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.preferences) {
      setPrefs(user.preferences);
    }
  }, [user]);

  if (!isOpen) return null;

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPrefs(prev => ({ ...prev, notifications_enabled: true }));
        setPermissionError('');
      } else if (permission === 'denied') {
        setPermissionError('Notification permission denied. Please enable it from browser settings.');
      }
    } catch (err) {
      setPermissionError('Browser does not support notifications.');
    }
  };

  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      setPermissionError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setPrefs(prev => ({ ...prev, location_enabled: true }));
        setPermissionError('');
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionError('Location access denied. Please enable it from browser settings to see nearby traffic.');
        } else {
          setPermissionError('Failed to get location.');
        }
      }
    );
  };

  const handleSave = async () => {
    setLoading(true);
    await updatePreferences(prefs);
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay full-screen">
      <div className="modal-content prefs-full-screen">
        <header className="prefs-header">
          <div className="header-left">
             <Settings size={28} className="settings-icon" />
             <div>
               <h1>Preferences</h1>
               <p>Manage your account settings and application permissions</p>
             </div>
          </div>
          <button className="close-full-screen" onClick={onClose} title="Close Settings">
            <X size={24} />
            <span>Esc</span>
          </button>
        </header>

        <main className="prefs-main-content">
          <div className="prefs-section-container">
            {permissionError && (
              <div className="permission-alert">
                <div className="alert-content">
                  <p>{permissionError}</p>
                  <small>Go to: Browser Settings → Privacy & Security → Site Settings</small>
                </div>
              </div>
            )}

            <div className="settings-grid">
              <section className="settings-group">
                <h3><Bell size={20} /> System Alerts</h3>
                <div className="pref-item-modern">
                  <div className="pref-info">
                    <div className="pref-title">Real-time Notifications</div>
                    <div className="pref-desc">Get instant alerts for accidents and heavy traffic on your active routes.</div>
                  </div>
                  <button 
                    className={`toggle-btn-modern ${prefs.notifications_enabled ? 'active' : ''}`}
                    onClick={prefs.notifications_enabled ? () => setPrefs(p => ({ ...p, notifications_enabled: false })) : requestNotificationPermission}
                  >
                    <div className="toggle-slider"></div>
                  </button>
                </div>
              </section>

              <section className="settings-group">
                <h3><MapPin size={20} /> Geolocation</h3>
                <div className="pref-item-modern">
                  <div className="pref-info">
                    <div className="pref-title">Location Services</div>
                    <div className="pref-desc">Allow the system to show traffic congestion based on your current physical location.</div>
                  </div>
                  <button 
                    className={`toggle-btn-modern ${prefs.location_enabled ? 'active' : ''}`}
                    onClick={prefs.location_enabled ? () => setPrefs(p => ({ ...p, location_enabled: false })) : requestLocationPermission}
                  >
                    <div className="toggle-slider"></div>
                  </button>
                </div>
              </section>

              <section className="settings-group">
                <h3><Zap size={20} /> Routing Defaults</h3>
                <div className="pref-item-modern">
                  <div className="pref-info">
                    <div className="pref-title">Primary Algorithm</div>
                    <div className="pref-desc">Which AI model should we use to calculate your initial route?</div>
                  </div>
                  <select 
                    value={prefs.preferred_mode}
                    onChange={(e) => setPrefs(p => ({ ...p, preferred_mode: e.target.value }))}
                    className="pref-select-modern"
                  >
                    <option value="fastest">Fastest Time (AI Optimized)</option>
                    <option value="shortest">Shortest Distance (Geometric)</option>
                    <option value="eco">Eco-Friendly (Low Emission)</option>
                  </select>
                </div>
              </section>
            </div>
          </div>
        </main>

        <footer className="prefs-footer">
          <div className="footer-content">
            <p className="footer-note">Settings are synced to your cloud account.</p>
            <div className="footer-actions">
              <button className="cancel-btn" onClick={onClose}>Cancel</button>
              <button className="save-btn-modern" onClick={handleSave} disabled={loading}>
                {loading ? <span className="spinner"></span> : <><Save size={20} /> Save & Apply Changes</>}
              </button>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        .modal-overlay.full-screen {
          background: #0f172a;
          display: block;
          overflow-y: auto;
        }

        .prefs-full-screen {
          background: transparent;
          border: none;
          padding: 0;
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          box-shadow: none;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .prefs-header {
          padding: 3rem 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-left { display: flex; align-items: center; gap: 1.5rem; }
        .settings-icon { color: var(--accent-blue); }
        .prefs-header h1 { font-size: 2.5rem; font-weight: 800; margin: 0; }
        .prefs-header p { color: var(--text-secondary); font-size: 1.1rem; margin: 0; }

        .close-full-screen {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .close-full-screen span { font-size: 0.8rem; font-weight: 700; opacity: 0.5; }
        .close-full-screen:hover { background: rgba(255, 255, 255, 0.15); transform: translateY(-2px); }

        .prefs-main-content {
          flex: 1;
          padding: 4rem 0;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
        }

        .settings-group h3 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.1rem;
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .pref-item-modern {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 3rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s;
        }

        .pref-item-modern:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(59, 130, 246, 0.2);
        }

        .pref-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
        .pref-desc { font-size: 1rem; color: var(--text-secondary); line-height: 1.6; }

        .toggle-btn-modern {
          width: 64px;
          height: 32px;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          cursor: pointer;
          transition: all 0.3s;
        }

        .toggle-btn-modern.active { background: #3b82f6; border-color: #3b82f6; box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
        .toggle-slider { width: 24px; height: 24px; background: #fff; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .toggle-btn-modern.active .toggle-slider { transform: translateX(32px); }

        .pref-select-modern {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          font-size: 1rem;
          outline: none;
          min-width: 250px;
        }

        .prefs-footer {
          padding: 3rem 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-content { display: flex; justify-content: space-between; align-items: center; }
        .footer-note { color: var(--text-secondary); font-size: 0.9rem; }
        .footer-actions { display: flex; gap: 1rem; }

        .cancel-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 0.75rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .save-btn-modern {
          background: #3b82f6;
          color: #fff;
          border: none;
          padding: 0.75rem 2.5rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
          transition: all 0.2s;
        }

        .save-btn-modern:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4); }
        
        .permission-alert {
          background: rgba(239, 68, 68, 0.05);
          border-left: 4px solid #ef4444;
          padding: 1.5rem 2rem;
          border-radius: 12px;
          margin-bottom: 3rem;
        }

        @media (max-width: 1024px) {
          .prefs-full-screen { padding: 0 2rem; }
          .pref-item-modern { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
          .pref-select-modern { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default PreferencesModal;
