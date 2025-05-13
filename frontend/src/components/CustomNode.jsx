import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { PlayCircle, PauseCircle, AlertCircle, XCircle, MoreHorizontal } from 'lucide-react';

const stateStyles = {
  idle: 'border border-gray-600 bg-gray-800 text-gray-300',
  running: 'border border-green-500 bg-green-900 text-green-200',
  warning: 'border border-yellow-500 bg-yellow-900 text-yellow-200',
  error: 'border border-red-500 bg-red-900 text-red-200',
};

const icons = {
  idle:     <PauseCircle size={14} />,
  running: <PlayCircle size={14} />,
  warning: <AlertCircle size={14} />,
  error:     <XCircle size={14} />,
};

const actionHandlers = {
  Provision: (nodeId) => console.log(`[STUB] Provision action for node ${nodeId}`),
  Start: (nodeId) => console.log(`[STUB] Start action for node ${nodeId}`),
  Reboot: (nodeId) => console.log(`[STUB] Reboot action for node ${nodeId}`),
  Stop: (nodeId) => console.log(`[STUB] Stop action for node ${nodeId}`),
  Configure: (nodeId) => console.log(`[STUB] Configure action for node ${nodeId}`),
};

export default function CustomNode({ id, data, selected }) {
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef(null);
  const nodeRef = useRef(null);
  const rightHandleRef = useRef(null);
  const leftHandleRef = useRef(null);
  const { getNode } = useReactFlow();
  const status = data.status || 'idle';

  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();

    // Get node position to calculate relative menu position
    const node = getNode(id);
    if (!node) return;

    // Calculate position for context menu relative to node
    const rect = nodeRef.current.getBoundingClientRect();
    
    // Position the menu near the node, but not too far
    setContextMenuPosition({
      x: event.clientX,
      y: event.clientY
    });
    
    setContextMenuVisible(true);
  }, [getNode, id]);

  const handleMenuItemClick = useCallback((action) => {
    actionHandlers[action](id);
    setContextMenuVisible(false);
  }, [id]);

  const handleClickOutside = useCallback((event) => {
    if (contextMenuVisible && contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
      setContextMenuVisible(false);
    }
  }, [contextMenuVisible]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div
      ref={nodeRef}
      className={`${stateStyles[status]} relative rounded-lg p-1 text-xs select-none transition-shadow ${
        selected ? 'shadow-outline-blue' : 'shadow-sm'
      } react-flow__node-draggable custom-node`}
      style={{ minWidth: 100, maxWidth: 160, cursor: 'grab' }}
      onContextMenu={handleContextMenu}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          {icons[status]}
          <span className="truncate font-medium node-label">{data.label}</span>
        </div>
        <div className="p-1 nodrag">
          <MoreHorizontal size={12} className="opacity-60 cursor-pointer" />
        </div>
      </div>

      {/* Smaller visible handle in center (primarily for source) */}
      <Handle
        type="source"
        position={Position.Center}
        id="sourceCenterHandle"
        className="center-handle source-handle-style"
        isConnectable={true}
        isConnectableStart={true}
        ref={leftHandleRef}
      />

      {/* Large invisible handle covering the node (primarily for target) */}
      <Handle
        type="target"
        position={Position.Center}
        id="targetCenterHandle"
        className="center-handle target-handle-style"
        isConnectable={true}
        isConnectableStart={false}
        ref={rightHandleRef}
        style={{
          background: 'transparent',
          border: 'none',
          width: '100%', 
          height: '100%',
          left: 0, 
          top: 0,
          transform: 'none',
          pointerEvents: 'all'
        }}
      />

      {contextMenuVisible && (
        <div
          ref={contextMenuRef}
          className="fixed bg-gray-800 text-white rounded shadow-lg z-50"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y
          }}
        >
          {['Provision', 'Start', 'Reboot', 'Stop', 'Configure'].map((action) => (
            <div
              key={action}
              onClick={() => handleMenuItemClick(action)}
              className="px-2 py-1 hover:bg-gray-700 cursor-pointer"
            >
              {action}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
