import React, { useEffect, useState } from 'react';
import { getStraightPath, useReactFlow } from 'reactflow';

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
  const [edgeStatus, setEdgeStatus] = useState({
    isActive: false,
    statusClass: 'idle-edge'
  });
  
  // Get nodes for position adjustments
  const sourceNode = getNode(source);
  const targetNode = getNode(target);
  
  // Adjust target coordinates to node center (width: 150px, height: 40px)
  const adjustedSourceX = sourceNode ? sourceNode.position.x + 75 : sourceX; // Center of 150px width
  const adjustedSourceY = sourceNode ? sourceNode.position.y + 20 : sourceY; // Center of 40px height
  const adjustedTargetX = targetNode ? targetNode.position.x + 75 : targetX; // Center of 150px width
  const adjustedTargetY = targetNode ? targetNode.position.y + 20 : targetY; // Center of 40px height

  const [edgePath] = getStraightPath({
    sourceX: adjustedSourceX,
    sourceY: adjustedSourceY,
    sourcePosition,
    targetX: adjustedTargetX,
    targetY: adjustedTargetY,
    targetPosition
  });

  useEffect(() => {
    // Debug logging is now handled by the debug utility
    window.debugLog(`Edge ${id}: sourceY=${sourceY}, adjustedTargetY=${adjustedTargetY}, deltaY=${adjustedTargetY - sourceY}`);
    
    const checkConnectionStatus = () => {
      const sourceNode = getNode(source);
      const targetNode = getNode(target);

      if (!sourceNode || !targetNode) return;
      
      const sourceStatus = sourceNode.data.status;
      const targetStatus = targetNode.data.status;
      window.debugLog(`Edge ${id}: sourceStatus=${sourceStatus}, targetStatus=${targetStatus}`);
      
      // Check if both nodes are running for active animation
      const bothNodesRunning = sourceStatus === 'running' && targetStatus === 'running';
      
      // Determine edge status class based on priority: error > warning > running > idle
      let statusClass = 'idle-edge';
      
      // Error has highest priority
      if (sourceStatus === 'error' || targetStatus === 'error') {
        statusClass = 'error-edge';
      }
      // Warning has second priority
      else if (sourceStatus === 'warning' || targetStatus === 'warning') {
        statusClass = 'warning-edge';
      }
      // Running status only applies when both nodes are running
      else if (bothNodesRunning) {
        statusClass = 'active-edge';
      }
      
      setEdgeStatus({
        isActive: bothNodesRunning,
        statusClass
      });
    };
    
    checkConnectionStatus();
    
    const interval = setInterval(checkConnectionStatus, 200);
    
    return () => clearInterval(interval);
  }, [id, source, target, sourceX, sourceY, targetX, targetY, getNode]);

  return (
    <path
      id={id}
      style={{
        ...style,
        transition: 'stroke 0.3s ease'
      }}
      className={`react-flow__edge-path ${edgeStatus.statusClass} ${edgeStatus.isActive ? 'animated-edge' : ''}`}
      d={edgePath}
      markerEnd={markerEnd}
    />
  );
}
