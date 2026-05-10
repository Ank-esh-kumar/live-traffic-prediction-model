import { useState, useEffect, useRef } from 'react';

export const useLiveTraffic = () => {
  const [trafficData, setTrafficData] = useState({});
  const [anomalies, setAnomalies] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);

  const latestDataRef = useRef(null);
  const isFirstMessageRef = useRef(true);

  useEffect(() => {
    const wsBase = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8000`;
    const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
    const wsUrl = `${wsBase}/ws/traffic`;
    let ws;
    let reconnectTimer;
    let retryCount = 0;
    const MAX_RETRIES = 10;

    const connect = async () => {
      // Ping the backend first to wake it up (Render free tier sleeps)
      try {
        await fetch(`${apiBase}/`, { mode: 'cors' });
      } catch (_) { /* ignore — just a wake-up call */ }

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        setHasConnectedOnce(true);
        retryCount = 0; // Reset on successful connection
        console.log('Connected to traffic stream');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          latestDataRef.current = data;

          // Immediately render the first message for instant UI feedback
          if (isFirstMessageRef.current) {
            if (data.nodes) setTrafficData(data.nodes);
            if (data.anomalies) setAnomalies(data.anomalies);
            if (data.predictions) setPredictions(data.predictions);
            isFirstMessageRef.current = false;
          }
        } catch (e) {
          console.error("Error parsing websocket data", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (retryCount < MAX_RETRIES) {
          const delay = Math.min(3000 * Math.pow(1.5, retryCount), 30000); // 3s → 30s max
          retryCount++;
          console.log(`Disconnected. Retry ${retryCount}/${MAX_RETRIES} in ${Math.round(delay/1000)}s...`);
          reconnectTimer = setTimeout(connect, delay);
        } else {
          console.log('Max retries reached. Backend may be sleeping. Will retry on user interaction.');
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error", err);
        ws.close();
      };
    };

    connect();

    // Refresh the frontend UI every 10 seconds for a live feel
    // (WebSocket data arrives every 3s in background, but we throttle React re-renders)
    const intervalId = setInterval(() => {
      if (latestDataRef.current) {
        const data = latestDataRef.current;
        if (data.nodes) setTrafficData(data.nodes);
        if (data.anomalies) setAnomalies(data.anomalies);
        if (data.predictions) setPredictions(data.predictions);
      }
    }, 10 * 1000);

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
      clearInterval(intervalId);
    };
  }, []);

  return { trafficData, anomalies, predictions, isConnected, hasConnectedOnce };
};
