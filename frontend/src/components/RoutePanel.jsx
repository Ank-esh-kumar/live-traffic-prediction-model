import React, { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

const CITIES = [
  "India Gate (Delhi)", "Connaught Place (Delhi)", "Kashmiri Gate (Delhi)", "Anand Vihar (Delhi)",
  "Partapur (Meerut)", "Meerut Bypass", "Meerut City Center", "Begampul (Meerut)",
  "Khatauli Bypass (MZN)", "Mansurpur (MZN)", "Muzaffarnagar Toll", "Muzaffarnagar City",
  "Roorkee Bypass", "IIT Roorkee",
  "Har Ki Pauri (Haridwar)", "Shantikunj (Haridwar)", "Haridwar Railway Station", "Chandi Devi (Haridwar)",
  "Triveni Ghat (Rishikesh)", "Laxman Jhula (Rishikesh)", "AIIMS Rishikesh", "Ram Jhula (Rishikesh)",
  "ISBT Dehradun", "Clement Town (Dehradun)", "Niranjanpur Mandi (Dehradun)", "Kargi Chowk (Dehradun)",
  "Saharanpur Chowk (Dehradun)", "Prince Chowk (Dehradun)", "Clock Tower (Dehradun)",
  "Bindal Pull (Dehradun)", "Ballupur Chowk (Dehradun)", "GMS Road (Dehradun)",
  "Vasant Vihar (Dehradun)", "Prem Nagar (Dehradun)", "Dalanwala (Dehradun)",
  "Rispana Pull (Dehradun)", "Jogiwala (Dehradun)", "Raipur (Dehradun)",
  "Rajpur Road (Dehradun)", "Jakhan (Dehradun)", "Sahastradhara Crossing (Dehradun)"
];

const EXPLORE_REGIONS = {
  "Dehradun": [
    "Rajpur Road", "ISBT Dehradun", "Clock Tower", "Saharanpur Chowk", 
    "Vasant Vihar", "Prem Nagar", "Raipur", "Sahastradhara", "Clement Town",
    "Prince Chowk", "Dalanwala"
  ],
  "Rishikesh": [
    "Triveni Ghat", "Laxman Jhula", "AIIMS Rishikesh", "Ram Jhula"
  ],
  "Haridwar": [
    "Har Ki Pauri", "Shantikunj", "Haridwar Railway Station", "Chandi Devi"
  ],
  "Delhi": [
    "India Gate", "Connaught Place", "Kashmiri Gate", "Anand Vihar"
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

const RoutePanel = ({ onRouteSelect, onAreaSelect, onClear }) => {
  const [mode, setMode] = useState('route'); // 'route' or 'area'
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedPlace, setSelectedPlace] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'route') {
      if (!start || !end) {
        alert("Please select both From and To locations!");
        return;
      }
      if (start === end) {
        alert("Start and end locations cannot be the same!");
        return;
      }
      onRouteSelect(start, end);
    } else {
      if (!selectedCity) {
        alert("Please select a city to explore!");
        return;
      }
      // If a specific place is chosen, explore that, otherwise explore the whole city
      onAreaSelect(selectedPlace || selectedCity);
    }
  };

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
          ? 'Find the fastest path between two locations. The AI analyzes live traffic to suggest the optimal route.' 
          : 'Select a neighborhood or city to instantly see a traffic heat map and congestion levels for all roads in that area.'}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {mode === 'route' ? (
          <>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>From</label>
              <select
                value={start}
                onChange={(e) => setStart(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
              >
                <option value="" disabled style={{color: '#999'}}>Select start location</option>
                {CITIES.map(city => <option key={city} value={city} style={{ color: '#000' }}>{city}</option>)}
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>To</label>
              <select
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
              >
                <option value="" disabled style={{color: '#999'}}>Select destination</option>
                {CITIES.map(city => <option key={city} value={city} style={{ color: '#000' }}>{city}</option>)}
              </select>
            </div>

            <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', background: 'var(--accent-blue)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              Get Route
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
      </form>
    </div>
  );
};

export default RoutePanel;
