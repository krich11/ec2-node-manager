import React, { useEffect, useState } from 'react';
import { getBezierPath, useReactFlow } from 'reactflow';

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
  
  // Customize path based on handle positions
  const isSameSide = sourcePosition === targetPosition;
  
  // Calculate path based on handle positions
  const edgeParams = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.5, // Default curvature for splines
  };
  
  // Add special handling for same-side connections
  if (isSameSide) {
    // For left-left or right-right connections, create more pronounced curve
    edgeParams.curvature = 0.8;
  
    if (sourcePosition === 'left' && targetPosition === 'left') {
      // For left-to-left connections, provide offset to left
      edgeParams.centerX = Math.min(sourceX, targetX) - 80;
    } else if (sourcePosition === 'right' && targetPosition === 'right') {
      // For right-to-right connections, provide offset to right
      edgeParams.centerX = Math.max(sourceX, targetX) + 80;
    }
  }

  // Get the path using the modified parameters
  const [edgePath] = getBezierPath(edgeParams);

  // Debugging: Output the assigned endpoint coordinates and handle coordinates
  useEffect(() => {
    const sourceNode = getNode(source);
    const targetNode = getNode(target);

    if (sourceNode && targetNode) {
      const sourceHandleElement = document.querySelector(`[data-id="${source}-${sourceHandle}"]`);
      const targetHandleElement = document.querySelector(`[data-id="${target}-${targetHandle}"]`);

      if (sourceHandleElement && targetHandleElement) {
        const sourceHandleRect = sourceHandleElement.getBoundingClientRect();
        const targetHandleRect = targetHandleElement.getBoundingClientRect();

        console.log(`Edge ID: ${id}`);
        console.log(`Source Node ID: ${source}, Target Node ID: ${target}`);
        console.log(`Source Handle Coordinates: (${sourceHandleRect.x}, ${sourceHandleRect.y})`);
        console.log(`Target Handle Coordinates: (${targetHandleRect.x}, ${targetHandleRect.y})`);
        console.log(`Edge Path: ${edgePath}`);
      }
    }

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
  }, [source, target, getNode, id, sourceHandle, targetHandle]);

  return (
    <>
      {/* Include the animation styles */}
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
