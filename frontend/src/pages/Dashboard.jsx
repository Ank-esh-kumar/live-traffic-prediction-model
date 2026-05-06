import React, { useState, useMemo, useEffect } from 'react';
import { useLiveTraffic } from '../hooks/useLiveTraffic';
import MapView from '../components/MapView';
import TrafficChart from '../components/TrafficChart';
import LiveTicker from '../components/LiveTicker';
import AnomalyAlert from '../components/AnomalyAlert';
import RoutePanel from '../components/RoutePanel';
import { Activity, Sun, Moon, ExternalLink, CheckCircle, ThumbsUp } from 'lucide-react';

const Dashboard = () => {
  const { trafficData, anomalies, predictions, isConnected } = useLiveTraffic();
  const [activeRoutePath, setActiveRoutePath] = useState(null);
  const [shortestPath, setShortestPath] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [allRoutes, setAllRoutes] = useState([]);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [routeEndpoints, setRouteEndpoints] = useState(null); // { start, end }

  const [activeArea, setActiveArea] = useState(null);

  useEffect(() => {
    if (isLightTheme) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [isLightTheme]);

  const openGoogleMaps = () => {
    if (!activeRoutePath || activeRoutePath.length === 0) return;

    // Construct Google Maps Directions URL using coordinates
    // Using the hardcoded CITIES array from MapView to get lat/lng
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
      "ISBT Dehradun": { lat: 30.2858, lng: 77.9959 },
      "Clock Tower (Dehradun)": { lat: 30.3243, lng: 78.0418 },
      "Rajpur Road (Dehradun)": { lat: 30.3421, lng: 78.0558 }
    };

    const waypoints = activeRoutePath.map(node => {
      const city = CITIES_DB[node];
      return city ? `${city.lat},${city.lng}` : '';
    }).filter(Boolean);

    if (waypoints.length >= 2) {
      const origin = waypoints[0];
      const destination = waypoints[waypoints.length - 1];
      const waypointsParam = waypoints.slice(1, -1).join('|');

      let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
      if (waypointsParam) {
        url += `&waypoints=${waypointsParam}`;
      }
      window.open(url, '_blank');
    }
  };

  const handleRouteSelect = async (start, end) => {
    setActiveArea(null); // Clear area mode
    setSelectedChoice(null);
    setFeedbackSent(false);
    try {
      const response = await fetch('http://localhost:8000/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_node: start, end_node: end })
      });
      const data = await response.json();
      if (data.ai_path) {
        setActiveRoutePath(data.ai_path);
        setShortestPath(data.shortest_path);
        setRouteInfo({ ai_distance: data.ai_distance, ai_cost: data.ai_cost, ai_time: data.ai_time, shortest_cost: data.shortest_cost, shortest_time: data.shortest_time, originalAiPath: data.ai_path });
        setAllRoutes(data.all_routes || []);
        setRouteEndpoints({ start, end });
      } else if (data.path) {
        setActiveRoutePath(data.path);
      } else {
        alert(data.error || "No route found");
      }
    } catch (err) {
      console.error("Route fetching failed", err);
      alert("Failed to fetch route. Is the backend running?");
    }
  };

  const handleViaRoute = async (viaNodeId) => {
    if (!routeEndpoints) return;
    try {
      const response = await fetch('http://localhost:8000/api/route/via', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_node: routeEndpoints.start, via_node: viaNodeId, end_node: routeEndpoints.end })
      });
      if (!response.ok) {
        const errData = await response.json();
        alert(`⚠️ Route via ${viaNodeId} not possible: ${errData.detail || 'No path found'}`);
        return;
      }
      const data = await response.json();
      if (data.ai_path) {
        setActiveRoutePath(data.ai_path);
        setShortestPath(data.shortest_path);
        setRouteInfo({ ai_distance: data.ai_distance, ai_cost: data.ai_cost, ai_time: data.ai_time, shortest_cost: data.shortest_cost, shortest_time: data.shortest_time, originalAiPath: data.ai_path });
        setAllRoutes(data.all_routes || []);
        setSelectedChoice(null);
        setFeedbackSent(false);
      }
    } catch (err) {
      console.error("Via-route failed", err);
      alert("Failed to calculate route via this point.");
    }
  };

  const switchToPath = (choice) => {
    setSelectedChoice(choice);
    setFeedbackSent(false);
    if (choice === 'shortest' && shortestPath) {
      setActiveRoutePath(shortestPath);
    } else if (choice === 'ai' && routeInfo && routeInfo.originalAiPath) {
      setActiveRoutePath(routeInfo.originalAiPath);
    }
  };

  const submitFeedback = async () => {
    if (!selectedChoice || !routeInfo) return;
    try {
      await fetch('http://localhost:8000/api/feedback', {
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
    setActiveRoutePath(null); // Clear route mode
    setShortestPath(null);
    setActiveArea(areaName);
  };

  const handleClear = () => {
    setActiveRoutePath(null);
    setShortestPath(null);
    setRouteInfo(null);
    setAllRoutes([]);
    setActiveArea(null);
    setSelectedChoice(null);
    setFeedbackSent(false);
    setRouteEndpoints(null);
  };

  // Filter traffic data to only show nodes in the selected path OR area
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

  // Filter anomalies as well
  const filteredAnomalies = useMemo(() => {
    if (!activeRoutePath && !activeArea) return anomalies;
    if (activeRoutePath) {
      return anomalies.filter(a => activeRoutePath.includes(a.node_id));
    } else if (activeArea) {
      return anomalies.filter(a => a.node_id.includes(`(${activeArea})`) || a.node_id.includes(activeArea) || (activeArea === "Muzaffarnagar" && a.node_id.includes("MZN")));
    }
    return anomalies;
  }, [anomalies, activeRoutePath, activeArea]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-1rem' }}>
        <button
          onClick={() => setIsLightTheme(!isLightTheme)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '8px',
            background: 'var(--glass-bg)', color: 'var(--text-primary)',
            border: '1px solid var(--glass-border)', cursor: 'pointer'
          }}
        >
          {isLightTheme ? <Moon size={18} /> : <Sun size={18} />}
          {isLightTheme ? 'Dark Mode' : 'Light Mode'}
        </button>
      </div>

      <RoutePanel onRouteSelect={handleRouteSelect} onAreaSelect={handleAreaSelect} onClear={handleClear} />

      <div className="dashboard-grid">
        <div className="main-content">
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                <Activity className={isConnected ? "text-green-400" : "text-red-400"} />
                Live Network Map {activeArea && `- ${activeArea} Region`}
                {!isConnected && <span style={{ fontSize: '0.8rem', color: 'var(--danger)', marginLeft: '1rem' }}>(Connecting...)</span>}
              </h2>
              {activeRoutePath && (
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
            <MapView trafficData={trafficData} activeRoutePath={activeRoutePath} shortestPath={shortestPath} routeInfo={routeInfo} allRoutes={allRoutes} activeArea={activeArea} isLightTheme={isLightTheme} onViaRoute={handleViaRoute} routeEndpoints={routeEndpoints} />
          </div>

          {/* Route Choice Panel — only show when routes exist */}
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
                  const isSelected = activeRoutePath && activeRoutePath.length === route.path.length && activeRoutePath.every((v, i) => v === route.path[i]);
                  return (
                    <button
                      key={idx}
                      onClick={() => { setActiveRoutePath(route.path); setSelectedChoice(route.is_ai ? 'ai' : route.is_shortest ? 'shortest' : 'custom'); setFeedbackSent(false); }}
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
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {route.path.length} stops · {route.path.join(' → ')}
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
