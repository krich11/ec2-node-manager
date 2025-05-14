import React, { useCallback, useState, useEffect, createContext, useContext, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Background,
  ConnectionLineType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './components/CustomNode';
import CustomEdge from './components/CustomEdge';
import { useWebSocket, WebSocketProvider } from './components/WebSocketContext';


// Initialize debug utility
// This will be attached to the window object for global access
window.debugEnabled = false;
window.debugLog = function(message) {
  if (window.debugEnabled) {
    console.log(message);
  }
};

const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

const initialNodes = [];
const initialEdges = [];

const snapGrid = [15, 15];
const snapToGrid = false;

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [debugMode, setDebugMode] = useState(false);

  // Init Websocket
  const wsRef = useWebSocket();
  const ws = wsRef?.current;

  useEffect(() => {

    if (!ws) { return }
    ws.onopen = () => { window.debugLog("WebSocket connected."); };
 
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        window.debugLog('WS message received:');
        window.debugLog(msg);

	// Handle WebSocket Messages
	switch (msg.type) {
		case "add_node":
          		setNodes((nds) => [...nds, msg.node]);
			break;
		case "update_node":
          		setNodes((nds) => nds.map((n) => n.id === msg.node.id ? { ...n, data: { ...n.data, ...msg.node.data } } : n));
			break;
		case "add_edge":
          		setEdges((eds) => [...eds, msg.edge]);
			break;
		case "remove_node:
          		setNodes((nds) => nds.filter((n) => n.id !== msg.nodeId));
          		setEdges((eds) => eds.filter((e) => e.source !== msg.nodeId && e.target !== msg.nodeId));
			break;
		case "remove_edge:
          		setEdges((eds) => eds.filter((e) => e.id !== msg.edgeId));
			break;
		default:
			console.log("Unhandled websocket message: ${msg.type}");
	}

      } catch (err) { console.error('WebSocket message parse error:', err); }
    };

    ws.onerror = (err) => { console.error("WebSocket error:", err); };

    ws.onclose = () => { console.warn("WebSocket closed"); };

    return () => { ws.close(); };

  }, [setNodes, setEdges]);


  // Toggle debug mode
  const toggleDebug = useCallback(() => {
    const newDebugMode = !debugMode;
    setDebugMode(newDebugMode);
    window.debugEnabled = newDebugMode;
    window.debugLog('Debug mode ' + (newDebugMode ? 'enabled' : 'disabled'));
  }, [debugMode]);

  const isValidConnection = useCallback((connection) => {
    if (connection.source === connection.target) {
      return false;
    }

    const connectionExists = edges.some(
      edge => (
        (edge.source === connection.source && edge.target === connection.target) ||
        (edge.source === connection.target && edge.target === connection.source)
      )
    );

    if (connectionExists) {
      return false;
    }

    return true;
  }, [edges]);

  const onConnect = useCallback((params) => {
    const newEdge = {
      ...params,
      type: 'custom',
      sourceHandle: params.sourceHandle || 'sourceCenterHandle',
      targetHandle: params.targetHandle || 'targetCenterHandle',
    };
    
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  const onNodeDoubleClick = useCallback((event, node) => {
    const newStatus = ['idle', 'running', 'warning', 'error'][
      (['idle', 'running', 'warning', 'error'].indexOf(node.data.status) + 1) % 4
    ];

    const newLabel = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

    window.debugLog(`Node ${node.id} status changed from ${node.data.status} to ${newStatus}`);

    setNodes((nds) =>
      nds.map((n) =>
        n.id === node.id ? { ...n, data: { ...n.data, status: newStatus, label: newLabel } } : n
      )
    );

    setTimeout(() => {
      setEdges((eds) => [...eds.map(e => ({...e}))]);
    }, 50);
  }, [setNodes, setEdges]);

  const addNewNode = useCallback(() => {
    const newNodeId = `node-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'custom',
      data: { label: 'New Node', status: 'idle' },
      position: {
        x: Math.random() * 500 + 50,
        y: Math.random() * 200 + 200,
      },
      style: { width: 150, height: 40 },
      isConnectable: true,
      dragHandle: '.custom-node'
    };

    window.debugLog(`Adding new node with ID ${newNodeId}`);
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEdges((eds) => [...eds.map(e => ({...e}))]);
    }, 1000);

    return () => clearInterval(interval);
  }, [setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      style={{ width: '100%', height: '100%' }}
      defaultEdgeOptions={{
        type: 'custom',
        style: { strokeWidth: 2.5 },
      }}
      onNodeDoubleClick={onNodeDoubleClick}
      zoomOnDoubleClick={false}
      isValidConnection={isValidConnection}
      connectionLineType={ConnectionLineType.Straight}
      deleteKeyCode={['Backspace', 'Delete']}
    >
      <MiniMap style={{ width: 100, height: 80, right: 20, bottom: 20 }} />
      <Background color="#aaa" size={1} />
      
      {/* Debug Mode Toggle Panel */}
      <Panel position="top-right">
        <div className="debug-panel">
          <button 
            onClick={toggleDebug} 
            className={`debug-toggle ${debugMode ? 'active' : ''}`}
          >
            Debug: {debugMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </Panel>
      
      <Panel position="top-left">
        <div className="flex flex-col gap-2">
          <button
            onClick={addNewNode}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add New Node
          </button>
          <div className="bg-gray-800 text-white p-2 rounded">
            <p>Double-click on node to change status</p>
            <p>Connect any node to any other node</p>
            <p>Right-click for context menu</p>
          </div>
        </div>
      </Panel>
    </ReactFlow>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <WebSocketProvider>
        <div style={{ width: '100vw', height: '100vh' }}>
          <Flow />
        </div>
      </WebSocketProvider>
    </ReactFlowProvider>
  );
}
