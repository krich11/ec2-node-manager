// Import necessary libraries
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { PlayCircle, PauseCircle, AlertCircle, XCircle, MoreHorizontal } from 'lucide-react';

// Define styles for different node statuses
const stateStyles = {
  idle: 'border border-gray-600 bg-gray-800 text-gray-300',
  running: 'border border-green-500 bg-green-900 text-green-200',
  warning: 'border border-yellow-500 bg-yellow-900 text-yellow-200',
  error: 'border border-red-500 bg-red-900 text-red-200',
};

// Define icons for different node statuses
const icons = {
  idle: <PauseCircle size={14} />,
  running: <PlayCircle size={14} />,
  warning: <AlertCircle size={14} />,
  error: <XCircle size={14} />,
};

// Common handle style
const handleStyle = { 
  width: 10, 
  height: 10, 
  backgroundColor: '#6366f1', // Indigo color for all handles
  border: '2px solid white',
  cursor: 'crosshair',
};

// Define actions for different node statuses
const actionHandlers = {
  Start: handleStartAction,
  Stop: handleStopAction,
  Reboot: handleRebootAction,
  Terminate: handleTerminateAction,
};

// Main component function
export default function CustomNode({ id, data, selected }) {
  // ... rest of code...
}
