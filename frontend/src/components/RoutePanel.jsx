import React, { useState } from 'react';
import { MapPin, Navigation, Plus, X, ArrowDown } from 'lucide-react';

const CITIES = [
  "India Gate (Delhi)", "Connaught Place (Delhi)", "Kashmiri Gate (Delhi)", "Anand Vihar (Delhi)",
  "Rajiv Chowk (Delhi)", "Hauz Khas (Delhi)", "Botanical Garden (Delhi)", "Chandni Chowk (Delhi)",
  "Karol Bagh (Delhi)", "Lajpat Nagar (Delhi)", "Dhaula Kuan (Delhi)", "INA (Delhi)",
  "Dwarka Sector 21 (Delhi)", "Kalkaji Mandir (Delhi)",
  "Partapur (Meerut)", "Meerut Bypass", "Meerut City Center", "Begampul (Meerut)",
  "Khatauli Bypass (MZN)", "Mansurpur (MZN)", "Muzaffarnagar Toll", "Muzaffarnagar City",
  "Roorkee Bypass", "IIT Roorkee",
  "Har Ki Pauri (Haridwar)", "Shantikunj (Haridwar)", "Haridwar Railway Station", "Chandi Devi (Haridwar)",
  "Triveni Ghat (Rishikesh)", "Laxman Jhula (Rishikesh)", "AIIMS Rishikesh", "Ram Jhula (Rishikesh)",
  "ISBT Dehradun", "Clement Town (Dehradun)", "Niranjanpur Mandi (Dehradun)", "Kargi Chowk (Dehradun)",
  "Saharanpur Chowk (Dehradun)", "Prince Chowk (Dehradun)", "Clock Tower (Dehradun)",
  "Bindal Pull (Dehradun)", "Ballupur Chowk (Dehradun)", "GMS Road (Dehradun)",
  "Vasant Vihar (Dehradun)", "Uttaranchal University (Dehradun)", "Shivalik College (Dehradun)", "Dalanwala (Dehradun)",
  "Rispana Pull (Dehradun)", "Jogiwala (Dehradun)", "Raipur Stadium (Dehradun)",
  "Rajpur Road (Dehradun)", "Jakhan (Dehradun)", "Sahastradhara Crossing (Dehradun)"
];

const EXPLORE_REGIONS = {
  "Dehradun": [
    "Rajpur Road", "ISBT Dehradun", "Clock Tower", "Saharanpur Chowk", 
    "Vasant Vihar", "Uttaranchal University", "Shivalik College", "Raipur Stadium", "Graphic Era University",
    "Prince Chowk", "Dalanwala"
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
    "Dwarka Sector 21", "Kalkaji Mandir"
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

const RoutePanel = ({ onRouteSelect, onAreaSelect, onClear }) => {
  const [mode, setMode] = useState('route'); // 'route' or 'area'
  // waypoints[0] = start, waypoints[last] = end, everything in between = stops
  const [waypoints, setWaypoints] = useState(["", ""]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedPlace, setSelectedPlace] = useState("");

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
      // Filter out empty middle stops
      const validWaypoints = [start, ...waypoints.slice(1, -1).filter(w => w), end];
      onRouteSelect(validWaypoints);
    } else {
      if (!selectedCity) {
        alert("Please select a city to explore!");
        return;
      }
      onAreaSelect(selectedPlace || selectedCity);
    }
  };

  const middleStopCount = waypoints.length - 2;

  return (
    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          <Navigation size={20} />
          {mode === 'route' ? 'Route Selector' : 'Area Traffic Explorer'}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.1)', padding: '0.25rem', borderRadius: '8px' }}>
          <button
            onClick={() => { setMode('route'); if(onClear) onClear(); }}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: mode === 'route' ? 'var(--accent-blue)' : 'transparent', color: mode === 'route' ? '#fff' : 'var(--text-secondary)' }}
          >A to B Route</button>
          <button
            onClick={() => { setMode('area'); if(onClear) onClear(); }}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: mode === 'area' ? 'var(--accent-blue)' : 'transparent', color: mode === 'area' ? '#fff' : 'var(--text-secondary)' }}
          >Explore Area</button>
        </div>
      </div>
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
                      <select
                        value={wp}
                        onChange={(e) => updateWaypoint(idx, e.target.value)}
                        style={{
                          width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                          background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)',
                          border: `1px solid ${wp ? getIconColor(idx) + '60' : 'var(--glass-border)'}`,
                          fontSize: '0.9rem',
                          transition: 'border-color 0.2s ease'
                        }}
                      >
                        <option value="" disabled style={{color: '#999'}}>
                          {idx === 0 ? 'Select start location' : idx === waypoints.length - 1 ? 'Select destination' : 'Select stop (optional)'}
                        </option>
                        {CITIES.map(city => <option key={city} value={city} style={{ color: '#000' }}>{city}</option>)}
                      </select>
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
                background: 'var(--accent-blue)', color: '#fff',
                border: 'none', cursor: 'pointer', fontWeight: 'bold',
                fontSize: '0.9rem',
                marginLeft: 'auto'
              }}>
                Find Shortest Route
              </button>
            </div>

            {middleStopCount > 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.75rem', fontStyle: 'italic' }}>
                💡 The AI will compute the direct shortest path AND the route through your stops — you can compare both.
              </p>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Select City</label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedPlace(""); // Reset place when city changes
                }}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
              >
                <option value="" disabled style={{color: '#999'}}>Select a city</option>
                {Object.keys(EXPLORE_REGIONS).map(city => (
                  <option key={city} value={city} style={{ color: '#000' }}>{city}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '150px', opacity: selectedCity ? 1 : 0.5, pointerEvents: selectedCity ? 'auto' : 'none' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Specific Place (Optional)</label>
              <select
                value={selectedPlace}
                onChange={(e) => setSelectedPlace(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
              >
                <option value="">All of {selectedCity || 'City'}</option>
                {selectedCity && EXPLORE_REGIONS[selectedCity].map(place => (
                  <option key={place} value={place} style={{ color: '#000' }}>{place}</option>
                ))}
              </select>
            </div>

            <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', background: 'var(--accent-blue)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              Explore Area Roads
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default RoutePanel;
