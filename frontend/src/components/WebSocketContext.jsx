import React, { 
	createContext, 
	useContext, 
	useEffect, 
	useRef,
	useNodesState,
	useEdgesState,
	addNode,
	setNodes,
} from 'react';
import {useReactFlow} from 'reactflow';

const WebSocketContext = createContext(null);
export const useWebSocket = () => useContext(WebSocketContext);
export const WebSocketProvider = ({ children }) => {

const { getNode, getViewport, setNodes } = useReactFlow();

const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws`);

    wsRef.current = ws;

    ws.onopen = () => { console.log("WebSocket connected!"); };
    ws.onerror = (err) => { console.error("WebSocket errori!:", err); };
    ws.onclose = () => { console.warn("WebSocket closed!"); };

    ws.onmessage = (event) => { 
      const msg = JSON.parse(event.data);
      console.log("WebSocket message (raw):", msg); 
              // Handle WebSocket Messages
      switch (msg.type) {
        case "set-status":
	  // Set node status to warning
	  const nodename = msg.message.charAt(0).toUpperCase() + msg.message.slice(1);
          setNodes((nds) =>
            nds.map((n) =>
              n.id === msg.id ? { ...n, data: { ...n.data, status: msg.message, label: nodename } } : n
            )
          );
          break;
        case "load-nodes":
	  console.log("Got load-nodes message");
          //setNodes((nds) => nds.map((n) => n.id === msg.node.id ? { ...n, data: { ...n.data, ...msg.node.data } } : n));
          break;
        case "load-edges":
	  console.log("Got  message");
          //setEdges((eds) => [...eds, msg.edge]);
          break;
        case "del-node":
	  console.log("Got del-node message");
          //setNodes((nds) => nds.filter((n) => n.id !== msg.nodeId));
          //setEdges((eds) => eds.filter((e) => e.source !== msg.nodeId && e.target !== msg.nodeId));
          break;
        case "del-edge":
	  console.log("Got del-edge message");
          //setEdges((eds) => eds.filter((e) => e.id !== msg.edgeId));
          break;
        default:
          console.log("Unhandled websocket message: ", msg.type);
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

