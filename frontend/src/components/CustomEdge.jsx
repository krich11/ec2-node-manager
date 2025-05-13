import React, { useEffect, useState, useRef } from 'react';
import { getStraightPath, useReactFlow } from 'reactflow';

// Define the CSS animation for the dashed line
const dashAnimation = `
@keyframes dashedLineAnimation {
  to {
    stroke-dashoffset: -20;
  }
}

.active-edge {
  stroke: #10B981 !important; /* Green color */
  stroke-width: 2 !important;
  stroke-dasharray: 5 !important;
}

.animated-edge {
  animation: dashedLineAnimation 1s linear infinite;
}
`;

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  source,
  target,
  sourceHandle,
  targetHandle,
  markerEnd
}) {

  const { getNode } = useReactFlow();
  const [isActive, setIsActive] = useState(false);
  
  // Calculate path based on the provided coordinates
  const edgeParams = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  };

  // Get the path using straight parameters
  const [edgePath] = getStraightPath(edgeParams);

  useEffect(() => {
    // Effect to check both nodes' status and update edge styling
    const checkConnectionStatus = () => {
      const sourceNode = getNode(source);
      const targetNode = getNode(target);
      
      // Check if both connected nodes are in "running" status
      const bothNodesRunning = 
        sourceNode?.data?.status === 'running' && 
        targetNode?.data?.status === 'running';
      
      setIsActive(bothNodesRunning);
    };
    
    // Check immediately
    checkConnectionStatus();
    
    // Set up an interval to check periodically (helpful for state updates)
    const interval = setInterval(checkConnectionStatus, 200);
    
    return () => clearInterval(interval);
  }, [source, target, getNode]);

  return (
    <>
      <style>{dashAnimation}</style>
      
      <path
        id={id}
        style={{
          ...style,
          stroke: '#888',
          strokeWidth: 2.5,
          transition: 'stroke 0.3s ease'
        }}
        className={`react-flow__edge-path ${isActive ? 'active-edge animated-edge' : ''}`}
        d={edgePath}
        markerEnd={markerEnd}
      />
    </>
  );
}
