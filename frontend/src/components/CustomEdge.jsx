// Import necessary libraries
import React, { useEffect, useState } from 'react';
import { getSmoothStepPath, useReactFlow } from 'reactflow';

// Define the CSS animation for the dashed line
const dashAnimation = `
@keyframes dashedLineAnimation  {
  to {
    stroke-dashoffset: -20;
  }
}

.active-edge {
  stroke: #10B981 !important; // Green color
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
  // ... rest of code...
}
