import React, { Suspense } from 'react'

// Lazy-load the Dashboard for code-splitting — the main bundle loads faster
const Dashboard = React.lazy(() => import('./pages/Dashboard'))

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1>Smart Traffic Real-Time System</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Live City Monitoring & AI Prediction</p>
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
