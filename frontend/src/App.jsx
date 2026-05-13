import React, { Suspense } from 'react'
import { useAuth } from './context/AuthContext'
import { Activity } from 'lucide-react'
import LoginPage from './pages/LoginPage'
// Inside main.jsx or App.jsx
import './index.css';

// Lazy-load the Dashboard for code-splitting — the main bundle loads faster
const Dashboard = React.lazy(() => import('./pages/Dashboard'))

function App() {
  const { user, loading } = useAuth();

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
            <Activity size={24} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Smart Traffic AI</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>Live City Monitoring & AI Prediction</p>
          </div>
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
          <Dashboard />
        </Suspense>
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '2rem 0',
        marginTop: '2rem',
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
        borderTop: '1px solid var(--glass-border)'
      }}>
        <p>&copy; {new Date().getFullYear()} Ankesh Kumar. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
