import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveTraffic } from '../hooks/useLiveTraffic';
import MapView from '../components/MapView';
import TrafficChart from '../components/TrafficChart';
import LiveTicker from '../components/LiveTicker';
import AnomalyAlert from '../components/AnomalyAlert';
import RoutePanel from '../components/RoutePanel';
import { Activity, ExternalLink, CheckCircle, ThumbsUp, Route, Zap, AlertTriangle, AlertOctagon, ShieldAlert, BarChart3, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import EmergencyAuthModal from '../components/EmergencyAuthModal';
import HistoryPanel from '../components/HistoryPanel';
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
  "Clement Town (Dehradun)": { lat: 30.2650, lng: 78.0010 },
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
  "Sahastradhara Crossing (Dehradun)": { lat: 30.3550, lng: 78.0710 },
  "Doon Hospital (Dehradun)": { lat: 30.3180, lng: 78.0350 },
  "Max Super Speciality Hospital (Dehradun)": { lat: 30.3600, lng: 78.0800 },
  "Synergy Hospital (Dehradun)": { lat: 30.3300, lng: 77.9900 },
  "Kotwali Dehradun": { lat: 30.3165, lng: 78.0322 },
  "Prem Nagar Police Station (Dehradun)": { lat: 30.3340, lng: 77.9650 },
  "Rajpur Police Station (Dehradun)": { lat: 30.3750, lng: 78.0850 },
  "Fire Station Dehradun": { lat: 30.3200, lng: 78.0400 },
  "Mussoorie (Dehradun)": { lat: 30.4598, lng: 78.0644 },
  "Chakrata (Dehradun)": { lat: 30.7016, lng: 77.8696 },
  "Selaqui (Dehradun)": { lat: 30.3701, lng: 77.8540 },
  "AIIMS New Delhi": { lat: 28.5659, lng: 77.2089 },
  "Safdarjung Hospital (Delhi)": { lat: 28.5680, lng: 77.2060 },
  "Apollo Hospital (Delhi)": { lat: 28.5320, lng: 77.2880 },
  "Parliament Street Police Station (Delhi)": { lat: 28.6250, lng: 77.2100 },
  "Hauz Khas Police Station (Delhi)": { lat: 28.5450, lng: 77.2050 },
  "Connaught Place Police Station (Delhi)": { lat: 28.6320, lng: 77.2180 },
  "Connaught Circus Fire Station (Delhi)": { lat: 28.6330, lng: 77.2200 },
  "Safdarjung Fire Station (Delhi)": { lat: 28.5600, lng: 77.2000 }
};

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

const Dashboard = ({ isLightTheme, highGraphics, onWeatherChange, activeTab = 'dashboard' }) => {
  const { trafficData, anomalies, predictions, incidents, globalEmergencyRoute, isConnected } = useLiveTraffic();
  const [activeRoutePath, setActiveRoutePath] = useState(null);
  const [activeAltIndex, setActiveAltIndex] = useState(0);
  const [shortestPath, setShortestPath] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [allRoutes, setAllRoutes] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [routeEndpoints, setRouteEndpoints] = useState(null);
  const [activeArea, setActiveArea] = useState(null);
  const [viaRouteInfo, setViaRouteInfo] = useState(null);
  const { user, token, saveToHistory, refreshUser } = useAuth();
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isEmergencyAuthOpen, setIsEmergencyAuthOpen] = useState(false);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);

  const [toastAlert, setToastAlert] = useState(null);
  const [modelAccuracy, setModelAccuracy] = useState(null);
  const lastIncidentIdRef = useRef(null);

  useEffect(() => {
    if (incidents?.length > 0) {
      const latest = incidents[0];
      const incidentId = latest._id || latest.timestamp;
      if (lastIncidentIdRef.current !== incidentId) {
        lastIncidentIdRef.current = incidentId;
        setToastAlert({ title: 'Live Incident', message: `${latest.type} at ${latest.node_id}`, time: 'Just now' });
        const timer = setTimeout(() => setToastAlert(null), 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [incidents]);

  const openGoogleMaps = () => {
    if (!activeRoutePath?.length) { alert("No active route selected."); return; }
    const coords = activeRoutePath.map(node => {
      const city = CITIES_DB[(node || '').trim()];
      return city ? `${city.lat},${city.lng}` : null;
    }).filter(Boolean);
    if (coords.length < 2) { alert("Insufficient coordinates."); return; }
    window.open(`https://www.google.com/maps/dir/${coords.join('/')}`, '_blank', 'noopener,noreferrer');
  };



  // Sync connection state to global dot in ProfileMenu
  useEffect(() => {
    const dot = document.getElementById('global-connection-dot');
    const text = document.getElementById('global-connection-text');
    if (dot && text) {
      if (isConnected) {
        dot.className = 'map-connection-dot connected';
        dot.title = 'Live';
        text.innerText = 'Live';
      } else {
        dot.className = 'map-connection-dot disconnected';
        dot.title = 'Offline';
        text.innerText = 'Offline';
      }
    }
  }, [isConnected]);

  // Toggle Header and Nav-Bar visibility based on panel state and active tab
  useEffect(() => {
    const header = document.querySelector('.header');
    const navBar = document.querySelector('.nav-bar');
    if (header && navBar) {
      if (activeTab === 'dashboard') {
        if (!isPanelMinimized) {
          // If side panel is open, hide both
          header.classList.add('hidden-nav');
          navBar.classList.add('hidden-nav');
        } else {
          // Dashboard closed panel state
          header.classList.remove('hidden-nav');
          navBar.classList.remove('hidden-nav');
        }
      } else {
        // If on another tab, only hide the top header, keep nav-bar visible
        header.classList.add('hidden-nav');
        navBar.classList.remove('hidden-nav');
      }
    }
    
    // Cleanup to ensure they appear if Dashboard unmounts
    return () => {
      if (header && navBar) {
        header.classList.remove('hidden-nav');
        navBar.classList.remove('hidden-nav');
      }
    };
  }, [isPanelMinimized, activeTab]);

  useEffect(() => {
    const fetchAccuracy = async () => {
      try {
        const response = await fetch(`${API_URL}/api/live/accuracy`);
        const data = await response.json();
        if (data && !data.error) setModelAccuracy(data);
      } catch (err) { console.error(err); }
    };
    fetchAccuracy();
    const interval = setInterval(fetchAccuracy, 60000);
    return () => clearInterval(interval);
  }, [API_URL]);

  const handleRouteSelect = async (waypoints, options = { mode: 'fast', emergency: false }) => {
    setActiveArea(null); setSelectedChoice(null); setFeedbackSent(false); setViaRouteInfo(null);
    if (isEmergencyActive) {
      await fetch(`${API_URL}/api/route/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ route: [], active: false })
      });
      setIsEmergencyActive(false);
    }
    try {
      const response = await fetch(`${API_URL}/api/route/multi`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ waypoints, mode: options.mode }) });
      const data = await response.json();
      if (data.ai_path) {
        const hasStops = waypoints.length > 2 && data.via_route && !data.via_route.error;
        const finalPath = hasStops ? data.via_route.ai_path : data.ai_path;
        setActiveRoutePath(finalPath);
        setShortestPath(hasStops ? data.via_route.shortest_path : data.shortest_path);
        setRouteInfo({
          ai_distance: data.ai_distance,
          ai_time: data.ai_time,
          shortest_time: data.shortest_time,
          originalAiPath: data.full_ai_path || data.ai_path,
          fullShortestPath: data.full_shortest_path || data.shortest_path
        });
        setAllRoutes(data.all_routes || []);
        setActiveAltIndex(data.alt_index || 0);
        setRouteEndpoints(waypoints);
        if (options.emergency) setSelectedChoice(null);
        else setSelectedChoice(options.mode === 'eco' ? 'eco' : options.mode === 'shortest' ? 'shortest' : 'ai');
        if (user) saveToHistory({ start_node: waypoints[0], end_node: waypoints[waypoints.length - 1], path: finalPath, distance: hasStops ? data.via_route.ai_distance : data.ai_distance, time_taken: hasStops ? data.via_route.ai_time : data.ai_time, timestamp: new Date().toISOString() });
        if (data.via_route && !data.via_route.error) { setViaRouteInfo(data.via_route); if (hasStops) setSelectedChoice('via_stops'); }
        if (options.emergency) {
          try { await fetch(`${API_URL}/api/route/emergency`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ route: finalPath, active: true }) }); setIsEmergencyActive(true); } catch (err) { console.error(err); }
        }
      }
    } catch (err) { alert("Failed to fetch route."); }
  };

  const switchToPath = (choice) => {
    setSelectedChoice(choice);
    setFeedbackSent(false);
    if (choice === 'shortest' && routeInfo?.fullShortestPath) setActiveRoutePath(routeInfo.fullShortestPath);
    else if (choice === 'ai' && routeInfo?.originalAiPath) setActiveRoutePath(routeInfo.originalAiPath);
    else if (choice === 'via_stops' && viaRouteInfo?.full_ai_path) setActiveRoutePath(viaRouteInfo.full_ai_path);
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
    } catch (err) { console.error("Feedback submission failed", err); }
  };

  const endEmergencyService = async () => {
    try {
      await fetch(`${API_URL}/api/route/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ route: [], active: false })
      });
      setIsEmergencyActive(false);
      setToastAlert({ title: "Service Ended", message: "Emergency priority has been lifted.", time: "Just now" });
      setTimeout(() => setToastAlert(null), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAreaSelect = (areaName) => {
    setActiveRoutePath(null); setShortestPath(null); setActiveArea(areaName);
  };

  const handleClear = async () => {
    setActiveRoutePath(null); setShortestPath(null); setRouteInfo(null); setAllRoutes([]);
    setActiveArea(null); setSelectedChoice(null); setFeedbackSent(false); setRouteEndpoints(null); setViaRouteInfo(null);
    if (isEmergencyActive) {
      try {
        await fetch(`${API_URL}/api/route/emergency`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ route: [], active: false }) });
        setIsEmergencyActive(false);
      } catch (e) { }
    }
  };

  const handleModeChange = (newMode) => {
    if (!activeRoutePath) return;
    if (newMode === 'emergency') { setIsEmergencyActive(true); setSelectedChoice(null); }
    else { setIsEmergencyActive(false); setSelectedChoice(newMode); }
  };

  const filteredTrafficData = useMemo(() => {
    if (!activeRoutePath && !activeArea) return trafficData;
    const filtered = {};
    if (activeRoutePath) {
      activeRoutePath.forEach(node => { if (trafficData[node] !== undefined) filtered[node] = trafficData[node]; });
    } else if (activeArea) {
      Object.keys(trafficData).forEach(node => {
        if (node.includes(`(${activeArea})`) || node.includes(activeArea) || (activeArea === "Muzaffarnagar" && node.includes("MZN"))) filtered[node] = trafficData[node];
      });
    }
    return filtered;
  }, [trafficData, activeRoutePath, activeArea]);

  const filteredAnomalies = useMemo(() => {
    if (!activeRoutePath && !activeArea) return anomalies;
    if (activeRoutePath) return anomalies.filter(a => activeRoutePath.includes(a.node_id));
    if (activeArea) return anomalies.filter(a => a.node_id.includes(`(${activeArea})`) || a.node_id.includes(activeArea) || (activeArea === "Muzaffarnagar" && a.node_id.includes("MZN")));
    return anomalies;
  }, [anomalies, activeRoutePath, activeArea]);

  const isInWayOfEmergency = useMemo(() => {
    if (!globalEmergencyRoute || globalEmergencyRoute.length === 0 || isEmergencyActive) return false;
    return activeRoutePath?.some(node => globalEmergencyRoute.includes(node)) || false;
  }, [globalEmergencyRoute, activeRoutePath, isEmergencyActive]);

  return (
    <>
      {/* ICON-ONLY FAB — Report Incident */}
      <button
        className="fab-incident-btn"
        onClick={() => setIsIncidentModalOpen(true)}
        aria-label="Report Incident"
      >
        <AlertTriangle size={22} />
      </button>

      {/* RICH TOAST ALERT */}
      {toastAlert && (
        <div className="ios-toast-notification">
          <div className="toast-icon-box"><AlertOctagon size={24} color="#ffffff" /></div>
          <div className="toast-content">
            <div className="toast-header"><b>{toastAlert.title}</b><small>{toastAlert.time}</small></div>
            <div className="toast-body">{toastAlert.message}</div>
          </div>
        </div>
      )}

      {/* ========== ALWAYS-ON FULLSCREEN MAP ========== */}
      <div className="map-fullscreen-bg">
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
          modelAccuracy={modelAccuracy}
        />
      </div>


      {/* EMERGENCY BANNERS — overlay on top of map */}
      {isInWayOfEmergency && (
        <div className="map-emergency-banner" style={{ background: isLightTheme ? 'rgba(254, 226, 226, 0.9)' : 'rgba(127, 29, 29, 0.85)', color: isLightTheme ? '#b91c1c' : '#fca5a5', border: `1px solid ${isLightTheme ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`, animation: 'pulse 2s infinite' }}>
          <AlertTriangle size={24} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>EMERGENCY VEHICLE APPROACHING</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '2px' }}>An active emergency service is approaching your route. Please clear the way.</div>
          </div>
        </div>
      )}

      {isEmergencyActive && (
        <div className="map-emergency-banner" style={{ background: isLightTheme ? 'rgba(254, 226, 226, 0.95)' : 'rgba(127, 29, 29, 0.9)', color: isLightTheme ? '#b91c1c' : '#fca5a5', border: '2px solid #ef4444', boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)', animation: 'pulse 2s infinite' }}>
          <ShieldAlert size={24} color="#ef4444" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.03em' }}>EMERGENCY SERVICE ACTIVE</div>
            <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: '2px' }}>Route prioritized. End when you reach your destination.</div>
          </div>
          <button
            onClick={endEmergencyService}
            style={{ padding: '0.5rem 1rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.82rem' }}
          >
            End Emergency
          </button>
        </div>
      )}

      {/* ========== DASHBOARD TAB: Google Maps-style Side Panel ========== */}
      {activeTab === 'dashboard' && (
        <>
          {/* Toggle button - always visible */}
          <button
            className={`map-panel-toggle ${isPanelMinimized ? 'map-panel-toggle-collapsed' : ''}`}
            onClick={() => setIsPanelMinimized(p => !p)}
            aria-label={isPanelMinimized ? 'Open panel' : 'Close panel'}
          >
            {isPanelMinimized ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Side Panel */}
          <div className={`map-side-panel ${isPanelMinimized ? 'map-side-panel-min' : ''}`}>
            <div className="map-side-panel-inner">
              {/* Route Panel */}
              <RoutePanel
                onRouteSelect={handleRouteSelect}
                onAreaSelect={handleAreaSelect}
                onClear={handleClear}
                onModeChange={handleModeChange}
                onOpenEmergencyAuth={() => setIsEmergencyAuthOpen(true)}
                isEmergencyActive={isEmergencyActive}
                onWeatherChange={onWeatherChange}
              />

              {/* AVAILABLE ROUTES */}
              {allRoutes.length > 0 && activeRoutePath && !activeArea && !viaRouteInfo && (
                <div className="ios-glass-panel">
                  <div className="routes-section-header">
                    <h2 className="section-title" style={{ fontSize: '1.05rem' }}><CheckCircle size={18} color="#007aff" /> Routes ({allRoutes.length})</h2>
                    <p className="routes-subtitle" style={{ fontSize: '0.82rem' }}>Select a route to preview. Train the AI.</p>
                  </div>
                  <div className="route-grid" style={{ gridTemplateColumns: '1fr' }}>
                    {allRoutes.map((route, idx) => {
                      const isSelected = activeAltIndex === route.alt_index;
                      const fullPath = route.full_path || route.path || [];
                      const hops = fullPath.length;
                      const startName = fullPath[0]?.split('(')[0]?.trim() || '—';
                      const endName = fullPath[fullPath.length - 1]?.split('(')[0]?.trim() || '—';
                      const viaNode = hops > 2 ? fullPath[Math.floor(hops / 2)]?.split('(')[0]?.trim() : null;
                      const congestionLevel = route.expected_time > 40 ? 'high' : route.expected_time > 20 ? 'moderate' : 'low';
                      const congestionColor = congestionLevel === 'high' ? 'var(--danger)' : congestionLevel === 'moderate' ? 'var(--accent-orange)' : 'var(--accent-green)';
                      const sustainability = Math.max(60, 100 - (route.expected_time / 2)).toFixed(0);

                      return (
                        <button
                          key={idx}
                          className={`route-card ${isSelected ? 'active' : ''}`}
                          onClick={() => { setActiveRoutePath(route.path); setActiveAltIndex(route.alt_index); setSelectedChoice(route.is_ai ? 'ai' : 'shortest'); setFeedbackSent(false); }}
                        >
                          <div className="route-card-top">
                            <span className="route-type-badge" style={{ background: route.is_ai ? 'rgba(52, 199, 89, 0.12)' : route.is_shortest ? 'rgba(10, 132, 255, 0.12)' : 'rgba(255, 159, 10, 0.12)', color: route.is_ai ? 'var(--accent-green)' : route.is_shortest ? 'var(--accent-blue)' : 'var(--accent-orange)' }}>
                              {route.is_ai ? 'AI Route' : route.is_shortest ? 'Shortest' : 'Alternate'}
                            </span>
                            {isSelected && <span className="route-selected-dot" />}
                          </div>
                          <div className="route-path-preview">
                            <span className="route-endpoint">{startName}</span>
                            <span className="route-arrow">→</span>
                            {viaNode && <><span className="route-endpoint" style={{ opacity: 0.7, fontSize: '0.75rem' }}>{viaNode}</span><span className="route-arrow">→</span></>}
                            <span className="route-endpoint">{endName}</span>
                          </div>
                          <div className="route-stats-row">
                            <div className="route-stat"><span className="route-stat-value">{route.distance}</span><span className="route-stat-label">km</span></div>
                            <div className="route-stat-divider" />
                            <div className="route-stat"><span className="route-stat-value">{route.expected_time}</span><span className="route-stat-label">min</span></div>
                            <div className="route-stat-divider" />
                            <div className="route-stat"><span className="route-stat-value">{sustainability}%</span><span className="route-stat-label">Eco</span></div>
                          </div>
                          <div className="route-congestion-row">
                            <span className="route-congestion-dot" style={{ background: congestionColor }} />
                            <span className="route-congestion-text" style={{ color: congestionColor }}>
                              {congestionLevel === 'high' ? 'Heavy' : congestionLevel === 'moderate' ? 'Moderate' : 'Clear'}
                            </span>
                            <div className="route-congestion-bar"><div className="route-congestion-fill" style={{ width: `${Math.min(100, (route.expected_time / 60) * 100)}%`, background: congestionColor }} /></div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedChoice && (
                    <div className="route-feedback-row">
                      <button className="ios-button preferred-btn" onClick={submitFeedback} disabled={feedbackSent} style={{ background: feedbackSent ? '#34c759' : '#007aff', color: '#fff', border: 'none' }}>
                        <ThumbsUp size={16} /> {feedbackSent ? 'Saved ✓' : 'Set Preferred'}
                      </button>
                      {feedbackSent && <span className="feedback-success-text">Helps train smarter AI</span>}
                    </div>
                  )}
                </div>
              )}

              {/* ROUTE COMPARISON */}
              {viaRouteInfo && routeInfo && !activeArea && (
                <div className="ios-glass-panel">
                  <div className="routes-section-header">
                    <h2 className="section-title" style={{ fontSize: '1.05rem' }}><Route size={18} color="#ff9500" /> Route Comparison</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button className={`compare-card ${selectedChoice === 'ai' ? 'active-ai' : ''}`} onClick={() => switchToPath('ai')}>
                      <div className="compare-card-header">
                        <div className="compare-icon-wrap" style={{ background: 'rgba(52, 199, 89, 0.12)', width: '36px', height: '36px', borderRadius: '10px' }}>🚀</div>
                        <div className="compare-title-group">
                          <span className="compare-title" style={{ fontSize: '0.95rem' }}>Direct Route</span>
                          <span className="compare-desc">AI-optimized</span>
                        </div>
                        {selectedChoice === 'ai' && <span className="compare-active-badge">Active</span>}
                      </div>
                      <div className="compare-stats-grid">
                        <div className="compare-stat-item"><span className="compare-stat-value" style={{ color: 'var(--accent-green)', fontSize: '1.05rem' }}>{routeInfo.ai_distance}</span><span className="compare-stat-label">km</span></div>
                        <div className="compare-stat-item"><span className="compare-stat-value" style={{ color: 'var(--accent-green)', fontSize: '1.05rem' }}>{routeInfo.ai_time}</span><span className="compare-stat-label">min</span></div>
                        <div className="compare-stat-item"><span className="compare-stat-value" style={{ fontSize: '1.05rem' }}>{(100 - routeInfo.ai_time / 3).toFixed(0)}%</span><span className="compare-stat-label">Eco</span></div>
                        <div className="compare-stat-item"><span className="compare-stat-value" style={{ fontSize: '1.05rem' }}>A+</span><span className="compare-stat-label">Safety</span></div>
                      </div>
                    </button>

                    <button className={`compare-card ${selectedChoice === 'via_stops' ? 'active-via' : ''}`} onClick={() => switchToPath('via_stops')}>
                      <div className="compare-card-header">
                        <div className="compare-icon-wrap" style={{ background: 'rgba(255, 159, 10, 0.12)', width: '36px', height: '36px', borderRadius: '10px' }}>📍</div>
                        <div className="compare-title-group">
                          <span className="compare-title" style={{ fontSize: '0.95rem' }}>Via Stops</span>
                          <span className="compare-desc">Through waypoints</span>
                        </div>
                        {selectedChoice === 'via_stops' && <span className="compare-active-badge" style={{ background: 'rgba(255, 159, 10, 0.15)', color: 'var(--accent-orange)' }}>Active</span>}
                      </div>
                      <div className="compare-stats-grid">
                        <div className="compare-stat-item"><span className="compare-stat-value" style={{ color: 'var(--accent-orange)', fontSize: '1.05rem' }}>{viaRouteInfo.ai_distance}</span><span className="compare-stat-label">km</span></div>
                        <div className="compare-stat-item"><span className="compare-stat-value" style={{ color: 'var(--accent-orange)', fontSize: '1.05rem' }}>{viaRouteInfo.ai_time}</span><span className="compare-stat-label">min</span></div>
                        <div className="compare-stat-item"><span className="compare-stat-value" style={{ fontSize: '1.05rem' }}>{(100 - viaRouteInfo.ai_time / 3).toFixed(0)}%</span><span className="compare-stat-label">Eco</span></div>
                        <div className="compare-stat-item"><span className="compare-stat-value" style={{ fontSize: '1.05rem' }}>A</span><span className="compare-stat-label">Safety</span></div>
                      </div>
                      <div className="compare-delta-row">
                        <div className={`delta-tag ${viaRouteInfo.ai_distance > routeInfo.ai_distance ? 'slower' : 'faster'}`}>
                          {viaRouteInfo.ai_distance > routeInfo.ai_distance ? `+${(viaRouteInfo.ai_distance - routeInfo.ai_distance).toFixed(1)} km` : viaRouteInfo.ai_distance < routeInfo.ai_distance ? `-${(routeInfo.ai_distance - viaRouteInfo.ai_distance).toFixed(1)} km` : 'Same'}
                        </div>
                        <div className={`delta-tag ${viaRouteInfo.ai_time > routeInfo.ai_time ? 'slower' : 'faster'}`}>
                          {viaRouteInfo.ai_time > routeInfo.ai_time ? `+${(viaRouteInfo.ai_time - routeInfo.ai_time).toFixed(0)} min` : viaRouteInfo.ai_time < routeInfo.ai_time ? `-${(routeInfo.ai_time - viaRouteInfo.ai_time).toFixed(0)} min` : 'Same'}
                        </div>
                      </div>
                      {viaRouteInfo.stops && viaRouteInfo.stops.length > 0 && (
                        <div className="compare-stops-list">
                          <span className="compare-stops-label">Stops:</span>
                          {viaRouteInfo.stops.map((stop, i) => (
                            <span key={i} className="compare-stop-chip">{stop.split('(')[0].trim()}</span>
                          ))}
                        </div>
                      )}
                    </button>
                  </div>
                  {selectedChoice && (
                    <div className="route-feedback-row">
                      <button className="ios-button preferred-btn" onClick={submitFeedback} disabled={feedbackSent} style={{ background: feedbackSent ? '#34c759' : '#007aff', color: '#fff', border: 'none' }}>
                        <ThumbsUp size={16} /> {feedbackSent ? 'Saved ✓' : 'Set Preferred'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ========== ANALYTICS TAB ========== */}
      {activeTab === 'analytics' && (
        <div className="map-tab-overlay">
          <div className="ios-glass-panel tab-panel-animate">
            <h2 className="section-title"><BarChart3 size={20} color="var(--accent-blue)" /> Traffic Density Over Time</h2>
            <TrafficChart trafficData={filteredTrafficData} predictions={predictions} />
          </div>
        </div>
      )}

      {/* ========== ALERTS TAB ========== */}
      {activeTab === 'alerts' && (
        <div className="map-tab-overlay">
          <div className="ios-glass-panel tab-panel-animate">
            <AnomalyAlert anomalies={filteredAnomalies} />
          </div>
        </div>
      )}

      {/* ========== LIVE FEED TAB ========== */}
      {activeTab === 'live' && (
        <div className="map-tab-overlay">
          <div className="ios-glass-panel tab-panel-animate">
            <LiveTicker trafficData={filteredTrafficData} />
          </div>
        </div>
      )}

      {/* ========== HISTORY TAB ========== */}
      {activeTab === 'history' && (
        <div className="map-tab-overlay">
          <div className="ios-glass-panel tab-panel-animate">
            {user ? (
              <HistoryPanel onSelectRoute={(path) => handleRouteSelect([path[0], path[path.length - 1]])} />
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                <Clock size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Login to view your route history</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Modals */}
      <IncidentModal isOpen={isIncidentModalOpen} onClose={() => setIsIncidentModalOpen(false)} citiesDb={CITIES_DB} apiUrl={API_URL} />
      <EmergencyAuthModal isOpen={isEmergencyAuthOpen} onClose={() => setIsEmergencyAuthOpen(false)} onAuthSuccess={refreshUser} apiUrl={API_URL} token={token} />
    </>
  );
};

export default Dashboard;