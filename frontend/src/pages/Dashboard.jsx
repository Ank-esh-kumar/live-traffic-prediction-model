import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveTraffic } from '../hooks/useLiveTraffic';
import MapView from '../components/MapView';
import TrafficChart from '../components/TrafficChart';
import LiveTicker from '../components/LiveTicker';
import AnomalyAlert from '../components/AnomalyAlert';
import RoutePanel from '../components/RoutePanel';
import { Activity, Sun, Moon, ExternalLink, CheckCircle, ThumbsUp, Route, Download, User as UserIcon, LogOut, Settings, Zap, AlertTriangle, Bell, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PreferencesModal from '../components/PreferencesModal';
import EmergencyAuthModal from '../components/EmergencyAuthModal';
import HistoryPanel from '../components/HistoryPanel';
import ProfileMenu from '../components/ProfileMenu';
import IncidentModal from '../components/IncidentModal';

const CITIES_DB = {
  "India Gate (Delhi)": { lat: 28.6129, lng: 77.2295 },
  "Connaught Place (Delhi)": { lat: 28.6304, lng: 77.2177 },
  "Kashmiri Gate (Delhi)": { lat: 28.6665, lng: 77.2289 },
  "Anand Vihar (Delhi)": { lat: 28.6469, lng: 77.3160 },
  "Partapur (Meerut)": { lat: 28.9186, lng: 77.6599 },
  "Meerut Bypass": { lat: 28.9845, lng: 77.7064 },
  "Meerut City Center": { lat: 28.9845, lng: 77.7364 },
  "Begampul (Meerut)": { lat: 29.0064, lng: 77.7029 },
  "Khatauli Bypass (MZN)": { lat: 29.2801, lng: 77.7212 },
  "Mansurpur (MZN)": { lat: 29.3789, lng: 77.7126 },
  "Muzaffarnagar Toll": { lat: 29.4727, lng: 77.7085 },
  "Muzaffarnagar City": { lat: 29.4727, lng: 77.7385 },
  "Roorkee Bypass": { lat: 29.8315, lng: 77.8920 },
  "IIT Roorkee": { lat: 29.8649, lng: 77.8966 },
  "Har Ki Pauri (Haridwar)": { lat: 29.9538, lng: 78.1719 },
  "Shantikunj (Haridwar)": { lat: 29.9926, lng: 78.1963 },
  "Haridwar Railway Station": { lat: 29.9472, lng: 78.1614 },
  "Chandi Devi (Haridwar)": { lat: 29.9332, lng: 78.1751 },
  "Triveni Ghat (Rishikesh)": { lat: 30.1030, lng: 78.2970 },
  "Laxman Jhula (Rishikesh)": { lat: 30.1227, lng: 78.3276 },
  "AIIMS Rishikesh": { lat: 30.0763, lng: 78.2934 },
  "Ram Jhula (Rishikesh)": { lat: 30.1130, lng: 78.3129 },
  "ISBT Dehradun": { lat: 30.2858, lng: 77.9959 },
  "Graphic Era University (Dehradun)": { lat: 30.2678, lng: 77.9942 },
  "Niranjanpur Mandi (Dehradun)": { lat: 30.3060, lng: 78.0040 },
  "Kargi Chowk (Dehradun)": { lat: 30.2905, lng: 78.0195 },
  "Saharanpur Chowk (Dehradun)": { lat: 30.3150, lng: 78.0260 },
  "Prince Chowk (Dehradun)": { lat: 30.3175, lng: 78.0335 },
  "Clock Tower (Dehradun)": { lat: 30.3243, lng: 78.0418 },
  "Bindal Pull (Dehradun)": { lat: 30.3275, lng: 78.0330 },
  "Ballupur Chowk (Dehradun)": { lat: 30.3340, lng: 78.0160 },
  "GMS Road (Dehradun)": { lat: 30.3200, lng: 78.0050 },
  "Vasant Vihar (Dehradun)": { lat: 30.3320, lng: 77.9950 },
  "Uttaranchal University (Dehradun)": { lat: 30.3400, lng: 77.9540 },
  "Shivalik College (Dehradun)": { lat: 30.3359, lng: 77.8700 },
  "Dalanwala (Dehradun)": { lat: 30.3250, lng: 78.0550 },
  "Rispana Pull (Dehradun)": { lat: 30.3015, lng: 78.0461 },
  "Jogiwala (Dehradun)": { lat: 30.2954, lng: 78.0573 },
  "Raipur Stadium (Dehradun)": { lat: 30.3142, lng: 78.0903 },
  "Rajpur Road (Dehradun)": { lat: 30.3421, lng: 78.0558 },
  "Jakhan (Dehradun)": { lat: 30.3640, lng: 78.0750 },
  "Sahastradhara Crossing (Dehradun)": { lat: 30.3550, lng: 78.0710 }
};

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

const Dashboard = () => {
  const { trafficData, anomalies, predictions, incidents, globalEmergencyRoute, isConnected, hasConnectedOnce } = useLiveTraffic();
  const [activeRoutePath, setActiveRoutePath] = useState(null);
  const [activeAltIndex, setActiveAltIndex] = useState(0);
  const [shortestPath, setShortestPath] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [allRoutes, setAllRoutes] = useState([]);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [highGraphics, setHighGraphics] = useState(true);
  const [routeEndpoints, setRouteEndpoints] = useState(null);
  const [activeArea, setActiveArea] = useState(null);
  const [viaRouteInfo, setViaRouteInfo] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const { user, token, logout, saveToHistory, refreshUser } = useAuth();
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isEmergencyAuthOpen, setIsEmergencyAuthOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [modelAccuracy, setModelAccuracy] = useState(null);

  const lastIncidentIdRef = useRef(null);

  useEffect(() => {
    if (incidents && incidents.length > 0) {
      const latest = incidents[0];
      const incidentId = latest._id || latest.timestamp;

      if (lastIncidentIdRef.current !== incidentId) {
        lastIncidentIdRef.current = incidentId;
        setToastMessage(`🚨 ${latest.type} reported at ${latest.node_id}!`);
        const timer = setTimeout(() => setToastMessage(''), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [incidents]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    });
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsAppInstalled(true);
    setDeferredPrompt(null);
  };

  useEffect(() => {
    if (isLightTheme) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [isLightTheme]);

  const openGoogleMaps = () => {
    if (!activeRoutePath || activeRoutePath.length === 0) {
      alert("No active route selected to compare.");
      return;
    }

    const coords = activeRoutePath.map(node => {
      const city = CITIES_DB[(node || '').trim()];
      if (!city) console.warn(`[Google Maps] Missing coordinates for: "${node}"`);
      return city ? `${city.lat},${city.lng}` : null;
    }).filter(Boolean);

    if (coords.length < 2) {
      alert(`Could not map this route. Only ${coords.length} valid coordinate(s) found.`);
      return;
    }

    const url = `https://www.google.com/maps/dir/${coords.join('/')}`;

    try {
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        alert("Popup blocked! Allow popups for this site, or copy this URL manually:\n" + url);
      }
    } catch (err) {
      console.error("Failed to open Google Maps:", err);
    }
  };

  useEffect(() => {
    const fetchAccuracy = async () => {
      try {
        const response = await fetch(`${API_URL}/api/live/accuracy`);
        const data = await response.json();
        if (data && !data.error) setModelAccuracy(data);
      } catch (err) {
        console.error("Failed to fetch accuracy:", err);
      }
    };
    fetchAccuracy();
    const interval = setInterval(fetchAccuracy, 60000);
    return () => clearInterval(interval);
  }, [API_URL]);

  const handleRouteSelect = async (waypoints, options = { mode: 'fast', emergency: false }) => {
    setActiveArea(null);
    setSelectedChoice(null);
    setFeedbackSent(false);
    setViaRouteInfo(null);

    if (isEmergencyActive) {
      await fetch(`${API_URL}/api/route/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route: [], active: false })
      });
      setIsEmergencyActive(false);
    }

    try {
      const response = await fetch(`${API_URL}/api/route/multi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waypoints, mode: options.mode })
      });
      if (!response.ok) {
        const errData = await response.json();
        alert(errData.detail || "Route not found");
        return;
      }
      const data = await response.json();
      if (data.ai_path) {
        const hasStops = waypoints.length > 2 && data.via_route && !data.via_route.error;
        const finalPath = hasStops ? data.via_route.ai_path : data.ai_path;

        if (hasStops) {
          setActiveRoutePath(data.via_route.ai_path);
          setShortestPath(data.via_route.shortest_path);
        } else {
          setActiveRoutePath(data.ai_path);
          setShortestPath(data.shortest_path);
        }

        setRouteInfo({
          ai_distance: data.ai_distance, ai_cost: data.ai_cost, ai_time: data.ai_time,
          shortest_cost: data.shortest_cost, shortest_time: data.shortest_time,
          originalAiPath: data.ai_path
        });
        setAllRoutes(data.all_routes || []);
        setActiveAltIndex(data.alt_index || 0);
        setRouteEndpoints(waypoints);

        if (options.emergency) {
          setSelectedChoice(null);
        } else if (options.mode === 'eco') {
          setSelectedChoice('eco');
        } else if (options.mode === 'shortest') {
          setSelectedChoice('shortest');
        } else {
          setSelectedChoice('ai');
        }

        if (user) {
          saveToHistory({
            start_node: waypoints[0],
            end_node: waypoints[waypoints.length - 1],
            path: finalPath,
            distance: hasStops ? data.via_route.ai_distance : data.ai_distance,
            time_taken: hasStops ? data.via_route.ai_time : data.ai_time,
            timestamp: new Date().toISOString()
          });
        }

        if (data.via_route && !data.via_route.error) {
          setViaRouteInfo(data.via_route);
          if (hasStops) setSelectedChoice('via_stops');
        }

        if (options.emergency) {
          const emergencyPath = hasStops ? data.via_route.ai_path : data.ai_path;
          try {
            await fetch(`${API_URL}/api/route/emergency`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ route: emergencyPath, active: true })
            });
            setIsEmergencyActive(true);
            setSelectedChoice(null);
          } catch (err) {
            console.error("Failed to activate emergency mode", err);
          }
        }
      } else {
        alert(data.error || "No route found");
      }
    } catch (err) {
      console.error("Route fetching failed", err);
      alert("Failed to fetch route. Is the backend running?");
    }
  };

  const switchToPath = (choice) => {
    setSelectedChoice(choice);
    setFeedbackSent(false);
    if (choice === 'shortest' && shortestPath) {
      setActiveRoutePath(shortestPath);
    } else if (choice === 'ai' && routeInfo && routeInfo.originalAiPath) {
      setActiveRoutePath(routeInfo.originalAiPath);
    } else if (choice === 'via_stops' && viaRouteInfo && viaRouteInfo.ai_path) {
      setActiveRoutePath(viaRouteInfo.ai_path);
    }
  };

  const submitFeedback = async () => {
    if (!selectedChoice || !routeInfo) return;
    try {
      await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_node: activeRoutePath[0],
          end_node: activeRoutePath[activeRoutePath.length - 1],
          ai_path: routeInfo.originalAiPath || activeRoutePath,
          shortest_path: shortestPath || [],
          user_chosen_path: activeRoutePath,
          choice: selectedChoice
        })
      });
      setFeedbackSent(true);
    } catch (err) {
      console.error("Feedback submission failed", err);
    }
  };

  const handleAreaSelect = (areaName) => {
    setActiveRoutePath(null);
    setShortestPath(null);
    setActiveArea(areaName);
  };

  const handleClear = async () => {
    setActiveRoutePath(null);
    setShortestPath(null);
    setRouteInfo(null);
    setAllRoutes([]);
    setActiveArea(null);
    setSelectedChoice(null);
    setFeedbackSent(false);
    setRouteEndpoints(null);
    setViaRouteInfo(null);
    if (isEmergencyActive) {
      try {
        await fetch(`${API_URL}/api/route/emergency`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ route: [], active: false })
        });
        setIsEmergencyActive(false);
      } catch (e) { }
    }
  };

  const handleModeChange = (newMode) => {
    if (!activeRoutePath) return;
    if (newMode === 'emergency') {
      setIsEmergencyActive(true);
      setSelectedChoice(null);
    } else {
      setIsEmergencyActive(false);
      setSelectedChoice(newMode);
    }
  };

  const filteredTrafficData = useMemo(() => {
    if (!activeRoutePath && !activeArea) return trafficData;
    const filtered = {};
    if (activeRoutePath) {
      activeRoutePath.forEach(node => {
        if (trafficData[node] !== undefined) filtered[node] = trafficData[node];
      });
    } else if (activeArea) {
      Object.keys(trafficData).forEach(node => {
        if (node.includes(`(${activeArea})`) || node.includes(activeArea) || (activeArea === "Muzaffarnagar" && node.includes("MZN"))) {
          filtered[node] = trafficData[node];
        }
      });
    }
    return filtered;
  }, [trafficData, activeRoutePath, activeArea]);

  const filteredAnomalies = useMemo(() => {
    if (!activeRoutePath && !activeArea) return anomalies;
    if (activeRoutePath) {
      return anomalies.filter(a => activeRoutePath.includes(a.node_id));
    } else if (activeArea) {
      return anomalies.filter(a => a.node_id.includes(`(${activeArea})`) || a.node_id.includes(activeArea) || (activeArea === "Muzaffarnagar" && a.node_id.includes("MZN")));
    }
    return anomalies;
  }, [anomalies, activeRoutePath, activeArea]);

  const isInWayOfEmergency = useMemo(() => {
    if (!globalEmergencyRoute || globalEmergencyRoute.length === 0 || isEmergencyActive) return false;
    if (activeRoutePath && activeRoutePath.length > 0) {
      return activeRoutePath.some(node => globalEmergencyRoute.includes(node));
    }
    return false;
  }, [globalEmergencyRoute, activeRoutePath, isEmergencyActive]);

  // Theming Colors
  const textPrimary = isLightTheme ? '#1a1a1e' : '#f8f9fa';
  const textSecondary = isLightTheme ? '#6b7280' : '#a1a1aa';
  const glassBorder = isLightTheme ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>

      {/* INJECTED CSS FOR RESPONSIVENESS AND iOS GLASSMORPHISM */}
      <style>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${isLightTheme ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}; border-radius: 10px; }
        
        .dashboard-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }
        @media (min-width: 1024px) {
          .dashboard-grid { flex-direction: row; align-items: flex-start; }
          .main-content { flex: 2; min-width: 0; display: flex; flex-direction: column; gap: 1.5rem; }
          .side-panel { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1.5rem; position: sticky; top: 1.5rem; }
        }
        
        .ios-glass-panel {
          background: ${isLightTheme ? 'rgba(255, 255, 255, 0.75)' : 'rgba(28, 28, 30, 0.65)'};
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid ${isLightTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.08)'};
          border-radius: 24px;
          padding: 1.5rem;
          box-shadow: ${isLightTheme ? '0 8px 32px rgba(0, 0, 0, 0.04)' : '0 8px 32px rgba(0, 0, 0, 0.2)'};
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .ios-button {
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
          transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.2s;
        }
        .ios-button:active { transform: scale(0.96); opacity: 0.8; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
        {!isAppInstalled ? (
          <button
            className="ios-button"
            onClick={() => {
              if (deferredPrompt) {
                handleInstallClick();
              } else {
                alert('To install this app:\n\n• Chrome/Edge: Click the install icon (⊕) in the address bar\n• Safari: Tap Share → Add to Home Screen\n• Firefox: Use the browser menu → Install');
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.2rem', borderRadius: '999px',
              background: isLightTheme ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.2)',
              color: isLightTheme ? '#16a34a' : '#4ade80', fontWeight: 600,
              border: `1px solid ${isLightTheme ? 'rgba(34, 197, 94, 0.3)' : 'rgba(74, 222, 128, 0.2)'}`,
              cursor: 'pointer'
            }}
          >
            <Download size={18} />
            Install App
          </button>
        ) : null}

        <button
          className="ios-button"
          onClick={() => setIsIncidentModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.2rem', borderRadius: '999px',
            background: isLightTheme ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.2)',
            color: isLightTheme ? '#dc2626' : '#f87171', fontWeight: 600,
            border: `1px solid ${isLightTheme ? 'rgba(239, 68, 68, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`,
            cursor: 'pointer'
          }}
        >
          <AlertTriangle size={18} />
          Report Incident
        </button>

        <ProfileMenu
          isLightTheme={isLightTheme}
          setIsLightTheme={setIsLightTheme}
          highGraphics={highGraphics}
          setHighGraphics={setHighGraphics}
          onOpenPrefs={() => setIsPrefsOpen(true)}
        />
      </div>

      <PreferencesModal isOpen={isPrefsOpen} onClose={() => setIsPrefsOpen(false)} />

      <IncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        citiesDb={CITIES_DB}
        apiUrl={API_URL}
      />

      <EmergencyAuthModal
        isOpen={isEmergencyAuthOpen}
        onClose={() => setIsEmergencyAuthOpen(false)}
        onAuthSuccess={async () => {
          if (refreshUser) await refreshUser();
          setToastMessage("✅ Emergency Access Granted!");
          setTimeout(() => setToastMessage(''), 5000);
        }}
        apiUrl={API_URL}
        token={token}
      />

      <button id="emergencyAuthBtn" style={{ display: 'none' }} onClick={() => setIsEmergencyAuthOpen(true)}></button>

      {toastMessage && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          background: isLightTheme ? 'rgba(255, 255, 255, 0.85)' : 'rgba(40, 40, 44, 0.85)',
          color: textPrimary, padding: '14px 28px',
          borderRadius: '999px', fontWeight: 600, zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: isLightTheme ? '0 10px 40px rgba(0,0,0,0.1)' : '0 10px 40px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: `1px solid ${glassBorder}`,
          animation: 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <Bell size={18} color="#ef4444" />
          {toastMessage}
        </div>
      )}

      {isInWayOfEmergency && (
        <div className="ios-glass-panel" style={{
          background: isLightTheme ? 'rgba(254, 226, 226, 0.8)' : 'rgba(127, 29, 29, 0.6)',
          color: isLightTheme ? '#b91c1c' : '#fca5a5', padding: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '1rem',
          border: `1px solid ${isLightTheme ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`,
          animation: 'pulse 2s infinite'
        }}>
          <AlertTriangle size={28} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>EMERGENCY VEHICLE APPROACHING</div>
            <div style={{ fontSize: '0.95rem', opacity: 0.9, marginTop: '4px' }}>An active emergency service is approaching your current route. Please clear the way safely.</div>
          </div>
        </div>
      )}

      <RoutePanel onRouteSelect={handleRouteSelect} onAreaSelect={handleAreaSelect} onClear={handleClear} onModeChange={handleModeChange} />

      <div className="dashboard-grid">
        <div className="main-content">
          <div className="ios-glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: textPrimary, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity style={{ color: isConnected ? '#34c759' : '#ff3b30' }} size={22} />
                Live Network Map {activeArea && `- ${activeArea} Region`}
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#34c759' : '#ff3b30', marginLeft: '0.25rem', animation: isConnected ? 'none' : 'pulse 1.5s ease-in-out infinite' }} title={isConnected ? 'Live' : 'Reconnecting...'} />
              </h2>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {modelAccuracy && (
                  <div title="AI Prediction Accuracy (updated every 15m)" style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem',
                    background: isLightTheme ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)',
                    borderRadius: '999px', border: `1px solid ${isLightTheme ? 'rgba(59,130,246,0.2)' : 'rgba(96,165,250,0.2)'}`
                  }}>
                    <Zap size={14} color="#3b82f6" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isLightTheme ? '#2563eb' : '#60a5fa' }}>
                      {modelAccuracy.accuracy.toFixed(1)}% Precision
                    </span>
                  </div>
                )}
                {isEmergencyActive && (
                  <div style={{
                    padding: '0.4rem 0.8rem', borderRadius: '999px',
                    background: 'rgba(239, 68, 68, 0.15)', color: isLightTheme ? '#dc2626' : '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem'
                  }}>
                    🚨 CLEARING PATH
                  </div>
                )}
                {activeRoutePath && !isEmergencyActive && (
                  <button
                    className="ios-button"
                    onClick={openGoogleMaps}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.5rem 1rem', borderRadius: '999px',
                      background: '#007aff', color: '#fff',
                      border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                    }}
                  >
                    <ExternalLink size={16} />
                    Open in Maps
                  </button>
                )}
              </div>
            </div>
            <p style={{ color: textSecondary, fontSize: '0.95rem', marginBottom: '1.25rem', marginTop: '-0.25rem' }}>
              Real-time visualization of city roads. Green paths mean clear traffic, yellow means moderate, and red means heavy congestion.
            </p>
            <div style={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${glassBorder}` }}>
              <MapView
                trafficData={filteredTrafficData}
                activeRoutePath={activeRoutePath}
                shortestPath={shortestPath}
                routeInfo={routeInfo}
                allRoutes={allRoutes}
                activeArea={activeArea}
                isLightTheme={isLightTheme}
                routeEndpoints={routeEndpoints}
                highGraphics={highGraphics}
                isEmergencyActive={isEmergencyActive}
                preferredMode={user?.preferences?.preferred_mode || 'fastest'}
                activeAltIndex={activeAltIndex}
                incidents={incidents}
              />
            </div>
          </div>

          {routeInfo && allRoutes.length > 0 && activeRoutePath && !activeArea && (
            <div className="ios-glass-panel">
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: textPrimary, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle size={20} color="#007aff" />
                Available Routes ({allRoutes.length})
              </h2>
              <p style={{ color: textSecondary, marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                Select a route to preview. Submit your preference to help train better AI predictions.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                {allRoutes.map((route, idx) => {
                  const isSelected = activeAltIndex === route.alt_index;

                  // Refined iOS Colors for Selection
                  let bg, border, titleColor;
                  if (isSelected) {
                    bg = route.is_ai ? (isLightTheme ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.2)')
                      : route.is_shortest ? (isLightTheme ? 'rgba(0, 122, 255, 0.15)' : 'rgba(10, 132, 255, 0.2)')
                        : (isLightTheme ? 'rgba(142, 142, 147, 0.15)' : 'rgba(152, 152, 157, 0.2)');
                    border = `2px solid ${route.is_ai ? '#34c759' : route.is_shortest ? '#007aff' : '#8e8e93'}`;
                  } else {
                    bg = isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(40,40,44,0.4)';
                    border = `1px solid ${glassBorder}`;
                  }

                  titleColor = route.is_ai ? '#34c759' : route.is_shortest ? (isLightTheme ? '#007aff' : '#0a84ff') : textSecondary;

                  return (
                    <button
                      key={idx}
                      className="ios-button"
                      onClick={() => { setActiveRoutePath(route.path); setActiveAltIndex(route.alt_index); setSelectedChoice(route.is_ai ? 'ai' : route.is_shortest ? 'shortest' : 'custom'); setFeedbackSent(false); }}
                      style={{
                        flex: '1 1 280px', padding: '1rem 1.25rem', borderRadius: '16px', cursor: 'pointer',
                        background: bg, border: border, color: textPrimary, textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                          {route.is_ai ? '🤖 AI Predicted' : route.is_shortest ? '📐 Shortest' : `🔀 Route ${idx + 1}`}
                        </span>
                        <span style={{ fontWeight: 700, color: titleColor }}>
                          {route.distance} km • {route.expected_time} m
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Path: {route.path[0].split('(')[0].trim()} → {route.path[route.path.length - 1].split('(')[0].trim()}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedChoice && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    className="ios-button"
                    onClick={submitFeedback}
                    disabled={feedbackSent}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.8rem 1.5rem', borderRadius: '999px',
                      background: feedbackSent ? '#34c759' : '#007aff',
                      color: '#fff', border: 'none', cursor: feedbackSent ? 'default' : 'pointer',
                      fontWeight: 600, opacity: feedbackSent ? 0.9 : 1, fontSize: '1rem'
                    }}
                  >
                    <ThumbsUp size={18} />
                    {feedbackSent ? 'Preference Saved' : 'Set as Preferred'}
                  </button>
                  {feedbackSent && (
                    <span style={{ color: '#34c759', fontSize: '0.9rem', fontWeight: 500 }}>
                      ✓ Model training updated
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {viaRouteInfo && routeInfo && !activeArea && (
            <div className="ios-glass-panel">
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: textPrimary, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Route size={20} color="#ff9500" />
                Route Comparison
              </h2>
              <p style={{ color: textSecondary, marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                Direct path vs. route through selected stops.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>

                <button
                  className="ios-button"
                  onClick={() => switchToPath('ai')}
                  style={{
                    flex: '1 1 280px', padding: '1.25rem', borderRadius: '16px', cursor: 'pointer',
                    background: selectedChoice === 'ai' ? (isLightTheme ? 'rgba(52, 199, 89, 0.1)' : 'rgba(52, 199, 89, 0.15)') : (isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(40,40,44,0.4)'),
                    border: selectedChoice === 'ai' ? '2px solid #34c759' : `1px solid ${glassBorder}`,
                    color: textPrimary, textAlign: 'left'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>🚀 Direct</span>
                    <span style={{ fontWeight: 700, color: '#34c759', fontSize: '1.1rem' }}>
                      {routeInfo.ai_distance} km • {routeInfo.ai_time} m
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: textSecondary }}>
                    Optimal path ignoring stops
                  </div>
                </button>

                <button
                  className="ios-button"
                  onClick={() => switchToPath('via_stops')}
                  style={{
                    flex: '1 1 280px', padding: '1.25rem', borderRadius: '16px', cursor: 'pointer',
                    background: selectedChoice === 'via_stops' ? (isLightTheme ? 'rgba(255, 149, 0, 0.1)' : 'rgba(255, 149, 0, 0.15)') : (isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(40,40,44,0.4)'),
                    border: selectedChoice === 'via_stops' ? '2px solid #ff9500' : `1px solid ${glassBorder}`,
                    color: textPrimary, textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>📍 Via Stops</span>
                    <span style={{ fontWeight: 700, color: '#ff9500', fontSize: '1.1rem' }}>
                      {viaRouteInfo.ai_distance} km • {viaRouteInfo.ai_time} m
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: textSecondary, marginBottom: '0.5rem', lineHeight: 1.4 }}>
                    Through: {viaRouteInfo.stops.join(' → ')}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: viaRouteInfo.ai_distance > routeInfo.ai_distance ? '#ff3b30' : '#34c759' }}>
                    {viaRouteInfo.ai_distance > routeInfo.ai_distance
                      ? `+${(viaRouteInfo.ai_distance - routeInfo.ai_distance).toFixed(1)} km longer`
                      : viaRouteInfo.ai_distance === routeInfo.ai_distance
                        ? 'Same distance!'
                        : `${(routeInfo.ai_distance - viaRouteInfo.ai_distance).toFixed(1)} km shorter!`
                    }
                  </div>
                </button>
              </div>

              {viaRouteInfo.legs && viaRouteInfo.legs.length > 0 && (
                <div style={{ borderTop: `1px solid ${glassBorder}`, paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: textSecondary }}>
                    Leg Breakdown
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {viaRouteInfo.legs.map((leg, i) => (
                      <div key={i} style={{
                        padding: '0.75rem 1rem', borderRadius: '12px',
                        background: isLightTheme ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${glassBorder}`,
                        fontSize: '0.85rem', flex: '1 1 200px', color: textPrimary
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
                          Leg {i + 1}: {leg.from.split('(')[0].trim()} → {leg.to.split('(')[0].trim()}
                        </div>
                        <div style={{ color: textSecondary, fontWeight: 500 }}>
                          📏 {leg.ai_distance} km &nbsp;•&nbsp; ⏱️ {leg.ai_time} m
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="ios-glass-panel">
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: textPrimary, marginBottom: '0.5rem' }}>Traffic Density Over Time</h2>
            <p style={{ color: textSecondary, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              Historical and predicted patterns to plan your trips better.
            </p>
            <div style={{ borderRadius: '16px', overflow: 'hidden', padding: '0.5rem', background: isLightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)' }}>
              <TrafficChart trafficData={filteredTrafficData} predictions={predictions} />
            </div>
          </div>
        </div>

        <div className="side-panel">
          <div className="ios-glass-panel">
            <AnomalyAlert anomalies={filteredAnomalies} />
          </div>

          <div className="ios-glass-panel" style={{ flex: 1 }}>
            <LiveTicker trafficData={filteredTrafficData} />
          </div>

          {user && (
            <div className="ios-glass-panel">
              <HistoryPanel onSelectRoute={(path) => {
                if (path && path.length >= 2) {
                  handleRouteSelect([path[0], path[path.length - 1]]);
                }
              }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;