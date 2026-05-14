import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Plus, X, ArrowDown, Leaf, AlertTriangle, CloudRain, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CITIES = [
  "India Gate (Delhi)", "Connaught Place (Delhi)", "Kashmiri Gate (Delhi)", "Anand Vihar (Delhi)",
  "Rajiv Chowk (Delhi)", "Hauz Khas (Delhi)", "Botanical Garden (Delhi)", "Chandni Chowk (Delhi)",
  "Karol Bagh (Delhi)", "Lajpat Nagar (Delhi)", "Dhaula Kuan (Delhi)", "INA (Delhi)",
  "Dwarka Sector 21 (Delhi)", "Kalkaji Mandir (Delhi)", "AIIMS New Delhi", "Safdarjung Hospital (Delhi)",
  "Apollo Hospital (Delhi)", "Parliament Street Police Station (Delhi)", "Hauz Khas Police Station (Delhi)",
  "Connaught Place Police Station (Delhi)", "Connaught Circus Fire Station (Delhi)", "Safdarjung Fire Station (Delhi)",
  "Partapur (Meerut)", "Meerut Bypass", "Meerut City Center", "Begampul (Meerut)",
  "Khatauli Bypass (MZN)", "Mansurpur (MZN)", "Muzaffarnagar Toll", "Muzaffarnagar City",
  "Roorkee Bypass", "IIT Roorkee",
  "Har Ki Pauri (Haridwar)", "Shantikunj (Haridwar)", "Haridwar Railway Station", "Chandi Devi (Haridwar)",
  "Triveni Ghat (Rishikesh)", "Laxman Jhula (Rishikesh)", "AIIMS Rishikesh", "Ram Jhula (Rishikesh)",
  "ISBT Dehradun", "Clement Town (Dehradun)", "Graphic Era University (Dehradun)", "Niranjanpur Mandi (Dehradun)", "Kargi Chowk (Dehradun)",
  "Saharanpur Chowk (Dehradun)", "Prince Chowk (Dehradun)", "Clock Tower (Dehradun)",
  "Bindal Pull (Dehradun)", "Ballupur Chowk (Dehradun)", "GMS Road (Dehradun)",
  "Vasant Vihar (Dehradun)", "Uttaranchal University (Dehradun)", "Shivalik College (Dehradun)", "Dalanwala (Dehradun)",
  "Rispana Pull (Dehradun)", "Jogiwala (Dehradun)", "Raipur Stadium (Dehradun)",
  "Rajpur Road (Dehradun)", "Jakhan (Dehradun)", "Sahastradhara Crossing (Dehradun)",
  "Doon Hospital (Dehradun)", "Max Super Speciality Hospital (Dehradun)", "Synergy Hospital (Dehradun)",
  "Kotwali Dehradun", "Prem Nagar Police Station (Dehradun)", "Rajpur Police Station (Dehradun)",
  "Fire Station Dehradun", "Mussoorie (Dehradun)", "Chakrata (Dehradun)", "Selaqui (Dehradun)"
];

const EXPLORE_REGIONS = {
  "Dehradun": [
    "Rajpur Road", "ISBT Dehradun", "Clock Tower", "Saharanpur Chowk", 
    "Vasant Vihar", "Uttaranchal University", "Shivalik College", "Raipur Stadium", "Graphic Era University (Dehradun)",
    "Prince Chowk", "Dalanwala", "Doon Hospital", "Max Super Speciality Hospital", "Synergy Hospital",
    "Kotwali", "Prem Nagar Police Station", "Rajpur Police Station", "Fire Station Dehradun",
    "Mussoorie", "Chakrata", "Selaqui"
  ],
  "Rishikesh": [
    "Triveni Ghat", "Laxman Jhula", "AIIMS Rishikesh", "Ram Jhula"
  ],
  "Haridwar": [
    "Har Ki Pauri", "Shantikunj", "Haridwar Railway Station", "Chandi Devi"
  ],
  "Delhi": [
    "India Gate", "Connaught Place", "Kashmiri Gate", "Anand Vihar",
    "Rajiv Chowk", "Hauz Khas", "Botanical Garden", "Chandni Chowk",
    "Karol Bagh", "Lajpat Nagar", "Dhaula Kuan", "INA",
    "Dwarka Sector 21", "Kalkaji Mandir", "AIIMS New Delhi", "Safdarjung Hospital",
    "Apollo Hospital", "Parliament Street Police Station", "Hauz Khas Police Station",
    "Connaught Place Police Station", "Connaught Circus Fire Station", "Safdarjung Fire Station"
  ],
  "Meerut": [
    "Partapur", "Meerut Bypass", "Meerut City Center", "Begampul"
  ],
  "Muzaffarnagar": [
    "Khatauli", "Mansurpur", "Muzaffarnagar Toll", "Muzaffarnagar City"
  ],
  "Roorkee": [
    "Roorkee Bypass", "IIT Roorkee"
  ]
};

const MAX_STOPS = 5; // Maximum number of middle stops

const RoutePanel = ({ onRouteSelect, onAreaSelect, onClear, onModeChange, onOpenEmergencyAuth, isEmergencyActive }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState('route'); // 'route' or 'area'
  const [waypoints, setWaypoints] = useState(["", ""]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedPlace, setSelectedPlace] = useState("");
  const [routingMode, setRoutingMode] = useState('fast'); // 'fast' | 'eco'
  const [isEmergency, setIsEmergency] = useState(false);

  // Sync internal state with external dashboard state (e.g. when "End Emergency" is clicked)
  React.useEffect(() => {
    if (isEmergencyActive !== undefined) {
      setIsEmergency(isEmergencyActive);
    }
  }, [isEmergencyActive]);
  const [weatherData, setWeatherData] = useState(null);

  // Fetch weather when city changes
  useEffect(() => {
    if (!selectedCity) {
      setWeatherData(null);
      return;
    }
    const fetchWeather = async () => {
      // Find coordinates for the city to fetch weather
      const cityNodeKey = Object.keys(CITIES).find(k => CITIES[k].includes(selectedCity));
      // Just approximate based on region since it's an area
      const coordsMap = {
        "Dehradun": { lat: 30.3165, lon: 78.0322 },
        "Delhi": { lat: 28.6139, lon: 77.2090 },
        "Meerut": { lat: 28.9845, lon: 77.7064 },
        "Muzaffarnagar": { lat: 29.4727, lon: 77.7085 },
        "Roorkee": { lat: 29.8543, lon: 77.8880 },
        "Haridwar": { lat: 29.9457, lon: 78.1642 },
        "Rishikesh": { lat: 30.0869, lon: 78.2676 }
      };
      const coords = coordsMap[selectedCity];
      if (!coords) return;
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&timezone=auto`);
        const data = await res.json();
        setWeatherData(data.current);
      } catch (e) {
        console.error("Failed to fetch weather", e);
      }
    };
    fetchWeather();
  }, [selectedCity]);

  const updateWaypoint = (index, value) => {
    const updated = [...waypoints];
    updated[index] = value;
    setWaypoints(updated);
  };

  const addStop = () => {
    if (waypoints.length - 2 >= MAX_STOPS) return; // Already at max
    const updated = [...waypoints];
    // Insert before the last element (destination)
    updated.splice(updated.length - 1, 0, "");
    setWaypoints(updated);
  };

  const removeStop = (index) => {
    if (index === 0 || index === waypoints.length - 1) return; // Can't remove start/end
    const updated = [...waypoints];
    updated.splice(index, 1);
    setWaypoints(updated);
  };

  const getLabel = (index) => {
    if (index === 0) return "From";
    if (index === waypoints.length - 1) return "To";
    return `Stop ${index}`;
  };

  const getIconColor = (index) => {
    if (index === 0) return '#22c55e'; // Green for start
    if (index === waypoints.length - 1) return '#ef4444'; // Red for end
    return '#f59e0b'; // Amber for stops
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'route') {
      const start = waypoints[0];
      const end = waypoints[waypoints.length - 1];
      if (!start || !end) {
        alert("Please select both From and To locations!");
        return;
      }
      if (start === end) {
        alert("Start and end locations cannot be the same!");
        return;
      }

      // If normal user (medical pass) requests emergency, start or destination MUST be a hospital or police station
      if (isEmergency && user?.emergency_auth?.role === 'medical') {
        const startLower = start.toLowerCase();
        const destLower = end.toLowerCase();
        
        const isMedicalOrPolice = (str) => 
          str.includes('hospital') || 
          str.includes('police') || 
          str.includes('kotwali') || 
          str.includes('aiims');

        const isValidEmergencyRoute = isMedicalOrPolice(startLower) || isMedicalOrPolice(destLower);

        if (!isValidEmergencyRoute) {
          alert("⚠️ Emergency Service Warning\n\nFor normal users, emergency routing is strictly restricted to medical or police emergencies. Your initial or final destination must be a valid Hospital or Police Station.\n\nEmergency priority has been disabled.");
          setIsEmergency(false);
          if (onModeChange) onModeChange('ai'); // Revert to AI
          return;
        }
      }

      // Filter out empty middle stops
      const validWaypoints = [start, ...waypoints.slice(1, -1).filter(w => w), end];
      onRouteSelect(validWaypoints, { mode: routingMode, emergency: isEmergency });
    } else {
      if (!selectedCity) {
        alert("Please select a city to explore!");
        return;
      }
      onAreaSelect(selectedPlace || selectedCity);
    }
  };

  const middleStopCount = waypoints.length - 2;

  const getWeatherClass = (code) => {
    if (code === undefined || code === null) return '';
    if (code === 0 || code === 1) return 'weather-clear';
    if (code === 2 || code === 3 || code === 45 || code === 48) return 'weather-clouds';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'weather-rain';
    if ([71, 73, 75, 85, 86].includes(code)) return 'weather-snow';
    if ([95, 96, 99].includes(code)) return 'weather-thunder';
    return '';
  };

  const activeWeatherClass = mode === 'area' && weatherData ? getWeatherClass(weatherData.weather_code) : '';

  return (
    <div className="glass-panel weather-container" style={{ marginBottom: '2rem' }}>
      {/* Subtle animated weather background */}
      {activeWeatherClass && <div className={`weather-bg ${activeWeatherClass}`}></div>}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', position: 'relative', zIndex: 1 }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          <Navigation size={20} />
          {mode === 'route' ? 'Route Selector' : 'Area Traffic Explorer'}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.1)', padding: '0.25rem', borderRadius: '8px' }}>
          <button
            onClick={() => { setMode('route'); setWaypoints(["", ""]); setIsEmergency(false); setRoutingMode('fast'); if(onClear) onClear(); }}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: mode === 'route' ? 'var(--accent-blue)' : 'transparent', color: mode === 'route' ? '#fff' : 'var(--text-secondary)' }}
          >A to B Route</button>
          <button
            onClick={() => { setMode('area'); setWaypoints(["", ""]); setIsEmergency(false); setRoutingMode('fast'); if(onClear) onClear(); }}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: mode === 'area' ? 'var(--accent-blue)' : 'transparent', color: mode === 'area' ? '#fff' : 'var(--text-secondary)' }}
          >Explore Area</button>
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          {mode === 'route' 
            ? 'Find the shortest path between two locations. Optionally add middle stops — the AI will show the direct optimal route AND the route through your stops so you can compare.' 
            : 'Select a neighborhood or city to instantly see a traffic heat map and congestion levels for all roads in that area.'}
        </p>

        <form onSubmit={handleSubmit}>
        {mode === 'route' ? (
          <>
            {/* Waypoint Builder */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginBottom: '1rem' }}>
              {waypoints.map((wp, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'stretch', gap: '0' }}>
                  {/* Step indicator column */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px', flexShrink: 0
                  }}>
                    {/* Connector line above (except first) */}
                    {idx > 0 && (
                      <div style={{
                        width: '2px', height: '12px',
                        background: 'var(--glass-highlight)',
                        flexShrink: 0
                      }} />
                    )}
                    {/* Dot */}
                    <div style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      background: getIconColor(idx),
                      border: '2px solid rgba(255,255,255,0.3)',
                      flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '8px', color: '#fff', fontWeight: 'bold'
                    }}>
                      {idx > 0 && idx < waypoints.length - 1 ? idx : ''}
                    </div>
                    {/* Connector line below (except last) */}
                    {idx < waypoints.length - 1 && (
                      <div style={{
                        width: '2px', flex: 1, minHeight: '12px',
                        background: 'var(--glass-highlight)',
                        flexShrink: 0
                      }} />
                    )}
                  </div>

                  {/* Input row */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem', paddingTop: idx === 0 ? '0' : '0' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500' }}>
                        {getLabel(idx)}
                      </label>
                      <input
                        list={`city-list-${idx}`}
                        value={wp}
                        onChange={(e) => updateWaypoint(idx, e.target.value)}
                        placeholder={idx === 0 ? 'Type start location...' : idx === waypoints.length - 1 ? 'Type destination...' : 'Type stop (optional)...'}
                        style={{
                          width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                          background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)',
                          border: `1px solid ${wp ? getIconColor(idx) + '60' : 'var(--glass-border)'}`,
                          fontSize: '0.9rem',
                          transition: 'border-color 0.2s ease'
                        }}
                      />
                      <datalist id={`city-list-${idx}`}>
                        {CITIES.map(city => <option key={city} value={city} />)}
                      </datalist>
                    </div>
                    {/* Remove button for middle stops only */}
                    {idx > 0 && idx < waypoints.length - 1 && (
                      <button
                        type="button"
                        onClick={() => removeStop(idx)}
                        title="Remove this stop"
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginTop: '1.25rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons row */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={addStop}
                disabled={middleStopCount >= MAX_STOPS}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.6rem 1rem', borderRadius: '8px',
                  background: middleStopCount >= MAX_STOPS ? 'rgba(0,0,0,0.05)' : 'rgba(245, 158, 11, 0.12)',
                  color: middleStopCount >= MAX_STOPS ? 'var(--text-secondary)' : '#f59e0b',
                  border: `1px solid ${middleStopCount >= MAX_STOPS ? 'var(--glass-border)' : 'rgba(245, 158, 11, 0.3)'}`,
                  cursor: middleStopCount >= MAX_STOPS ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem', fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                <Plus size={16} />
                Add Stop {middleStopCount > 0 && `(${middleStopCount}/${MAX_STOPS})`}
              </button>

              <button type="submit" style={{
                padding: '0.6rem 1.5rem', borderRadius: '8px',
                background: isEmergency ? '#ef4444' : (routingMode === 'eco' ? '#22c55e' : 'var(--accent-blue)'), 
                color: '#fff',
                border: 'none', cursor: 'pointer', fontWeight: 'bold',
                fontSize: '0.9rem',
                marginLeft: 'auto',
                transition: 'background 0.3s'
              }}>
                {isEmergency ? 'Start Emergency Service' : 'Find Optimal Route'}
              </button>
            </div>

            {/* Advanced Routing Options */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: routingMode === 'eco' ? '#22c55e' : 'var(--text-primary)', transition: 'color 0.3s' }}>
                 <input type="checkbox" checked={routingMode === 'eco'} onChange={(e) => {
                   const newMode = e.target.checked ? 'eco' : 'fast';
                   setRoutingMode(newMode);
                   if (!isEmergency && onModeChange) {
                     onModeChange(newMode === 'eco' ? 'eco' : 'ai');
                   }
                 }} style={{ cursor: 'pointer' }} />
                 <Leaf size={16} color="#22c55e" />
                 Eco-Route (Save Fuel)
               </label>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: (user?.emergency_auth?.authorized) ? 'pointer' : 'not-allowed', fontSize: '0.9rem', color: isEmergency ? '#ef4444' : (user?.emergency_auth?.authorized ? 'var(--text-primary)' : 'var(--text-secondary)'), transition: 'color 0.3s', opacity: user?.emergency_auth?.authorized ? 1 : 0.6 }}>
                   <input 
                     type="checkbox" 
                     checked={isEmergency} 
                     disabled={!user || !user.emergency_auth?.authorized}
                     onChange={(e) => {
                       const checked = e.target.checked;
                       setIsEmergency(checked);
                       if (onModeChange) {
                         onModeChange(checked ? 'emergency' : (routingMode === 'eco' ? 'eco' : 'ai'));
                       }
                     }} 
                     style={{ cursor: (user?.emergency_auth?.authorized) ? 'pointer' : 'not-allowed' }} 
                   />
                   <AlertTriangle size={16} color={user?.emergency_auth?.authorized ? "#ef4444" : "#999"} />
                   Emergency Service
                 </label>
                 
                 {(!user || !user.emergency_auth?.authorized) && (
                   <button
                     type="button"
                     onClick={() => {
                       if (!user) {
                         alert("Please login first to request emergency authorization.");
                       } else if (onOpenEmergencyAuth) {
                         onOpenEmergencyAuth();
                       }
                     }}
                     style={{
                       background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                       color: '#ef4444', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px',
                       cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
                     }}
                   >
                     <Lock size={12} /> Request Access
                   </button>
                 )}
               </div>
            </div>

            {middleStopCount > 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.75rem', fontStyle: 'italic' }}>
                💡 The AI will compute the direct shortest path AND the route through your stops — you can compare both.
              </p>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Select City</label>
                <input
                  list="explore-city-list"
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedPlace(""); // Reset place when city changes
                  }}
                  placeholder="Type a city..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                />
                <datalist id="explore-city-list">
                  {Object.keys(EXPLORE_REGIONS).map(city => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>

              <div style={{ flex: 1, minWidth: '150px', opacity: selectedCity ? 1 : 0.5, pointerEvents: selectedCity ? 'auto' : 'none' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Specific Place (Optional)</label>
                <input
                  list="explore-place-list"
                  value={selectedPlace}
                  onChange={(e) => setSelectedPlace(e.target.value)}
                  placeholder={`Type a place in ${selectedCity || 'City'} (Optional)`}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                />
                <datalist id="explore-place-list">
                  {selectedCity && EXPLORE_REGIONS[selectedCity] && EXPLORE_REGIONS[selectedCity].map(place => (
                    <option key={place} value={place} />
                  ))}
                </datalist>
              </div>

              <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', background: 'var(--accent-blue)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                Explore Area Roads
              </button>
            </div>
            {weatherData && (
               <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <CloudRain size={24} color="#0ea5e9" />
                  <div>
                     <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Current Weather in {selectedCity}</h4>
                     <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Temp: {weatherData.temperature_2m}°C | Wind: {weatherData.wind_speed_10m} km/h | Precipitation: {weatherData.precipitation} mm
                     </p>
                  </div>
               </div>
            )}
          </>
        )}
      </form>
      </div>
    </div>
  );
};

export default RoutePanel;
