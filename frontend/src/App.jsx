import React, { Suspense, useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { Activity, Download } from 'lucide-react'
import LoginPage from './pages/LoginPage'
import './index.css';
import ProfileMenu from './components/ProfileMenu';
import PreferencesModal from './components/PreferencesModal';

// Lazy-load the Dashboard for code-splitting — the main bundle loads faster
const Dashboard = React.lazy(() => import('./pages/Dashboard'))

function App() {
  const { user, loading } = useAuth();

  // Lifted state — shared between header (App) and dashboard
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [highGraphics, setHighGraphics] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);

  // PWA install prompt handler
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setIsAppInstalled(true); setDeferredPrompt(null); });
    if (window.matchMedia('(display-mode: standalone)').matches) setIsAppInstalled(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Theme body class toggle
  useEffect(() => {
    document.body.classList.toggle('light-theme', isLightTheme);
  }, [isLightTheme]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', gap: '1rem',
        background: '#0a1120', color: '#fff'
      }}>
        <div style={{
          width: '48px', height: '48px',
          border: '4px solid rgba(255,255,255,0.1)',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', fontWeight: 600 }}>Syncing with Traffic Network...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <div className="header-logo">
            <Activity size={24} color="#3b82f6" />
          </div>
          <div className="header-text">
            <h1>Smart Traffic AI</h1>
            <p>Live City Monitoring &amp; AI Prediction</p>
          </div>
        </div>
        <div className="header-right">
          {!isAppInstalled && (
            <button
              className="header-icon-btn download-btn"
              onClick={() => deferredPrompt?.prompt() || alert('Use Browser Menu to Install')}
              title="Install App"
              aria-label="Install App"
            >
              <Download size={20} />
            </button>
          )}
          <ProfileMenu
            isLightTheme={isLightTheme}
            setIsLightTheme={setIsLightTheme}
            highGraphics={highGraphics}
            setHighGraphics={setHighGraphics}
            onOpenPrefs={() => setIsPrefsOpen(true)}
          />
        </div>
      </header>

      <main>
        <Suspense fallback={
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '400px', gap: '1rem'
          }}>
            <div style={{
              width: '48px', height: '48px',
              border: '4px solid var(--glass-border)',
              borderTop: '4px solid var(--accent-blue)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading dashboard...</p>
          </div>
        }>
          <Dashboard isLightTheme={isLightTheme} highGraphics={highGraphics} />
        </Suspense>
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Ankesh Kumar. All rights reserved.</p>
      </footer>

      {/* Global Modals */}
      <PreferencesModal isOpen={isPrefsOpen} onClose={() => setIsPrefsOpen(false)} />
    </div>
  )
}

export default App
