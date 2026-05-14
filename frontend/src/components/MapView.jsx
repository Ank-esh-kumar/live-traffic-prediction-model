import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';

const CITIES = [
  { "id": "India Gate (Delhi)", "lat": 28.6129, "lng": 77.2295 },
  { "id": "Connaught Place (Delhi)", "lat": 28.6304, "lng": 77.2177 },
  { "id": "Kashmiri Gate (Delhi)", "lat": 28.6665, "lng": 77.2289 },
  { "id": "Anand Vihar (Delhi)", "lat": 28.6469, "lng": 77.3160 },
  { "id": "Rajiv Chowk (Delhi)", "lat": 28.6328, "lng": 77.2195 },
  { "id": "Hauz Khas (Delhi)", "lat": 28.5430, "lng": 77.2062 },
  { "id": "Botanical Garden (Delhi)", "lat": 28.5640, "lng": 77.3340 },
  { "id": "Chandni Chowk (Delhi)", "lat": 28.6577, "lng": 77.2310 },
  { "id": "Karol Bagh (Delhi)", "lat": 28.6433, "lng": 77.1901 },
  { "id": "Lajpat Nagar (Delhi)", "lat": 28.5668, "lng": 77.2435 },
  { "id": "Dhaula Kuan (Delhi)", "lat": 28.5912, "lng": 77.1627 },
  { "id": "INA (Delhi)", "lat": 28.5750, "lng": 77.2085 },
  { "id": "Dwarka Sector 21 (Delhi)", "lat": 28.5521, "lng": 77.0583 },
  { "id": "Kalkaji Mandir (Delhi)", "lat": 28.5398, "lng": 77.2562 },
  { "id": "Partapur (Meerut)", "lat": 28.9186, "lng": 77.6599 },
  { "id": "Meerut Bypass", "lat": 28.9845, "lng": 77.7064 },
  { "id": "Meerut City Center", "lat": 28.9845, "lng": 77.7364 },
  { "id": "Begampul (Meerut)", "lat": 29.0064, "lng": 77.7029 },
  { "id": "Khatauli Bypass (MZN)", "lat": 29.2801, "lng": 77.7212 },
  { "id": "Mansurpur (MZN)", "lat": 29.3789, "lng": 77.7126 },
  { "id": "Muzaffarnagar Toll", "lat": 29.4727, "lng": 77.7085 },
  { "id": "Muzaffarnagar City", "lat": 29.4727, "lng": 77.7385 },
  { "id": "Roorkee Bypass", "lat": 29.8315, "lng": 77.8920 },
  { "id": "IIT Roorkee", "lat": 29.8649, "lng": 77.8966 },
  { "id": "Har Ki Pauri (Haridwar)", "lat": 29.9538, "lng": 78.1719 },
  { "id": "Shantikunj (Haridwar)", "lat": 29.9926, "lng": 78.1963 },
  { "id": "Haridwar Railway Station", "lat": 29.9472, "lng": 78.1614 },
  { "id": "Chandi Devi (Haridwar)", "lat": 29.9332, "lng": 78.1751 },
  { "id": "Triveni Ghat (Rishikesh)", "lat": 30.1030, "lng": 78.2970 },
  { "id": "Laxman Jhula (Rishikesh)", "lat": 30.1227, "lng": 78.3276 },
  { "id": "AIIMS Rishikesh", "lat": 30.0763, "lng": 78.2934 },
  { "id": "Ram Jhula (Rishikesh)", "lat": 30.1130, "lng": 78.3129 },
  { "id": "ISBT Dehradun", "lat": 30.2858, "lng": 77.9959 },
  { "id": "Clement Town (Dehradun)", "lat": 30.2650, "lng": 78.0010 },
  { "id": "Graphic Era University (Dehradun)", "lat": 30.2678, "lng": 77.9942 },
  { "id": "Niranjanpur Mandi (Dehradun)", "lat": 30.3060, "lng": 78.0040 },
  { "id": "Kargi Chowk (Dehradun)", "lat": 30.2905, "lng": 78.0195 },
  { "id": "Saharanpur Chowk (Dehradun)", "lat": 30.3150, "lng": 78.0260 },
  { "id": "Prince Chowk (Dehradun)", "lat": 30.3175, "lng": 78.0335 },
  { "id": "Clock Tower (Dehradun)", "lat": 30.3243, "lng": 78.0418 },
  { "id": "Bindal Pull (Dehradun)", "lat": 30.3275, "lng": 78.0330 },
  { "id": "Ballupur Chowk (Dehradun)", "lat": 30.3340, "lng": 78.0160 },
  { "id": "GMS Road (Dehradun)", "lat": 30.3200, "lng": 78.0050 },
  { "id": "Vasant Vihar (Dehradun)", "lat": 30.3320, "lng": 77.9950 },
  { "id": "Uttaranchal University (Dehradun)", "lat": 30.3400, "lng": 77.9540 },
  { "id": "Shivalik College (Dehradun)", "lat": 30.3359, "lng": 77.8700 },
  { "id": "Dalanwala (Dehradun)", "lat": 30.3250, "lng": 78.0550 },
  { "id": "Rispana Pull (Dehradun)", "lat": 30.3015, "lng": 78.0461 },
  { "id": "Jogiwala (Dehradun)", "lat": 30.2954, "lng": 78.0573 },
  { "id": "Raipur Stadium (Dehradun)", "lat": 30.3142, "lng": 78.0903 },
  { "id": "Rajpur Road (Dehradun)", "lat": 30.3421, "lng": 78.0558 },
  { "id": "Jakhan (Dehradun)", "lat": 30.3640, "lng": 78.0750 },
  { "id": "Sahastradhara Crossing (Dehradun)", "lat": 30.3550, "lng": 78.0710 },
  { "id": "Doon Hospital (Dehradun)", "lat": 30.3180, "lng": 78.0350 },
  { "id": "Max Super Speciality Hospital (Dehradun)", "lat": 30.3600, "lng": 78.0800 },
  { "id": "Synergy Hospital (Dehradun)", "lat": 30.3300, "lng": 77.9900 },
  { "id": "Kotwali Dehradun", "lat": 30.3165, "lng": 78.0322 },
  { "id": "Prem Nagar Police Station (Dehradun)", "lat": 30.3340, "lng": 77.9650 },
  { "id": "Rajpur Police Station (Dehradun)", "lat": 30.3750, "lng": 78.0850 },
  { "id": "Fire Station Dehradun", "lat": 30.3200, "lng": 78.0400 },
  { "id": "Mussoorie (Dehradun)", "lat": 30.4598, "lng": 78.0644 },
  { "id": "Chakrata (Dehradun)", "lat": 30.7016, "lng": 77.8696 },
  { "id": "Selaqui (Dehradun)", "lat": 30.3701, "lng": 77.8540 },
  { "id": "AIIMS New Delhi", "lat": 28.5659, "lng": 77.2089 },
  { "id": "Safdarjung Hospital (Delhi)", "lat": 28.5680, "lng": 77.2060 },
  { "id": "Apollo Hospital (Delhi)", "lat": 28.5320, "lng": 77.2880 },
  { "id": "Parliament Street Police Station (Delhi)", "lat": 28.6250, "lng": 77.2100 },
  { "id": "Hauz Khas Police Station (Delhi)", "lat": 28.5450, "lng": 77.2050 },
  { "id": "Connaught Place Police Station (Delhi)", "lat": 28.6320, "lng": 77.2180 },
  { "id": "Connaught Circus Fire Station (Delhi)", "lat": 28.6330, "lng": 77.2200 },
  { "id": "Safdarjung Fire Station (Delhi)", "lat": 28.5600, "lng": 77.2000 }
];

const MapBoundsController = ({ activeArea, activeRoutePath, shortestPath, cities, areaBoundary, setZoomLevel }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !setZoomLevel) return;
    const handleZoom = () => {
      setZoomLevel(map.getZoom());
    };
    // initial set
    handleZoom();
    map.on('zoomend', handleZoom);
    return () => map.off('zoomend', handleZoom);
  }, [map, setZoomLevel]);

  useEffect(() => {
    // If we have a boundary polygon, fit to that
    if (areaBoundary && areaBoundary.length > 2 && activeArea) {
      const bounds = L.latLngBounds(areaBoundary);
      setTimeout(() => {
        map.fitBounds(bounds, { padding: [30, 30], animate: true, maxZoom: 14 });
      }, 300);
      return;
    }

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
      setTimeout(() => {
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], animate: true, maxZoom: 13 });
        }
      }, 300);
    }
  }, [activeArea, activeRoutePath, shortestPath, map, cities, areaBoundary]);

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

const createIncidentIcon = () => {
  return L.divIcon({
    className: 'incident-pin',
    html: `
      <div style="background: white; border-radius: 50%; padding: 4px; box-shadow: 0 0 15px rgba(239, 68, 68, 0.8); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 2px solid #ef4444; animation: pulse 2s infinite;">
        <span style="font-size: 16px;">⚠️</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const fetchFullOSRMSegments = async (pathNodes, altIndex = 0) => {
  if (!pathNodes || pathNodes.length < 2) return [];
  const cities = pathNodes.map(id => CITIES.find(c => c.id === id)).filter(Boolean);
  if (cities.length < 2) return [];

  const coordsString = cities.map(c => `${c.lng},${c.lat}`).join(';');

  try {
    // Fetch alternatives=3 so we can get smooth, native alternate highways without forcing graph nodes
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=false&geometries=geojson&steps=true&alternatives=3`);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      // Pick the alternative route requested, or fallback to the first one
      const routeIdx = Math.min(altIndex, data.routes.length - 1);
      const selectedRoute = data.routes[routeIdx];
      
      if (selectedRoute.legs) {
        const segments = [];
        selectedRoute.legs.forEach((leg, i) => {
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
            positions.push([cities[i].lat, cities[i].lng], [cities[i + 1].lat, cities[i + 1].lng]);
          }
          segments.push({
            startId: pathNodes[i],
            destinationId: pathNodes[i + 1] || pathNodes[i], // The node this segment leads to
            positions
          });
        });
        return segments;
      }
    }
  } catch (err) {
    console.error("OSRM full route fetch failed", err);
  }

  // Fallback: Just return straight lines
  const fallback = [];
  for (let i = 0; i < cities.length - 1; i++) {
    fallback.push({
      startId: pathNodes[i],
      destinationId: pathNodes[i + 1],
      positions: [[cities[i].lat, cities[i].lng], [cities[i + 1].lat, cities[i + 1].lng]]
    });
  }
  return fallback;
};

  const osrmCache = new Map();

  const fetchSimpleOSRMRoute = async (pathNodes, altIndex = 0) => {
    if (!pathNodes || pathNodes.length < 2) return [];
    const cacheKey = pathNodes.join('|') + '|alt:' + altIndex;
    if (osrmCache.has(cacheKey)) return osrmCache.get(cacheKey);

    const cities = pathNodes.map(id => CITIES.find(c => c.id === id)).filter(Boolean);
    if (cities.length < 2) return [];

    const coordsString = cities.map(c => `${c.lng},${c.lat}`).join(';');
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&alternatives=3`);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const routeIdx = Math.min(altIndex, data.routes.length - 1);
        const positions = data.routes[routeIdx].geometry.coordinates.map(c => [c[1], c[0]]);
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/route/area/${encodeURIComponent(areaName)}`);
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

  const createWaypointIcon = (label, bgColor) => {
    return L.divIcon({
      className: 'waypoint-pin',
      html: `
      <div style="
        width: 28px; height: 28px; border-radius: 50%;
        background: ${bgColor}; border: 3px solid #fff;
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; font-weight: bold; color: #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      ">${label}</div>
    `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -16]
    });
  };

  const MapView = ({ trafficData, activeRoutePath, shortestPath, routeInfo, allRoutes, activeArea, isLightTheme, routeEndpoints, highGraphics, isEmergencyActive, preferredMode, selectedChoice, activeAltIndex, incidents = [] }) => {
    const [routeGeometries, setRouteGeometries] = useState([]);
    const [shortestLine, setShortestLine] = useState([]);
    const [altRouteLines, setAltRouteLines] = useState([]); // [{positions, distance, is_ai, is_shortest, path}]
    const [isLoadingGeometry, setIsLoadingGeometry] = useState(false);
    const [areaBoundary, setAreaBoundary] = useState(null); // [[lat,lng], ...]
    const [zoomLevel, setZoomLevel] = useState(8);
    const [legendOpen, setLegendOpen] = useState(true);

    const activeStr = activeRoutePath ? activeRoutePath.join(',') : '';
    const shortestStr = shortestPath ? shortestPath.join(',') : '';
    const allRoutesStr = allRoutes ? JSON.stringify(allRoutes.map(r => r.path)) : '';

    useEffect(() => {
      const buildGeometries = async () => {
        setIsLoadingGeometry(true);
        // FORCE CLEAR PREVIOUS PATHS IMMEDIATELY
        setRouteGeometries([]);
        setShortestLine([]);
        setAltRouteLines([]);
        setAreaBoundary(null);

        try {
          if (activeArea) {
            // Area Explorer Mode: Fetch boundary + road network
            const [areaEdges, boundaryData] = await Promise.all([
              fetchAreaRoads(activeArea),
              fetch(`http://localhost:8000/api/route/area/${encodeURIComponent(activeArea)}/boundary`)
                .then(r => r.json()).catch(() => ({ coordinates: [] }))
            ]);

            // Set boundary polygon
            if (boundaryData.coordinates && boundaryData.coordinates.length > 0) {
              setAreaBoundary(boundaryData.coordinates);
            } else {
              setAreaBoundary(null);
            }

            const promises = areaEdges.map(async (edge) => {
              const positions = await fetchSimpleOSRMRoute([edge.start, edge.end]);
              return {
                startId: edge.start,
                destinationId: edge.end,
                positions: positions
                // Removed static density so it reads live from trafficData
              };
            });
            const segments = await Promise.all(promises);
            setRouteGeometries(segments);
            setShortestLine([]);
          } else {
            // Normal A-to-B Routing Mode
            if (activeRoutePath && activeRoutePath.length > 1) {
              const segments = await fetchFullOSRMSegments(activeRoutePath, activeAltIndex);
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
        setAreaBoundary(null);
      }
    }, [activeStr, shortestStr, activeArea, activeAltIndex]);

    // Separate effect for alternative routes — runs when allRoutes data arrives from backend
    useEffect(() => {
      if (!allRoutes || allRoutes.length === 0 || activeArea) {
        setAltRouteLines([]);
        return;
      }

      const fetchAltRoutes = async () => {
        // We only want to show routes that are NOT currently active on the map
        const alternatives = allRoutes
          .filter(r => r.alt_index !== activeAltIndex)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 2); // Show at most 2 alternatives to keep map clean

        if (alternatives.length === 0) {
          setAltRouteLines([]);
          return;
        }

        const altPromises = alternatives.map(async (r) => {
          const positions = await fetchSimpleOSRMRoute(r.path, r.alt_index);
          return { 
            positions, 
            distance: r.distance, 
            expected_time: r.expected_time, 
            is_shortest: r.is_shortest, 
            is_ai: r.is_ai, 
            path: r.path 
          };
        });
        const altLines = await Promise.all(altPromises);
        setAltRouteLines(altLines);
      };

      fetchAltRoutes();
    }, [allRoutes, activeStr, activeArea]);

    // 2. Derive colored segments instantly when live trafficData changes
    const coloredSegments = useMemo(() => {
      return routeGeometries.map(seg => {
        let density = 0;
        if (seg.startId && seg.destinationId) {
          // Area mode: average live traffic of both edge nodes
          const startTraffic = trafficData[seg.startId] ?? 20;
          const endTraffic = trafficData[seg.destinationId] ?? 20;
          density = (startTraffic + endTraffic) / 2;
        } else {
          // Route mode: density is tied to the destination node
          density = trafficData[seg.destinationId] ?? 0;
        }
        return {
          positions: seg.positions,
          color: getTrafficColor(density)
        };
      });
    }, [routeGeometries, trafficData]);

    // 3. Apply Styles (Color & Glow) — traffic colors by default, solid overrides for eco/emergency
    const styledSegments = useMemo(() => {
      return coloredSegments.map(segment => {
        let polylineClass = '';
        let pathColor = segment.color;

        if (highGraphics && !activeArea) {
          if (isEmergencyActive) {
            // Emergency: solid RED override with fast-pulse glow
            polylineClass = 'glowing-route-emergency';
            pathColor = '#ef4444'; 
          } else {
            const currentMode = selectedChoice || (preferredMode === 'eco' ? 'eco' : 'ai');

            if (currentMode === 'eco') {
              // Eco: solid GREEN override with steady glow
              polylineClass = 'glowing-route-eco';
              pathColor = '#22c55e';
            } else {
              // AI / Shortest / Default: show TRAFFIC-BASED colors with matching glow
              pathColor = segment.color;
              if (pathColor === '#ef4444') polylineClass = 'glowing-route-red';
              else if (pathColor === '#eab308') polylineClass = 'glowing-route-yellow';
              else polylineClass = 'glowing-route-green';
            }
          }
        } else if (!highGraphics && !activeArea) {
          // Low graphics: no glow, but still apply color logic
          if (isEmergencyActive) {
            pathColor = '#ef4444';
          } else {
            const currentMode = selectedChoice || (preferredMode === 'eco' ? 'eco' : 'ai');
            if (currentMode === 'eco') {
              pathColor = '#22c55e';
            } else {
              pathColor = segment.color; // Traffic colors
            }
          }
        }

        return { ...segment, polylineClass, pathColor };
      });
    }, [coloredSegments, isEmergencyActive, selectedChoice, preferredMode, highGraphics, activeArea]);

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
          <MapBoundsController activeArea={activeArea} activeRoutePath={activeRoutePath} shortestPath={shortestPath} cities={CITIES} areaBoundary={areaBoundary} setZoomLevel={setZoomLevel} />

          <TileLayer
            url={tileUrl}
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* Area Boundary Polygon rendering removed per user request, but areaBoundary state is still used by MapBoundsController for camera framing */}

          {/* Draw Alternative routes ONLY if no specific choice has been made yet to prevent color clutter */}
          {!selectedChoice && !isEmergencyActive && altRouteLines.map((alt, idx) => (
            <Polyline
              key={`alt-${idx}`}
              positions={alt.positions}
              color={alt.is_shortest ? '#60a5fa' : '#9ca3af'}
              weight={zoomLevel <= 7 ? 1 : zoomLevel < 10 ? 2 : 3}
              opacity={0.3}
              dashArray="8, 6"
              lineCap="round"
            >
              <Tooltip sticky direction="top" offset={[0, -10]} opacity={0.95}>
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#000' }}>
                  {alt.is_shortest ? '📐 Shortest Path' : '🔀 Alternative Route'}
                  <br />📏 {alt.distance} km • ETA: {alt.expected_time} mins
                  <br />📍 {alt.path.length} stops
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
          {styledSegments.map((segment, idx) => {
            return (
              <Polyline
                key={`ai-${idx}-${segment.polylineClass}`}
                positions={segment.positions}
                color={segment.pathColor}
                weight={zoomLevel <= 7 ? 1.5 : zoomLevel <= 9 ? 2.5 : zoomLevel <= 11 ? 4 : zoomLevel <= 13 ? 5.5 : 7}
                opacity={0.85}
                lineCap="round"
                className={segment.polylineClass}
              >
              {(() => {
                const aiDist = routeInfo?.ai_distance || (allRoutes?.find(r => r.is_ai)?.distance);
                return (<>
                  <Tooltip sticky direction="top" offset={[0, -10]} opacity={0.95}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#000' }}>
                      {segment.startId ? ('🛣️ ' + segment.startId.split(' (')[0] + ' ↔ ' + segment.destinationId.split(' (')[0]) : (activeArea ? '🛣️ Regional Road Segment' : '🤖 AI Optimal Route')}
                      {!activeArea && aiDist && <><br />📏 Total Distance: {aiDist} km • ETA: {routeInfo?.ai_time} mins</>}
                      {!activeArea && activeRoutePath && <><br />📍 {activeRoutePath.length} stops<br />🛣️ {activeRoutePath[0]} → {activeRoutePath[activeRoutePath.length - 1]}</>}
                    </div>
                  </Tooltip>
                  <Popup className="glass-popup">
                    <div style={{ color: '#000', fontWeight: 'bold', minWidth: '200px' }}>
                      <div style={{ fontSize: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
                        {segment.startId ? ('🛣️ ' + segment.startId.split(' (')[0] + ' ↔ ' + segment.destinationId.split(' (')[0]) : (activeArea ? '🛣️ Regional Road Segment' : '🤖 AI Optimal Route')}
                      </div>
                      {!activeArea && aiDist && <div>📏 Total Distance: <span style={{ color: '#22c55e' }}>{aiDist} km</span> • ⏱️ ETA: {routeInfo?.ai_time} mins</div>}
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
            );
          })}

          {CITIES.map((node) => {
            // Hide ALL markers when nothing is selected
            if (!activeRoutePath && !activeArea) return null;

            const isOnRoute = activeRoutePath ? activeRoutePath.includes(node.id) : false;
            const isAreaMatch = activeArea ? (node.id.includes(`(${activeArea})`) || node.id.includes(activeArea) || (activeArea === "Muzaffarnagar" && node.id.includes("MZN"))) : false;

            // In area mode, hide pins not matching the area
            if (activeArea && !isAreaMatch) return null;

            // In route mode, ONLY show explicitly requested waypoints (start, end, user stops)
            const isEndpoint = routeEndpoints ? routeEndpoints.includes(node.id) : false;
            if (activeRoutePath && !isEndpoint) return null;

            const density = trafficData[node.id];
            const color = getTrafficColor(density);

            // Determine if this is a waypoint (start, stop, or end)
            let waypointIcon = null;
            if (routeEndpoints && Array.isArray(routeEndpoints) && routeEndpoints.length >= 2 && activeRoutePath) {
              if (node.id === routeEndpoints[0]) {
                waypointIcon = createWaypointIcon('A', '#22c55e');
              } else if (node.id === routeEndpoints[routeEndpoints.length - 1]) {
                waypointIcon = createWaypointIcon('B', '#ef4444');
              } else {
                const stopIdx = routeEndpoints.slice(1, -1).indexOf(node.id);
                if (stopIdx !== -1) {
                  waypointIcon = createWaypointIcon(stopIdx + 1, '#f59e0b');
                }
              }
            }

            return (
              <React.Fragment key={node.id}>
                <Marker
                  position={[node.lat, node.lng]}
                  icon={waypointIcon || createCustomIcon(color)}
                >
                  <Popup className="glass-popup">
                    <div style={{ color: '#000', fontWeight: 'bold', minWidth: '180px' }}>
                      {node.id}<br />
                      Traffic Density: <span style={{ color: color }}>{density ?? 'Loading...'}%</span>
                      {waypointIcon && (
                        <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: node.id === routeEndpoints[0] ? '#22c55e' : node.id === routeEndpoints[routeEndpoints.length - 1] ? '#ef4444' : '#f59e0b' }}>
                          {node.id === routeEndpoints[0] ? '🟢 Start Point' : node.id === routeEndpoints[routeEndpoints.length - 1] ? '🔴 Destination' : '🟡 Waypoint Stop'}
                        </div>
                      )}
                      {isOnRoute && activeRoutePath && !waypointIcon && (
                        <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#22c55e' }}>✓ On current route</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

          {/* Render Incidents */}
          {incidents && incidents.length > 0 && incidents.map((incident) => {
            const city = CITIES.find(c => c.id === incident.node_id);
            if (!city) return null;
            
            return (
              <Marker
                key={incident._id || incident.timestamp}
                position={[city.lat, city.lng]}
                icon={createIncidentIcon()}
              >
                <Popup className="glass-popup">
                  <div style={{ color: '#000', minWidth: '200px' }}>
                    <div style={{ fontWeight: 'bold', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      ⚠️ {incident.type}
                    </div>
                    <div style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                      Location: <strong>{incident.node_id}</strong>
                    </div>
                    {incident.description && (
                      <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#4b5563', marginBottom: '8px' }}>
                        "{incident.description}"
                      </div>
                    )}
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                      Reported: {new Date(incident.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </Popup>
              </Marker>
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
          padding: legendOpen ? '1rem' : '0.5rem 0.75rem',
          borderRadius: '8px',
          border: `1px solid ${isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
          fontSize: '0.8rem',
          color: isLightTheme ? '#1e293b' : '#fff',
          transition: 'all 0.25s ease',
          cursor: 'default',
          minWidth: legendOpen ? '160px' : 'auto'
        }}>
          <div 
            onClick={() => setLegendOpen(prev => !prev)} 
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none',
              marginBottom: legendOpen ? '0.5rem' : 0
            }}
          >
            <span>Map Legend</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.6, transition: 'transform 0.25s', transform: legendOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
          </div>
          {legendOpen && (
            <>
          {activeArea ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <div style={{ width: '20px', height: '4px', background: 'linear-gradient(to right, #22c55e, #eab308, #ef4444)', borderRadius: '2px' }}></div>
                <span>Traffic Colored Roads</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></div>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#eab308' }}></div>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></div>
                </div>
                <span style={{ color: isLightTheme ? '#475569' : '#94a3b8', fontSize: '0.75rem' }}>Low • Med • High</span>
              </div>
            </>
          ) : (() => {
            const currentMode = isEmergencyActive ? 'emergency' : (selectedChoice || (preferredMode === 'eco' ? 'eco' : 'ai'));
            return (
              <>
                {currentMode === 'emergency' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: '20px', height: '4px', background: '#ef4444', borderRadius: '2px', boxShadow: '0 0 10px #ef4444' }}></div>
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🚨 EMERGENCY CLEAR PATH</span>
                  </div>
                ) : currentMode === 'eco' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: '20px', height: '4px', background: '#22c55e', borderRadius: '2px', boxShadow: '0 0 10px #22c55e' }}></div>
                    <span style={{ color: '#22c55e', fontWeight: 'bold' }}>🌿 Eco-Friendly Route</span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <div style={{ width: '20px', height: '4px', background: 'linear-gradient(to right, #22c55e, #eab308, #ef4444)', borderRadius: '2px' }}></div>
                      <span style={{ fontWeight: 'bold' }}>🤖 AI Route (Traffic Colored)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></div>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#eab308' }}></div>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></div>
                      </div>
                      <span style={{ color: isLightTheme ? '#475569' : '#94a3b8', fontSize: '0.75rem' }}>Low • Med • High Traffic</span>
                    </div>
                  </>
                )}
                {!isEmergencyActive && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <div style={{ width: '20px', height: '0', borderTop: '3px dashed #60a5fa', opacity: 0.4 }}></div>
                      <span style={{ color: isLightTheme ? '#475569' : '#94a3b8' }}>Shortest Path Ref.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '20px', height: '0', borderTop: '2px dashed #9ca3af', opacity: 0.5 }}></div>
                      <span style={{ color: isLightTheme ? '#475569' : '#94a3b8' }}>Alternative Routes</span>
                    </div>
                  </>
                )}
              </>
            );
          })()}
            </>
          )}
        </div>
      </div>
    );
  };
  export default MapView;