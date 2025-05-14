import React, { createContext, useContext, useEffect, useRef } from 'react';
const WebSocketContext = createContext(null);
export const useWebSocket = () => useContext(WebSocketContext);
export const WebSocketProvider = ({ children }) => {
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws`);

    wsRef.current = ws;

    ws.onopen = () => { console.log("WebSocket connected."); };
    ws.onmessage = (event) => { console.log("WebSocket message (raw):", event.data); };
    ws.onerror = (err) => { console.error("WebSocket error:", err); };
    ws.onclose = () => { console.warn("WebSocket closed."); };

    return () => { ws.close(); };
  }, []); // Only run once on mount

  return (
    <WebSocketContext.Provider value={wsRef}>
      {children}
    </WebSocketContext.Provider>
  );
};

