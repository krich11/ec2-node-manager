import React from 'react';
import { MiniMap, Background } from 'reactflow';
import 'reactflow/dist/style.css';

const nodeTypes = {}; // Add your custom nodes here if any

function Flow() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  
  // Rest of the code...
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow elements={nodes} setElements={setNodes} edges={edges} setEdges={setEdges} nodeTypes={nodeTypes}>
        <MiniMap />
        <Background />
      </ReactFlow>
    </div>
  );
}
