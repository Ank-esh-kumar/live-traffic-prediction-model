import { useState, useEffect, useRef } from 'react';

export const useLiveTraffic = () => {
  const [trafficData, setTrafficData] = useState({});
  const [anomalies, setAnomalies] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  const latestDataRef = useRef(null);
  const isFirstMessageRef = useRef(true);

  useEffect(() => {
    // In a real project, read URL from env var
    const wsUrl = 'ws://localhost:8000/ws/traffic';
    let ws;
    let reconnectTimer;

    const connect = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
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

    // Refresh the frontend UI every 5 minutes (300,000 ms)
    const intervalId = setInterval(() => {
      if (latestDataRef.current) {
        const data = latestDataRef.current;
        if (data.nodes) setTrafficData(data.nodes);
        if (data.anomalies) setAnomalies(data.anomalies);
        if (data.predictions) setPredictions(data.predictions);
      }
    }, 5 * 60 * 1000);

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
      clearInterval(intervalId);
    };
  }, []);

  return { trafficData, anomalies, predictions, isConnected };
};
