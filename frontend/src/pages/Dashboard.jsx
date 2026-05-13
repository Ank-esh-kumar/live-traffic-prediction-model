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

// 1. Defined outside the component so it never causes a ReferenceError
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
  const [routeEndpoints, setRouteEndpoints] = useState(null); // waypoints array
  const [activeArea, setActiveArea] = useState(null);
  const [viaRouteInfo, setViaRouteInfo] = useState(null); // via-stops comparison route
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const { user, token, logout, saveToHistory, refreshUser } = useAuth();
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isEmergencyAuthOpen, setIsEmergencyAuthOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [modelAccuracy, setModelAccuracy] = useState(null);

  const lastIncidentIdRef = useRef(null);

  // Show toast when new incident arrives via websocket
  useEffect(() => {
    if (incidents && incidents.length > 0) {
      const latest = incidents[0];
      const incidentId = latest._id || latest.timestamp;
      
      // Only toast if this is a new incident we haven't seen yet
      if (lastIncidentIdRef.current !== incidentId) {
        lastIncidentIdRef.current = incidentId;
        setToastMessage(`🚨 ${latest.type} reported at ${latest.node_id}!`);
        const timer = setTimeout(() => setToastMessage(''), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [incidents]);

  // Capture the PWA install prompt
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

  // 2. Google Maps comparison — uses /dir/ path format which supports multiple waypoints
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

    // Use the /dir/ path format: /maps/dir/loc1/loc2/loc3/...
    // This correctly supports unlimited waypoints in the browser
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

  // Fetch Model Accuracy
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
    const interval = setInterval(fetchAccuracy, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [API_URL]);

  const handleRouteSelect = async (waypoints, options = { mode: 'fast', emergency: false }) => {
    setActiveArea(null);
    setSelectedChoice(null);
    setFeedbackSent(false);
    setViaRouteInfo(null);

    // Disable old emergency route if any
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

        // Set the selection based on the mode — but emergency overrides everything
        if (options.emergency) {
          setSelectedChoice(null); // Emergency mode uses isEmergencyActive, not selectedChoice
        } else if (options.mode === 'eco') {
          setSelectedChoice('eco');
        } else if (options.mode === 'shortest') {
          setSelectedChoice('shortest');
        } else {
          setSelectedChoice('ai');
        }

        // Save to history if logged in
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
             setSelectedChoice(null); // Clear any mode — emergency overrides all
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
      } catch (e) {}
    }
  };

  // Instant mode switch — updates path color the moment a checkbox is toggled
  const handleModeChange = (newMode) => {
    if (!activeRoutePath) return; // No route on screen, nothing to recolor
    if (newMode === 'emergency') {
      setIsEmergencyActive(true);
      setSelectedChoice(null);
    } else {
      setIsEmergencyActive(false);
      setSelectedChoice(newMode); // 'eco' or 'ai'
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
    // If there is no active emergency globally, or if *this* user is the emergency vehicle, return false.
    if (!globalEmergencyRoute || globalEmergencyRoute.length === 0 || isEmergencyActive) return false;
    
    // Check if the user's active route intersects with the emergency route
    if (activeRoutePath && activeRoutePath.length > 0) {
      return activeRoutePath.some(node => globalEmergencyRoute.includes(node));
    }
    
    return false;
  }, [globalEmergencyRoute, activeRoutePath, isEmergencyActive]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-1rem', gap: '0.5rem' }}>
        {/* PWA Install Button — always visible */}
        {!isAppInstalled ? (
          <button
            onClick={() => {
              if (deferredPrompt) {
                handleInstallClick();
              } else {
                alert('To install this app:\n\n• Chrome/Edge: Click the install icon (⊕) in the address bar\n• Safari: Tap Share → Add to Home Screen\n• Firefox: Use the browser menu → Install');
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', borderRadius: '8px',
              background: 'linear-gradient(135deg, #22c55e, #10b981)',
              color: '#fff', fontWeight: 600,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(34, 197, 94, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            <Download size={18} />
            Install App
          </button>
        ) : null}
        
        <button
          onClick={() => setIsIncidentModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '8px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff', fontWeight: 600,
            border: 'none', cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(239, 68, 68, 0.3)',
            transition: 'all 0.2s ease'
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
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '12px 24px',
          borderRadius: '30px', fontWeight: 600, zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)', backdropFilter: 'blur(10px)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <Bell size={18} />
          {toastMessage}
        </div>
      )}

      {isInWayOfEmergency && (
        <div style={{
          background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: 'white', padding: '1rem',
          borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem',
          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)', animation: 'pulse 2s infinite'
        }}>
          <AlertTriangle size={24} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>EMERGENCY VEHICLE APPROACHING</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>An active emergency service is approaching your current route. Please clear the way safely.</div>
          </div>
        </div>
      )}

      <RoutePanel onRouteSelect={handleRouteSelect} onAreaSelect={handleAreaSelect} onClear={handleClear} onModeChange={handleModeChange} />

      <div className="dashboard-grid">
        <div className="main-content">
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                <Activity style={{ color: isConnected ? '#4ade80' : '#f87171' }} size={18} />
                Live Network Map {activeArea && `- ${activeArea} Region`}
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#4ade80' : '#f87171', marginLeft: '0.5rem', animation: isConnected ? 'none' : 'pulse 1.5s ease-in-out infinite' }} title={isConnected ? 'Live' : 'Reconnecting...'} />
              </h2>
              
              {modelAccuracy && (
                <div className="accuracy-badge" title="AI Prediction Accuracy (updated every 15m)">
                  <div className="accuracy-icon">
                    <Zap size={14} />
                  </div>
                  <div className="accuracy-text">
                    <span className="label">AI Precision</span>
                    <span className="value">{modelAccuracy.accuracy.toFixed(1)}%</span>
                  </div>
                </div>
              )}
              {isEmergencyActive && (
                 <div style={{
                    padding: '0.5rem 1rem', borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                 }}>
                    🚨 EMERGENCY SERVICE ACTIVE - CLEARING PATH
                 </div>
              )}
              {activeRoutePath && !isEmergencyActive && (
                <button
                  onClick={openGoogleMaps}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1rem', borderRadius: '8px',
                    background: 'var(--accent-blue)', color: '#fff',
                    border: 'none', cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  <ExternalLink size={16} />
                  Compare on Google Maps
                </button>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', marginTop: '-0.5rem' }}>
              Real-time visualization of city roads. Green paths mean clear traffic, yellow means moderate, and red means heavy congestion.
            </p>
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

          {routeInfo && allRoutes.length > 0 && activeRoutePath && !activeArea && (
            <div className="glass-panel">
              <h2 className="section-title" style={{ marginBottom: '1rem' }}>
                <CheckCircle size={20} />
                All Available Routes ({allRoutes.length})
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Select any route to preview it on the map. Submit your preference to help train better AI predictions!
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', maxHeight: '250px', overflowY: 'auto' }}>
                {allRoutes.map((route, idx) => {
                  const isSelected = activeAltIndex === route.alt_index;
                  return (
                    <button
                      key={idx}
                      onClick={() => { setActiveRoutePath(route.path); setActiveAltIndex(route.alt_index); setSelectedChoice(route.is_ai ? 'ai' : route.is_shortest ? 'shortest' : 'custom'); setFeedbackSent(false); }}
                      style={{
                        flex: '1 1 280px', padding: '0.85rem 1rem', borderRadius: '10px', cursor: 'pointer',
                        background: isSelected ? (route.is_ai ? 'rgba(34, 197, 94, 0.15)' : route.is_shortest ? 'rgba(96, 165, 250, 0.15)' : 'rgba(156, 163, 175, 0.15)') : 'var(--glass-bg)',
                        border: isSelected ? `2px solid ${route.is_ai ? '#22c55e' : route.is_shortest ? '#60a5fa' : '#9ca3af'}` : '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 'bold' }}>
                          {route.is_ai ? '🤖 AI Predicted' : route.is_shortest ? '📐 Shortest' : `🔀 Route ${idx + 1}`}
                        </span>
                        <span style={{ fontWeight: 'bold', color: route.is_ai ? '#22c55e' : route.is_shortest ? '#60a5fa' : 'var(--text-secondary)' }}>
                          {route.distance} km • ETA: {route.expected_time} mins
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Direct Path · {route.path[0].split('(')[0].trim()} → {route.path[route.path.length - 1].split('(')[0].trim()}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedChoice && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    onClick={submitFeedback}
                    disabled={feedbackSent}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.75rem 1.5rem', borderRadius: '8px',
                      background: feedbackSent ? '#22c55e' : 'var(--accent-blue)',
                      color: '#fff', border: 'none', cursor: feedbackSent ? 'default' : 'pointer',
                      fontWeight: 'bold', opacity: feedbackSent ? 0.8 : 1
                    }}
                  >
                    <ThumbsUp size={16} />
                    {feedbackSent ? 'Feedback Submitted!' : 'Submit as Preferred Route'}
                  </button>
                  {feedbackSent && (
                    <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>
                      ✓ Your preference has been recorded for model training
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Via-Route Comparison Panel */}
          {viaRouteInfo && routeInfo && !activeArea && (
            <div className="glass-panel">
              <h2 className="section-title" style={{ marginBottom: '1rem' }}>
                <Route size={20} />
                Route Comparison: Direct vs. Via Stops
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Compare the direct shortest path with the route through your selected stops.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {/* Direct Route Card */}
                <button
                  onClick={() => switchToPath('ai')}
                  style={{
                    flex: '1 1 280px', padding: '1rem', borderRadius: '10px', cursor: 'pointer',
                    background: selectedChoice === 'ai' ? 'rgba(34, 197, 94, 0.15)' : 'var(--glass-bg)',
                    border: selectedChoice === 'ai' ? '2px solid #22c55e' : '1px solid var(--glass-border)',
                    color: 'var(--text-primary)', textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>🚀 Direct Route</span>
                    <span style={{ fontWeight: 'bold', color: '#22c55e' }}>
                      {routeInfo.ai_distance} km • {routeInfo.ai_time} mins
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Shortest AI-optimized path ignoring stops
                  </div>
                </button>

                {/* Via-Stops Route Card */}
                <button
                  onClick={() => switchToPath('via_stops')}
                  style={{
                    flex: '1 1 280px', padding: '1rem', borderRadius: '10px', cursor: 'pointer',
                    background: selectedChoice === 'via_stops' ? 'rgba(245, 158, 11, 0.15)' : 'var(--glass-bg)',
                    border: selectedChoice === 'via_stops' ? '2px solid #f59e0b' : '1px solid var(--glass-border)',
                    color: 'var(--text-primary)', textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>📍 Via Stops Route</span>
                    <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>
                      {viaRouteInfo.ai_distance} km • {viaRouteInfo.ai_time} mins
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Route through: {viaRouteInfo.stops.join(' → ')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: viaRouteInfo.ai_distance > routeInfo.ai_distance ? '#ef4444' : '#22c55e' }}>
                    {viaRouteInfo.ai_distance > routeInfo.ai_distance
                      ? `+${(viaRouteInfo.ai_distance - routeInfo.ai_distance).toFixed(1)} km longer than direct`
                      : viaRouteInfo.ai_distance === routeInfo.ai_distance
                        ? 'Same distance as direct route!'
                        : `${(routeInfo.ai_distance - viaRouteInfo.ai_distance).toFixed(1)} km shorter!`
                    }
                  </div>
                </button>
              </div>

              {/* Leg-by-leg breakdown */}
              {viaRouteInfo.legs && viaRouteInfo.legs.length > 0 && (
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    Leg-by-Leg Breakdown:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {viaRouteInfo.legs.map((leg, i) => (
                      <div key={i} style={{
                        padding: '0.5rem 0.75rem', borderRadius: '8px',
                        background: 'rgba(0,0,0,0.05)', border: '1px solid var(--glass-border)',
                        fontSize: '0.8rem', flex: '1 1 200px'
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          Leg {i + 1}: {leg.from.split('(')[0].trim()} → {leg.to.split('(')[0].trim()}
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          📏 {leg.ai_distance} km • ⏱️ {leg.ai_time} mins
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="glass-panel">
            <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>Traffic Density Over Time</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Historical and predicted traffic patterns. See how congestion fluctuates throughout the day to plan your trips better.
            </p>
            <TrafficChart trafficData={filteredTrafficData} predictions={predictions} />
          </div>
        </div>

        <div className="side-panel">
          <div className="glass-panel">
            <AnomalyAlert anomalies={filteredAnomalies} />
          </div>

          <div className="glass-panel" style={{ flex: 1 }}>
            <LiveTicker trafficData={filteredTrafficData} />
          </div>

          {user && (
            <HistoryPanel onSelectRoute={(path) => {
              if (path && path.length >= 2) {
                handleRouteSelect([path[0], path[path.length - 1]]);
              }
            }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;