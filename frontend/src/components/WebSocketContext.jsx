// WebSocketContext.jsx

import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const wsRef = useRef(null);

  const ws = useMemo(() => {
    const socket = new WebSocket(`ws://${window.location.hostname}:8000/ws`);
    wsRef.current = socket;
    return socket;
  }, []);

  useEffect(() => {
    ws.onopen = () => console.log("WebSocket connected.");
    ws.onclose = () => console.warn("WebSocket closed.");
    ws.onerror = (err) => console.error("WebSocket error:", err);

    return () => {
      ws.close();
    };
  }, [ws]);

  return (
    <WebSocketContext.Provider value={wsRef}>
      {children}
    </WebSocketContext.Provider>
  );
};

