import React, { createContext, useContext, useEffect, useRef } from 'react';
const WebSocketContext = createContext(null);
export const useWebSocket = () => useContext(WebSocketContext);
export const WebSocketProvider = ({ children }) => {
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws`);

    wsRef.current = ws;

    ws.onopen = () => { console.log("WebSocket connected!"); };
    ws.onerror = (err) => { console.error("WebSocket error:", err); };
    ws.onclose = () => { console.warn("WebSocket closed."); };

    ws.onmessage = (event) => { 
      console.log("WebSocket message (raw):", event.data); 
              // Handle WebSocket Messages
      switch (event.data.type) {
        case "add_node":
          setNodes((nds) => [...nds, msg.node]);
          break;
        case "update_node":
          setNodes((nds) => nds.map((n) => n.id === msg.node.id ? { ...n, data: { ...n.data, ...msg.node.data } } : n));
          break;
        case "add_edge":
          setEdges((eds) => [...eds, msg.edge]);
          break;
        case "remove_node":
          setNodes((nds) => nds.filter((n) => n.id !== msg.nodeId));
          setEdges((eds) => eds.filter((e) => e.source !== msg.nodeId && e.target !== msg.nodeId));
          break;
        case "remove_edge":
          setEdges((eds) => eds.filter((e) => e.id !== msg.edgeId));
          break;
        default:
          console.log("Unhandled websocket message: ${msg.type}");
      }

    };

    return () => { ws.close(); };
  }, []); // Only run once on mount

  return (
    <WebSocketContext.Provider value={wsRef}>
      {children}
    </WebSocketContext.Provider>
  );
};

