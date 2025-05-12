import React from 'react';
import { BaseEdge } from 'reactflow';

export default function CustomEdge({ id, sourceX, sourceY, targetX, targetY }) {
  const edgePath = `M ${sourceX},${sourceY} L ${targetX},${targetY}`;

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: 'green',
        strokeWidth: 2,
        strokeDasharray: '5,5',
        animation: 'dash 0.5s linear infinite',
      }}
    />
  );
}
