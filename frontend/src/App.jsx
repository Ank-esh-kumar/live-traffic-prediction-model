import React from 'react'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1>Smart Traffic Real-Time System</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Live City Monitoring & AI Prediction</p>
      </header>
      
      <main>
        <Dashboard />
      </main>
    </div>
  )
}

export default App
