import React, { useEffect, useState, useRef } from 'react';
import { getStraightPath, useReactFlow } from 'reactflow';

const dashAnimation = `
@keyframes dashedLineAnimation {
  to {
    stroke-dashoffset: -20;
  }
}

.active-edge {
  stroke: #10B981 !important;
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
  
  // Use raw sourceX/Y (should match source handle position)
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
    //console.log(`Edge ${id}: sourceX=${sourceX}, sourceY=${sourceY}, targetX=${adjustedTargetX}, targetY=${adjustedTargetY}, rawTargetX=${targetX}, rawTargetY=${targetY}`);
    console.log(`Edge ${id}: sourceY=${sourceY}, adjustedTargetY=${adjustedTargetY}, deltaY=${adjustedTargetY - sourceY}`);
    
    const checkConnectionStatus = () => {
      const sourceNode = getNode(source);
      const targetNode = getNode(target);
      
      const bothNodesRunning = 
        sourceNode?.data?.status === 'running' && 
        targetNode?.data?.status === 'running';
      
      setIsActive(bothNodesRunning);
    };
    
    checkConnectionStatus();
    
    const interval = setInterval(checkConnectionStatus, 200);
    
    return () => clearInterval(interval);
  //}, [id, source, target, sourceX, sourceY, adjustedTargetX, adjustedTargetY, targetX, targetY, getNode]);
  }, [id, source, target, sourceX, sourceY, targetX, targetY, targetX, targetY, getNode]);

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
