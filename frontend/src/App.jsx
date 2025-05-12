import React, { useEffect, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Background,
  ConnectionLineType,
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

const initialEdges = [
  { 
    id: 'e1-2', 
    source: 'idle-1', 
    target: 'running-2', 
    sourceHandle: 'rightHandle',
    targetHandle: 'leftHandle',
    type: 'custom',
  },
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

  useEffect(() => {
    const interval = setInterval(() => {
      setEdges((eds) => [...eds.map(e => ({...e}))]);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [setEdges]);

  const isValidConnection = useCallback((connection) => {
    if (connection.source === connection.target) {
      return false;
    }
    // Prevent left to left connections
    if (connection.sourceHandle === 'leftHandle' && connection.targetHandle === 'leftHandle') {
      return false;
    }
    return true;
  }, []);

  const onConnect = useCallback((params) => {
    console.log('Creating connection:', params);
    const newEdge = {
      ...params,
      type: 'custom',
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  const onNodeDoubleClick = useCallback((event, node) => {
    const newStatus = ['idle', 'running', 'warning', 'error'][
      (['idle', 'running', 'warning', 'error'].indexOf(node.data.status) + 1) % 4
    ];
    
    setNodes((nds) =>
      nds.map((n) =>
        n.id === node.id ? { ...n, data: { ...n.data, status: newStatus } } : n
      )
    );
    
    setTimeout(() => {
      setEdges((eds) => [...eds.map(e => ({...e}))]);
    }, 50);
  }, [setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      style={{ width: '100%', height: '100%' }}
      defaultEdgeOptions={{ 
        type: 'custom',
        connectionLineType: ConnectionLineType.Spline,
      }}
      snapGrid={snapGrid}
      snapToGrid={snapToGrid}
      onNodeDoubleClick={onNodeDoubleClick}
      zoomOnDoubleClick={false}
      isValidConnection={isValidConnection}
    >
      <MiniMap style={{ width: 100, height: 80, right: 20, bottom: 20 }} />
      <Background color="#aaa" size={1} />
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
