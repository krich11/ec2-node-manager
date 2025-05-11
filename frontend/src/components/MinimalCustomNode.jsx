// src/components/MinimalCustomNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';

export default function MinimalCustomNode({ id }) {
  return (
    <div style={{ border: '1px solid black', padding: 10 }}>
      <div>Minimal Node {id}</div>
      <Handle type="source" position={Position.Left} id="a" />
      <Handle type="target" position={Position.Right} id="b" />
    </div>
  );
}
