import React, { useEffect, useState, useRef } from 'react';
import { getStraightPath, useReactFlow, useViewport } from 'reactflow';

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
  const { zoom } = useViewport();
  const [isActive, setIsActive] = useState(false);
  
  const sourceNode = getNode(source);
  const targetNode = getNode(target);
  
  // Base node dimensions
  const baseWidth = 300;
  const baseHeight = 80;

  // Adjust coordinates to node centers in base dimensions
  const adjustedSourceX = sourceNode ? sourceNode.position.x + (baseWidth / 2) : sourceX; // 150px in base
  const adjustedSourceY = sourceNode ? sourceNode.position.y + (baseHeight / 2) : sourceY; // 40px in base
  const adjustedTargetX = targetNode ? targetNode.position.x + (baseWidth / 2) : targetX; // 150px in base
  const adjustedTargetY = targetNode ? targetNode.position.y + (baseHeight / 2) : targetY; // 40px in base

  // Apply correction for target handle Y-offset (~39px upward in rawTargetY)
  const targetYCorrection = 39 / zoom; // Adjust correction based on zoom

  const [edgePath] = getStraightPath({
    sourceX: adjustedSourceX,
    sourceY: adjustedSourceY,
    sourcePosition,
    targetX: adjustedTargetX,
    targetY: adjustedTargetY + targetYCorrection,
    targetPosition
  });

  useEffect(() => {
    console.log(`Edge ${id}: sourceX=${adjustedSourceX}, sourceY=${adjustedSourceY}, targetX=${adjustedTargetX}, targetY=${adjustedTargetY + targetYCorrection}, rawSourceX=${sourceX}, rawSourceY=${sourceY}, rawTargetX=${targetX}, rawTargetY=${targetY}, zoom=${zoom}`);
    
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
  }, [id, source, target, adjustedSourceX, adjustedSourceY, adjustedTargetX, adjustedTargetY, sourceX, sourceY, targetX, targetY, zoom, getNode]);

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
