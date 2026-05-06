import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';

const CITIES = [
  {"id": "India Gate (Delhi)", "lat": 28.6129, "lng": 77.2295},
  {"id": "Connaught Place (Delhi)", "lat": 28.6304, "lng": 77.2177},
  {"id": "Kashmiri Gate (Delhi)", "lat": 28.6665, "lng": 77.2289},
  {"id": "Anand Vihar (Delhi)", "lat": 28.6469, "lng": 77.3160},
  {"id": "Partapur (Meerut)", "lat": 28.9186, "lng": 77.6599},
  {"id": "Meerut Bypass", "lat": 28.9845, "lng": 77.7064},
  {"id": "Meerut City Center", "lat": 28.9845, "lng": 77.7364},
  {"id": "Begampul (Meerut)", "lat": 29.0064, "lng": 77.7029},
  {"id": "Khatauli Bypass (MZN)", "lat": 29.2801, "lng": 77.7212},
  {"id": "Mansurpur (MZN)", "lat": 29.3789, "lng": 77.7126},
  {"id": "Muzaffarnagar Toll", "lat": 29.4727, "lng": 77.7085},
  {"id": "Muzaffarnagar City", "lat": 29.4727, "lng": 77.7385},
  {"id": "Roorkee Bypass", "lat": 29.8315, "lng": 77.8920},
  {"id": "IIT Roorkee", "lat": 29.8649, "lng": 77.8966},
  {"id": "Har Ki Pauri (Haridwar)", "lat": 29.9538, "lng": 78.1719},
  {"id": "Shantikunj (Haridwar)", "lat": 29.9926, "lng": 78.1963},
  {"id": "Haridwar Railway Station", "lat": 29.9472, "lng": 78.1614},
  {"id": "Chandi Devi (Haridwar)", "lat": 29.9332, "lng": 78.1751},
  {"id": "Triveni Ghat (Rishikesh)", "lat": 30.1030, "lng": 78.2970},
  {"id": "Laxman Jhula (Rishikesh)", "lat": 30.1227, "lng": 78.3276},
  {"id": "AIIMS Rishikesh", "lat": 30.0763, "lng": 78.2934},
  {"id": "Ram Jhula (Rishikesh)", "lat": 30.1130, "lng": 78.3129},
  {"id": "ISBT Dehradun", "lat": 30.2858, "lng": 77.9959},
  {"id": "Clement Town (Dehradun)", "lat": 30.2662, "lng": 78.0069},
  {"id": "Niranjanpur Mandi (Dehradun)", "lat": 30.3060, "lng": 78.0040},
  {"id": "Kargi Chowk (Dehradun)", "lat": 30.2905, "lng": 78.0195},
  {"id": "Saharanpur Chowk (Dehradun)", "lat": 30.3150, "lng": 78.0260},
  {"id": "Prince Chowk (Dehradun)", "lat": 30.3175, "lng": 78.0335},
  {"id": "Clock Tower (Dehradun)", "lat": 30.3243, "lng": 78.0418},
  {"id": "Bindal Pull (Dehradun)", "lat": 30.3275, "lng": 78.0330},
  {"id": "Ballupur Chowk (Dehradun)", "lat": 30.3340, "lng": 78.0160},
  {"id": "GMS Road (Dehradun)", "lat": 30.3200, "lng": 78.0050},
  {"id": "Vasant Vihar (Dehradun)", "lat": 30.3320, "lng": 77.9950},
  {"id": "Prem Nagar (Dehradun)", "lat": 30.3350, "lng": 77.9650},
  {"id": "Dalanwala (Dehradun)", "lat": 30.3250, "lng": 78.0550},
  {"id": "Rispana Pull (Dehradun)", "lat": 30.3015, "lng": 78.0461},
  {"id": "Jogiwala (Dehradun)", "lat": 30.2954, "lng": 78.0573},
  {"id": "Raipur (Dehradun)", "lat": 30.3080, "lng": 78.0960},
  {"id": "Rajpur Road (Dehradun)", "lat": 30.3421, "lng": 78.0558},
  {"id": "Jakhan (Dehradun)", "lat": 30.3640, "lng": 78.0750},
  {"id": "Sahastradhara Crossing (Dehradun)", "lat": 30.3550, "lng": 78.0710}
];

const MapBoundsController = ({ activeArea, activeRoutePath, shortestPath, cities }) => {
  const map = useMap();

  useEffect(() => {
    let targetNodes = [];
    if (activeRoutePath) {
      targetNodes = cities.filter(c => activeRoutePath.includes(c.id));
    } else if (shortestPath) {
      targetNodes = cities.filter(c => shortestPath.includes(c.id));
    } else if (activeArea) {
      targetNodes = cities.filter(c => c.id.includes(`(${activeArea})`) || c.id.includes(activeArea) || (activeArea === "Muzaffarnagar" && c.id.includes("MZN")));
    }

    if (targetNodes.length > 0) {
      const bounds = L.latLngBounds(targetNodes.map(c => [c.lat, c.lng]));
      // Add a small delay to ensure geometry is somewhat loaded before panning
      setTimeout(() => {
        map.fitBounds(bounds, { padding: [50, 50], animate: true, maxZoom: 13 });
      }, 300);
    }
  }, [activeArea, activeRoutePath, shortestPath, map, cities]);

  return null;
}

const getTrafficColor = (density) => {
  if (!density && density !== 0) return '#94a3b8'; 
  if (density < 40) return '#22c55e'; // Green
  if (density < 75) return '#eab308'; // Yellow
  return '#ef4444'; // Red
};

// Create a custom Google Maps style pin using DivIcon
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 36 12 36C12 36 24 21 24 12C17.3726 12 24 5.37258 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
      </svg>
    `,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36]
  });
};

const fetchFullOSRMSegments = async (pathNodes) => {
  if (!pathNodes || pathNodes.length < 2) return [];
  const cities = pathNodes.map(id => CITIES.find(c => c.id === id)).filter(Boolean);
  if (cities.length < 2) return [];

  const coordsString = cities.map(c => `${c.lng},${c.lat}`).join(';');
  
  try {
    // overview=false & steps=true gives us the exact geometry split perfectly by each waypoint (leg)
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=false&geometries=geojson&steps=true`);
    const data = await response.json();
    
    if (data.routes && data.routes[0] && data.routes[0].legs) {
      const segments = [];
      data.routes[0].legs.forEach((leg, i) => {
        const positions = [];
        if (leg.steps) {
          leg.steps.forEach(step => {
            if (step.geometry && step.geometry.coordinates) {
              step.geometry.coordinates.forEach(c => positions.push([c[1], c[0]]));
            }
          });
        }
        // Fallback to straight line if geometry is missing for some reason
        if (positions.length === 0) {
          positions.push([cities[i].lat, cities[i].lng], [cities[i+1].lat, cities[i+1].lng]);
        }
        segments.push({
          destinationId: pathNodes[i+1], // The node this segment leads to
          positions
        });
      });
      return segments;
    }
  } catch (err) {
    console.error("OSRM full route fetch failed", err);
  }
  
  // Fallback: Just return straight lines
  const fallback = [];
  for (let i = 0; i < cities.length - 1; i++) {
    fallback.push({
      destinationId: pathNodes[i+1],
      positions: [[cities[i].lat, cities[i].lng], [cities[i+1].lat, cities[i+1].lng]]
    });
  }
  return fallback;
};

const osrmCache = new Map();

const fetchSimpleOSRMRoute = async (pathNodes) => {
  if (!pathNodes || pathNodes.length < 2) return [];
  const cacheKey = pathNodes.join('|');
  if (osrmCache.has(cacheKey)) return osrmCache.get(cacheKey);

  const cities = pathNodes.map(id => CITIES.find(c => c.id === id)).filter(Boolean);
  if (cities.length < 2) return [];
  
  const coordsString = cities.map(c => `${c.lng},${c.lat}`).join(';');
  try {
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`);
    const data = await response.json();
    if (data.routes && data.routes[0]) {
      const positions = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      osrmCache.set(cacheKey, positions);
      return positions;
    }
  } catch (err) {
    console.error("OSRM simple route fetch failed", err);
  }
  // Fallback straight lines
  const fallback = cities.map(c => [c.lat, c.lng]);
  osrmCache.set(cacheKey, fallback);
  return fallback;
};

const fetchAreaRoads = async (areaName) => {
  try {
    const res = await fetch(`http://localhost:8000/api/route/area/${encodeURIComponent(areaName)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.edges || [];
  } catch (err) {
    console.error("Failed to fetch area roads", err);
    return [];
  }
};

const EDGES = [
  // Delhi internal
  ["India Gate (Delhi)", "Connaught Place (Delhi)"],
  ["Connaught Place (Delhi)", "Kashmiri Gate (Delhi)"],
  ["Connaught Place (Delhi)", "Anand Vihar (Delhi)"],
  ["Kashmiri Gate (Delhi)", "Partapur (Meerut)"],
  ["Anand Vihar (Delhi)", "Partapur (Meerut)"],
  
  // Meerut branching
  ["Partapur (Meerut)", "Meerut Bypass"],
  ["Partapur (Meerut)", "Meerut City Center"],
  ["Meerut Bypass", "Khatauli Bypass (MZN)"],
  ["Meerut City Center", "Khatauli Bypass (MZN)"],
  
  // MZN branching
  ["Khatauli Bypass (MZN)", "Mansurpur (MZN)"],
  ["Mansurpur (MZN)", "Muzaffarnagar Toll"],
  ["Mansurpur (MZN)", "Muzaffarnagar City"],
  ["Muzaffarnagar Toll", "Roorkee Bypass"],
  ["Muzaffarnagar City", "Roorkee Bypass"],
  
  // Roorkee branching
  ["Roorkee Bypass", "IIT Roorkee"],
  ["Roorkee Bypass", "ISBT Dehradun"],
  ["IIT Roorkee", "ISBT Dehradun"],
  
  // Dehradun internal
  ["ISBT Dehradun", "Clock Tower (Dehradun)"],
  ["Clock Tower (Dehradun)", "Rajpur Road (Dehradun)"]
];

const MapView = ({ trafficData, activeRoutePath, shortestPath, routeInfo, allRoutes, activeArea, isLightTheme, onViaRoute, routeEndpoints }) => {
  const [routeGeometries, setRouteGeometries] = useState([]);
  const [shortestLine, setShortestLine] = useState([]);
  const [altRouteLines, setAltRouteLines] = useState([]); // [{positions, distance, is_ai, is_shortest, path}]
  const [isLoadingGeometry, setIsLoadingGeometry] = useState(false);

  const activeStr = activeRoutePath ? activeRoutePath.join(',') : '';
  const shortestStr = shortestPath ? shortestPath.join(',') : '';
  const allRoutesStr = allRoutes ? JSON.stringify(allRoutes.map(r => r.path)) : '';

  useEffect(() => {
    const buildGeometries = async () => {
      setIsLoadingGeometry(true);
      
      try {
        if (activeArea) {
          // Area Explorer Mode: Fetch real road network for the area
          const areaEdges = await fetchAreaRoads(activeArea);
          const promises = areaEdges.map(async (edge) => {
            const positions = await fetchSimpleOSRMRoute([edge.start, edge.end]);
            return {
              destinationId: edge.end,
              positions: positions,
              density: edge.traffic
            };
          });
          const segments = await Promise.all(promises);
          setRouteGeometries(segments);
          setShortestLine([]);
        } else {
          // Normal A-to-B Routing Mode
          if (activeRoutePath && activeRoutePath.length > 1) {
            const segments = await fetchFullOSRMSegments(activeRoutePath);
            setRouteGeometries(segments);
          } else {
            setRouteGeometries([]);
          }

          if (shortestPath && shortestPath.length > 1) {
            const isSame = activeRoutePath && activeRoutePath.length === shortestPath.length && activeRoutePath.every((v, i) => v === shortestPath[i]);
            if (!isSame) {
              const sLine = await fetchSimpleOSRMRoute(shortestPath);
              setShortestLine(sLine);
            } else {
              setShortestLine([]);
            }
          } else {
            setShortestLine([]);
          }
        }
      } catch (err) {
        console.error("Error building geometries", err);
      } finally {
        setIsLoadingGeometry(false);
      }
    };

    if (activeRoutePath || shortestPath || activeArea) {
      buildGeometries();
    } else {
      setRouteGeometries([]);
      setShortestLine([]);
      setAltRouteLines([]);
    }
  }, [activeStr, shortestStr, activeArea]);

  // Separate effect for alternative routes — runs when allRoutes data arrives from backend
  useEffect(() => {
    if (!allRoutes || allRoutes.length === 0 || activeArea) {
      setAltRouteLines([]);
      return;
    }

    const fetchAltRoutes = async () => {
      // Pick at most 2 shortest non-AI routes
      const nonAiRoutes = allRoutes
        .filter(r => !r.is_ai)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2);

      if (nonAiRoutes.length === 0) {
        setAltRouteLines([]);
        return;
      }

      const altPromises = nonAiRoutes.map(async (r) => {
        const positions = await fetchSimpleOSRMRoute(r.path);
        return { positions, distance: r.distance, expected_time: r.expected_time, is_shortest: r.is_shortest, is_ai: r.is_ai, path: r.path };
      });
      const altLines = await Promise.all(altPromises);
      setAltRouteLines(altLines);
    };

    fetchAltRoutes();
  }, [allRoutes]);

  // 2. Derive colored segments instantly when trafficData changes
  const coloredSegments = useMemo(() => {
    return routeGeometries.map(seg => {
      const density = seg.density !== undefined ? seg.density : (trafficData[seg.destinationId] || 0);
      return {
        positions: seg.positions,
        color: getTrafficColor(density)
      };
    });
  }, [routeGeometries, trafficData]);

  const centerLat = 29.5;
  const centerLng = 77.5;
  
  const tileUrl = isLightTheme 
    ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="map-container" style={{ position: 'relative' }}>
      {isLoadingGeometry && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '1.1rem'
        }}>
          <div className="spinner" style={{
            width: '40px', height: '40px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid var(--accent-blue)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          Calculating actual road paths...
        </div>
      )}

      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={8} 
        style={{ height: '100%', width: '100%', background: isLightTheme ? '#f0f2f5' : '#0f172a' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <MapBoundsController activeArea={activeArea} activeRoutePath={activeRoutePath} shortestPath={shortestPath} cities={CITIES} />
        
        <TileLayer
          url={tileUrl}
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {/* Draw ALL alternative routes (faded, underneath everything) */}
        {altRouteLines.map((alt, idx) => (
          <Polyline 
            key={`alt-${idx}`} 
            positions={alt.positions} 
            color={alt.is_shortest ? '#60a5fa' : '#9ca3af'}
            weight={4} 
            opacity={0.3}
            dashArray="8, 6"
            lineCap="round"
          >
            <Tooltip sticky direction="top" offset={[0, -10]} opacity={0.95}>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#000' }}>
                {alt.is_shortest ? '📐 Shortest Path' : '🔀 Alternative Route'}
                <br/>📏 {alt.distance} km • ETA: {alt.expected_time} mins
                <br/>📍 {alt.path.length} stops
              </div>
            </Tooltip>
            <Popup className="glass-popup">
              <div style={{ color: '#000', fontWeight: 'bold', minWidth: '200px' }}>
                <div style={{ fontSize: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
                  {alt.is_shortest ? '📐 Shortest Path' : '🔀 Alternative Route'}
                </div>
                <div>📏 Distance: <span style={{ color: alt.is_shortest ? '#60a5fa' : '#9ca3af' }}>{alt.distance} km</span> • ⏱️ ETA: {alt.expected_time} mins</div>
                <div>📍 Stops: {alt.path.length}</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#555' }}>
                  {alt.path.join(' → ')}
                </div>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Draw colored AI segments or Area Roads */}
        {coloredSegments.map((segment, idx) => (
          <Polyline 
            key={`ai-${idx}`} 
            positions={segment.positions} 
            color={segment.color} 
            weight={7} 
            opacity={0.85}
            lineCap="round"
          >
            {(() => {
              const aiDist = routeInfo?.ai_distance || (allRoutes?.find(r => r.is_ai)?.distance);
              return (<>
            <Tooltip sticky direction="top" offset={[0, -10]} opacity={0.95}>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#000' }}>
                {activeArea ? '🛣️ Regional Road Segment' : '🤖 AI Optimal Route'}
                {!activeArea && aiDist && <><br/>📏 Distance: {aiDist} km • ETA: {routeInfo?.ai_time} mins</>}
                {!activeArea && activeRoutePath && <><br/>📍 {activeRoutePath.length} stops<br/>🛣️ {activeRoutePath[0]} → {activeRoutePath[activeRoutePath.length - 1]}</>}
              </div>
            </Tooltip>
            <Popup className="glass-popup">
              <div style={{ color: '#000', fontWeight: 'bold', minWidth: '200px' }}>
                <div style={{ fontSize: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
                  {activeArea ? '🛣️ Regional Road Segment' : '🤖 AI Optimal Route'}
                </div>
                {!activeArea && aiDist && <div>📏 Distance: <span style={{ color: '#22c55e' }}>{aiDist} km</span> • ⏱️ ETA: {routeInfo?.ai_time} mins</div>}
                {!activeArea && routeInfo && <div style={{ fontSize: '0.8rem', color: '#888' }}>⚡ Traffic Score: {routeInfo.ai_cost} (higher = more congestion)</div>}
                {!activeArea && activeRoutePath && (
                  <>
                    <div>📍 Stops: {activeRoutePath.length}</div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#555' }}>
                      {activeRoutePath.join(' → ')}
                    </div>
                  </>
                )}
              </div>
            </Popup>
            </>);
            })()}
          </Polyline>
        ))}
        
        {CITIES.map((node) => {
          const isOnRoute = activeRoutePath ? activeRoutePath.includes(node.id) : true;
          const isAreaMatch = activeArea ? (node.id.includes(`(${activeArea})`) || node.id.includes(activeArea) || (activeArea === "Muzaffarnagar" && node.id.includes("MZN"))) : true;
          
          // In area mode, hide pins not matching the area
          if (activeArea && !isAreaMatch) return null;
          
          // If a route is active, ONLY show the chosen route nodes (hide all other nodes completely)
          if (activeRoutePath && !isOnRoute) return null;

          const density = trafficData[node.id];
          const color = getTrafficColor(density);
          
          return (
            <React.Fragment key={node.id}>
              <Marker
                position={[node.lat, node.lng]}
                icon={createCustomIcon(color)}
              >
                <Popup className="glass-popup">
                  <div style={{ color: '#000', fontWeight: 'bold', minWidth: '180px' }}>
                    {node.id}<br/>
                    Traffic Density: <span style={{color: color}}>{density ?? 'Loading...'}%</span>
                    {isOnRoute && activeRoutePath && (
                      <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#22c55e' }}>✓ On current route</div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        background: isLightTheme ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '1rem',
        borderRadius: '8px',
        border: `1px solid ${isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
        fontSize: '0.8rem',
        color: isLightTheme ? '#1e293b' : '#fff'
      }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Map Legend</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <div style={{ width: '20px', height: '4px', background: 'linear-gradient(to right, #22c55e, #eab308, #ef4444)', borderRadius: '2px' }}></div>
          <span>AI Predicted Optimal Path</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <div style={{ width: '20px', height: '0', borderTop: '3px dashed #60a5fa' }}></div>
          <span style={{ color: isLightTheme ? '#475569' : '#94a3b8' }}>Shortest Physical Path</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '20px', height: '0', borderTop: '2px dashed #9ca3af', opacity: 0.5 }}></div>
          <span style={{ color: isLightTheme ? '#475569' : '#94a3b8' }}>Alternative Routes</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
