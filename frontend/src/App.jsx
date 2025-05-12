import React, { useCallback, useState, useRef, useEffect } from 'react';
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

const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

const initialNodes = [
  { id: 'idle-1', type: 'custom', data: { label: 'Idle Node', status: 'idle' }, position: { x: 50, y: 100 }, style: { width: 150 } },
  { id: 'running-2', type: 'custom', data: { label: 'Running Node', status: 'running' }, position: { x: 250, y: 100 }, style: { width: 150 } },
  { id: 'warning-3', type: 'custom', data: { label: 'Warning Node', status: 'running' }, position: { x: 450, y: 100 }, style: { width: 150 } },
  { id: 'error-4', type: 'custom', data: { label: 'Error Node', status: 'error' }, position: { x: 650, y: 100 }, style: { width: 150 } },
];

// Initial edges with correct handle IDs
const initialEdges = [
  // Standard right-to-left connection
  { 
    id: 'e1-2', 
    source: 'idle-1', 
    target: 'running-2', 
    sourceHandle: 'rightHandle',
    targetHandle: 'leftHandle',
    type: 'custom',
  },
  // Left-to-left connection
  {
    id: 'e3-1',
    source: 'warning-3',
    target: 'idle-1', 
    sourceHandle: 'leftHandle',
    targetHandle: 'leftHandle',
    type: 'custom',
  }
];

const snapGrid = [15, 15];
const snapToGrid = true;

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // This trick lets us be able to connect from any handle to any handle
  // Handle can be source or target interchangeably
  const isValidConnection = useCallback((connection) => {
    // Prevent connecting a node to itself
    if (connection.source === connection.target) {
      return false;
    }
    
    // Check if this exact connection already exists
    const connectionExists = edges.some(
      edge => 
        (edge.source === connection.source && 
         edge.target === connection.target &&
         edge.sourceHandle === connection.sourceHandle &&
         edge.targetHandle === connection.targetHandle) ||
        (edge.source === connection.target && 
         edge.target === connection.source &&
         edge.sourceHandle === connection.targetHandle &&
         edge.targetHandle === connection.sourceHandle)
    );

    console.log('connectionExists:', connectionExists);
    
    if (connectionExists) {
      console.log('Connection exists, not creating connection.');
      return false;
    }
    
    // Allow all other connections
    return true;
  }, [edges]);
  
  // Handle new connections
  const onConnect = useCallback((params) => {
    console.log('Creating connection:', params);
    const newEdge = {
      ...params,
      type: 'custom',
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  // Handle node double-click to change status
  const onNodeDoubleClick = useCallback((event, node) => {
    // Update the node status
    const newStatus = ['idle', 'running', 'warning', 'error'][
      (['idle', 'running', 'warning', 'error'].indexOf(node.data.status) + 1) % 4
    ];
    
    setNodes((nds) =>
      nds.map((n) =>
        n.id === node.id ? { ...n, data: { ...n.data, status: newStatus } } : n
      )
    );
    
    // Force edge refresh by creating a shallow copy with a slight delay
    setTimeout(() => {
      setEdges((eds) => [...eds.map(e => ({...e}))]);
    }, 50);
  }, [setNodes, setEdges]);
  
  // Effect to periodically refresh edges to ensure they reflect current node states
  useEffect(() => {
    const interval = setInterval(() => {
      setEdges((eds) => [...eds.map(e => ({...e}))]);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [setEdges]);

  // Add a demo left-to-left connection
  const addLeftToLeftDemo = useCallback(() => {
    const newEdge = {
      id: `e-left-to-left-${Date.now()}`,
      source: 'idle-1',
      target: 'error-4',
      sourceHandle: 'leftHandle',
      targetHandle: 'leftHandle',
      type: 'custom',
    };
    
    setEdges((eds) => [...eds, newEdge]);
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
      snapGrid={snapGrid}
      snapToGrid={snapToGrid}
      onNodeDoubleClick={onNodeDoubleClick}
      zoomOnDoubleClick={false}
      isValidConnection={isValidConnection}
      connectionLineType={ConnectionLineType.Spline}
    >
      <MiniMap style={{ width: 100, height: 80, right: 20, bottom: 20 }} />
      <Background color="#aaa" size={1} />
      <Panel position="top-left">
        <div className="flex flex-col gap-2">
          <button 
            onClick={addLeftToLeftDemo}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Connect Idle's Left to Error's Left
          </button>
          <div className="bg-gray-800 text-white p-2 rounded">
            <p>Double-click on node to change status</p>
            <p>Connect any handle to any other handle</p>
          </div>
        </div>
      </Panel>
    </ReactFlow>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <div style={{ width: '100vw', height: '100vh' }}>
        <Flow />
      </div>
    </ReactFlowProvider>
  );
}
