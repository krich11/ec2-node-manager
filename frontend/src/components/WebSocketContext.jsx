import React, { 
	createContext, 
	useContext, 
	useEffect, 
	useRef,
	useNodesState,
	useEdgesState,
	addNode
} from 'react';

const WebSocketContext = createContext(null);
export const useWebSocket = () => useContext(WebSocketContext);
export const WebSocketProvider = ({ children }) => {


//const [nodes, setNodes, onNodesChange] = useNodesState();
//const [edges, setEdges, onEdgesChange] = useEdgesState();


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
          setNodes((nds) =>
            nds.map((n) =>
              n.id === id ? { ...n, data: { ...n.data, status: 'warning', label: 'Provisioning' } } : n
            )
          );

          break;
        case "update_node":
          //setNodes((nds) => nds.map((n) => n.id === msg.node.id ? { ...n, data: { ...n.data, ...msg.node.data } } : n));
          break;
        case "add_edge":
          //setEdges((eds) => [...eds, msg.edge]);
          break;
        case "remove_node":
          //setNodes((nds) => nds.filter((n) => n.id !== msg.nodeId));
          //setEdges((eds) => eds.filter((e) => e.source !== msg.nodeId && e.target !== msg.nodeId));
          break;
        case "remove_edge":
          //setEdges((eds) => eds.filter((e) => e.id !== msg.edgeId));
          break;
        default:
          console.log("Unhandled websocket message: ", msg);
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

