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
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './components/CustomNode';
import CustomEdge from './components/CustomEdge';
import { useWebSocket, WebSocketProvider } from './components/WebSocketContext';

// Initialize debug utility
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
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeInfo, setShowNodeInfo] = useState(false);
  const reactFlowInstance = useReactFlow();

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

  // New handler for node selection
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setShowNodeInfo(true);
    window.debugLog(`Selected node: ${node.id}`);
  }, []);

  // Function to get connected nodes and edges for the selected node
  const getNodeConnections = useCallback((nodeId) => {
    if (!nodeId) return { connectedNodes: [], incomingEdges: [], outgoingEdges: [] };

    const outgoingEdges = edges.filter(edge => edge.source === nodeId);
    const incomingEdges = edges.filter(edge => edge.target === nodeId);
    
    // Get the connected nodes (both incoming and outgoing)
    const connectedNodeIds = new Set([
      ...outgoingEdges.map(edge => edge.target),
      ...incomingEdges.map(edge => edge.source)
    ]);
    
    const connectedNodes = nodes.filter(node => connectedNodeIds.has(node.id));
    
    return {
      connectedNodes,
      incomingEdges,
      outgoingEdges
    };
  }, [nodes, edges]);

  // Close the node info panel
  const closeNodeInfo = useCallback(() => {
    setShowNodeInfo(false);
  }, []);

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
      onNodeClick={onNodeClick}
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
            <p>Click on a node to view its connections</p>
          </div>
        </div>
      </Panel>

      {/* Node Status Information Panel */}
      {showNodeInfo && selectedNode && (
        <Panel position="bottom-right" className="node-info-panel">
          <div className="bg-white p-4 rounded shadow-lg max-w-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold">Node Information</h3>
              <button 
                onClick={closeNodeInfo}
                className="text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="font-semibold">ID: <span className="font-normal">{selectedNode.id}</span></p>
              <p className="font-semibold">Label: <span className="font-normal">{selectedNode.data.label}</span></p>
              <p className="font-semibold">Status: <span className="font-normal">{selectedNode.data.status}</span></p>
              <p className="font-semibold">Position: <span className="font-normal">x: {Math.round(selectedNode.position.x)}, y: {Math.round(selectedNode.position.y)}</span></p>
            </div>

            {(() => {
              const { connectedNodes, incomingEdges, outgoingEdges } = getNodeConnections(selectedNode.id);
              
              return (
                <>
                  <div className="mb-3">
                    <h4 className="font-bold mb-1">Connected Nodes ({connectedNodes.length})</h4>
                    {connectedNodes.length === 0 ? (
                      <p className="text-gray-500 italic">No connected nodes</p>
                    ) : (
                      <ul className="list-disc pl-5">
                        {connectedNodes.map(node => (
                          <li key={node.id} className="mb-1">
                            {node.data.label} ({node.id}) - Status: {node.data.status}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mb-3">
                    <h4 className="font-bold mb-1">Incoming Connections ({incomingEdges.length})</h4>
                    {incomingEdges.length === 0 ? (
                      <p className="text-gray-500 italic">No incoming connections</p>
                    ) : (
                      <ul className="list-disc pl-5">
                        {incomingEdges.map(edge => {
                          const sourceNode = nodes.find(n => n.id === edge.source);
                          return (
                            <li key={edge.id} className="mb-1">
                              From: {sourceNode ? sourceNode.data.label : edge.source} ({edge.id})
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold mb-1">Outgoing Connections ({outgoingEdges.length})</h4>
                    {outgoingEdges.length === 0 ? (
                      <p className="text-gray-500 italic">No outgoing connections</p>
                    ) : (
                      <ul className="list-disc pl-5">
                        {outgoingEdges.map(edge => {
                          const targetNode = nodes.find(n => n.id === edge.target);
                          return (
                            <li key={edge.id} className="mb-1">
                              To: {targetNode ? targetNode.data.label : edge.target} ({edge.id})
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </Panel>
      )}
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

