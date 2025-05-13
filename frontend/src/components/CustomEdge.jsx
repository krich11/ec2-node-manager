import React, { useEffect, useState } from 'react';
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
  markerEnd
}) {
  const { getNode } = useReactFlow();
  const [isActive, setIsActive] = useState(false);
  
  // Get source and target nodes
  const sourceNode = getNode(source);
  const targetNode = getNode(target);
  
  // Calculate the center points of the nodes for better alignment
  let adjustedSourceY = sourceY;
  let adjustedTargetY = targetY;
  
  // If we have node dimensions, adjust the Y coordinates to the node centers
  if (sourceNode) {
    const sourceNodeHeight = sourceNode.height || 0;
    adjustedSourceY = sourceY + (sourceNodeHeight / 2);
  }
  
  if (targetNode) {
    const targetNodeHeight = targetNode.height || 0;
    adjustedTargetY = targetY + (targetNodeHeight / 2);
  }
  
  // Calculate the straight path between nodes
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY: adjustedSourceY,
    sourcePosition,
    targetX,
    targetY: adjustedTargetY,
    targetPosition
  });

  useEffect(() => {
    // Check if both connected nodes are in "running" status
    const checkConnectionStatus = () => {
      const sourceNode = getNode(source);
      const targetNode = getNode(target);
      
      const bothNodesRunning = 
        sourceNode?.data?.status === 'running' && 
        targetNode?.data?.status === 'running';
      
      setIsActive(bothNodesRunning);
    };
    
    // Check immediately
    checkConnectionStatus();
    
    // Set up an interval to check periodically
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
