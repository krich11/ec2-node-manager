import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { PlayCircle, PauseCircle, AlertCircle, XCircle, MoreHorizontal } from 'lucide-react';
import ReactDOM from 'react-dom';

const icons = {
  idle: <PauseCircle size={14} />,
  running: <PlayCircle size={14} />,
  warning: <AlertCircle size={14} />,
  error: <XCircle size={14} />,
};

// Global state to track active context menu
let activeContextMenuId = null;

export default function CustomNode({ id, data, selected, isConnectable, xPos, yPos }) {
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const nodeRef = useRef(null);
  const { getNode, getViewport, setNodes } = useReactFlow();
  const status = data.status || 'idle';

  const handlePosition = {
    top: 20, // Center (40px height / 2)
    left: 75, // Center (150px width / 2)
  };

  // Custom drag handler for target handle
  const onDragStart = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();

    const node = getNode(id);
    if (!node) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startPos = { x: node.position.x, y: node.position.y };

    const onMouseMove = (moveEvent) => {
      const { zoom } = getViewport();
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;

      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, position: { x: startPos.x + dx, y: startPos.y + dy } } : n
        )
      );
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [id, getNode, getViewport, setNodes]);

  const handleContextMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Close any existing context menu
    if (activeContextMenuId && activeContextMenuId !== id) {
      // Broadcast event to close other menus
      const closeEvent = new CustomEvent('closeContextMenu', {
        detail: { exceptId: id }
      });
      document.dispatchEvent(closeEvent);
    }
    
    activeContextMenuId = id;
    setContextMenuVisible(true);
    
    // Display the context menu directly at the cursor position
    setContextMenuPosition({
      x: event.clientX,
      y: event.clientY
    });
  };

  // Handle clicks outside the context menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close the context menu when clicking anywhere
      if (contextMenuVisible) {
        setContextMenuVisible(false);
        activeContextMenuId = null;
      }
    };
    
    const handleCloseContextMenu = (event) => {
      if (event.detail.exceptId !== id) {
        setContextMenuVisible(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('closeContextMenu', handleCloseContextMenu);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('closeContextMenu', handleCloseContextMenu);
    };
  }, [contextMenuVisible, id]);
  
  const handleSourceHandleMouseDown = () => {
    window.debugLog(`Source handle position: x=${xPos + 75}, y=${yPos + 20}`);
  };

  // Menu action handlers
  const handleProvision = () => {
    window.debugLog(`Provision action triggered for node ${id}`);
    // Implement provision logic here
    alert(`Node ${id} - Provision action triggered`);
    setContextMenuVisible(false);
  };

  const handleStart = () => {
    window.debugLog(`Start action triggered for node ${id}`);
    // Set node status to running
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, status: 'running', label: 'Running' } } : n
      )
    );
    setContextMenuVisible(false);
  };

  const handleStop = () => {
    window.debugLog(`Stop action triggered for node ${id}`);
    // Set node status to idle
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, status: 'idle', label: 'Idle' } } : n
      )
    );
    setContextMenuVisible(false);
  };

  const handleReboot = () => {
    window.debugLog(`Reboot action triggered for node ${id}`);
    // Implement reboot logic - briefly set to error then running
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, status: 'error', label: 'Rebooting' } } : n
      )
    );
    
    setTimeout(() => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, status: 'running', label: 'Running' } } : n
        )
      );
    }, 1000);
    
    setContextMenuVisible(false);
  };

  const handleConfigure = () => {
    window.debugLog(`Configure action triggered for node ${id}`);
    // Implement configuration logic here
    const newLabel = prompt("Enter new node name:", data.label);
    if (newLabel) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, label: newLabel } } : n
        )
      );
    }
    setContextMenuVisible(false);
  };

  const handleStatus = () => {
    window.debugLog(`Status action triggered for node ${id}`);
    // Show node status in an alert
    alert(`Node ${id} - Status: ${status.toUpperCase()}`);
    setContextMenuVisible(false);
  };

  return (
    <div
      ref={nodeRef}
      className={`node-${status} relative rounded-lg p-1 text-xs select-none transition-shadow custom-node`}
      style={{ width: 150, height: 40 }}
      onContextMenu={handleContextMenu}
    >
      <div className="flex justify-between items-center h-full">
        <div className="flex items-center gap-1">
          {icons[status]}
          <span className="truncate font-medium node-label">{data.label}</span>
        </div>
        <div className="p-1">
          <MoreHorizontal size={12} className="opacity-60 cursor-pointer" />
        </div>
      </div>

      {/* Target handle covering the entire node, just under source handle */}
      <Handle
        type="target"
        id="targetCenterHandle"
        className="center-handle target-handle-style"
        isConnectable={true}
        isConnectableStart={false}
        style={{
          position: 'absolute',
          top: 0,
          left: handlePosition.left,
          width: '100%',
          height: '100%',
          zIndex: 19, // Just under source handle
        }}
        onMouseDown={onDragStart} // Enable dragging
      />

      {/* Source handle centered, on top */}
      <Handle
        type="source"
        id="sourceCenterHandle"
        className="center-handle source-handle-style"
        isConnectable={true}
        isConnectableStart={true}
        style={{
          top: handlePosition.top,
          left: handlePosition.left,
          zIndex: 20, // On top of target handle
        }}
        onMouseDown={handleSourceHandleMouseDown}
      />

      {/* Context menu - now rendered to the document body */}
      {contextMenuVisible && ReactDOM.createPortal(
        <div 
          className="node-context-menu"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={handleProvision}>Provision</div>
          <div className="context-menu-item" onClick={handleStart}>Start</div>
          <div className="context-menu-item" onClick={handleStop}>Stop</div>
          <div className="context-menu-item" onClick={handleReboot}>Reboot</div>
          <div className="context-menu-item" onClick={handleConfigure}>Configure</div>
          <div className="context-menu-item" onClick={handleStatus}>Status</div>
        </div>,
        document.body
      )}
    </div>
  );
}
