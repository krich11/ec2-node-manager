import React from 'react';
import { EdgeProps } from 'reactflow';

const CustomEdge = ({ id, source, target, sourceNode, targetNode, style, data }: EdgeProps) => {
  const isRunning = (node: any) => node.data.status === 'running';

  const edgeStyle = {
    stroke: isRunning(sourceNode) && isRunning(targetNode) ? 'green' : '#3b78e7',
    strokeWidth: 2,
    strokeDasharray: isRunning(sourceNode) && isRunning(targetNode) ? '5,5' : '0',
    animation: isRunning(sourceNode) && isRunning(targetNode) ? 'dash 1.5s linear infinite' : 'none',
  };

  return (
    <path
      id={id}
      style={{ ...style, ...edgeStyle }}
      className="react-flow__edge-path"
      d={`M ${source.x},${source.y} L ${target.x},${target.y}`}
    />
  );
};

export default CustomEdge;
