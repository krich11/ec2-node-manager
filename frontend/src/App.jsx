import React, { useCallback, useState, useEffect } from 'react';
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

const initialNodes = [];
const initialEdges = [];

const snapGrid = [15, 15];
const snapToGrid = false;

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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
      style: { width: 300, height: 80 }, // Base dimensions
      isConnectable: true,
    };

    setNodes((nds) => [...nds, newNode]);

    setTimeout(() => {
      setEdges((eds) => [...eds]);
      setNodes((nds) => [...nds]);
    }, 50);
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
      fitViewOptions={{ maxZoom: 1, minZoom: 1 }} // Force zoom to 1
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
      connectionLineType={ConnectionLineType.Straight}
      deleteKeyCode={['Backspace', 'Delete']}
    >
      <MiniMap style={{ width: 100, height: 80, right: 20, bottom: 20 }} />
      <Background color="#aaa" size={1} />
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
      <div style={{ width: '100vw', height: '100vh' }}>
        <Flow />
      </div>
    </ReactFlowProvider>
  );
}

