// Import necessary libraries
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

// Define node types and edge types
const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

// Initial nodes and edges
const initialNodes = [
  // ... rest of code...
];
const initialEdges = [
  // ... rest of code...
];

// Snap grid settings
const snapGrid = [15, 15];
const snapToGrid = true;

function Flow() {
  // … rest of code...
}

export default function App() {
  return (
    // ... rest of code...
  );
}
