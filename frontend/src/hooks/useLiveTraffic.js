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
    const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8000/ws/traffic`;
    let ws;
    let reconnectTimer;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        setHasConnectedOnce(true);
        console.log('Connected to traffic stream');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          latestDataRef.current = data; // Keep the latest data in the background

          // Always update UI on the very first message so it's not empty for 5 mins
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
        console.log('Disconnected. Reconnecting in 3s...');
        reconnectTimer = setTimeout(connect, 3000);
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
