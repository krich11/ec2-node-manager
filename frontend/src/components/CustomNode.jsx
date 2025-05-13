import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { PlayCircle, PauseCircle, AlertCircle, XCircle, MoreHorizontal } from 'lucide-react';
import ReactDOM from 'react-dom';

const stateStyles = {
  idle: 'border border-gray-600 bg-gray-800 text-gray-300',
  running: 'border border-green-500 bg-green-900 text-green-200',
  warning: 'border border-yellow-500 bg-yellow-900 text-yellow-200',
  error: 'border border-red-500 bg-red-900 text-red-200',
};

const icons = {
  idle: <PauseCircle size={14} />,
  running: <PlayCircle size={14} />,
  warning: <AlertCircle size={14} />,
  error: <XCircle size={14} />,
};

const handleProvisionAction = (nodeId) => {
  console.log(`[STUB] Provision action for node ${nodeId}`);
};

const handleStartAction = (nodeId) => {
  console.log(`[STUB] Start action for node ${nodeId}`);
};

const handleRebootAction = (nodeId) => {
  console.log(`[STUB] Reboot action for node ${nodeId}`);
};

const handleStopAction = (nodeId) => {
  console.log(`[STUB] Stop action for node ${nodeId}`);
};

const handleConfigureAction = (nodeId) => {
  console.log(`[STUB] Configure action for node ${nodeId}`);
};

const actionHandlers = {
  Provision: handleProvisionAction,
  Start: handleStartAction,
  Reboot: handleRebootAction,
  Stop: handleStopAction,
  Configure: handleConfigureAction,
};

export default function CustomNode({ id, data, selected, isConnectable, xPos, yPos }) {
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef(null);
  const nodeRef = useRef(null);
  const { getNode, getViewport } = useReactFlow();
  const status = data.status || 'idle';

  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const { zoom, x: viewportX, y: viewportY } = getViewport();
    
    setContextMenuPosition({
      x: event.clientX,
      y: event.clientY
    });
    
    setContextMenuVisible(true);
  }, [getViewport]);

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
    const handleMouseMove = () => {
      if (contextMenuVisible) {
        setContextMenuVisible(false);
      }
    };

    if (contextMenuVisible) {
      window.addEventListener('dragstart', handleMouseMove);
      document.addEventListener('mousedown', handleMouseMove, { capture: true });
    }

    return () => {
      window.removeEventListener('dragstart', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseMove, { capture: true });
    };
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
      } custom-node`}
      style={{ width: 150, cursor: 'grab' }}
      onContextMenu={handleContextMenu}
      onMouseDown={() => contextMenuVisible && setContextMenuVisible(false)}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          {icons[status]}
          <span className="truncate font-medium node-label">{data.label}</span>
        </div>
        <div className="p-1">
          <MoreHorizontal size={12} className="opacity-60 cursor-pointer" />
        </div>
      </div>

      {/* Source handle centered */}
      <Handle
        type="source"
        id="sourceCenterHandle"
        className="center-handle source-handle-style"
        isConnectable={true}
        isConnectableStart={true}
        style={{ top: '50%', left: '50%' }}
      />

      {/* Target handle covering the node */}
      <Handle
        type="target"
        id="targetCenterHandle"
        className="center-handle target-handle-style"
        isConnectable={true}
        isConnectableStart={false}
        style={{ top: 0, left: 0, width: '100%', height: '100%' }}
      />

      {contextMenuVisible && ReactDOM.createPortal(
        <div
          ref={contextMenuRef}
          className="fixed bg-gray-800 text-white rounded shadow-lg z-50"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            transform: 'translate(0px, 0px)'
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
        </div>,
        document.body
      )}
    </div>
  );
}
