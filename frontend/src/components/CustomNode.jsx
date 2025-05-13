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

export default function CustomNode({ id, data, selected, isConnectable, xPos, yPos }) {
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef(null);
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
    const rect = nodeRef.current.getBoundingClientRect();
    setContextMenuPosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    setContextMenuVisible(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenuVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={nodeRef}
      className={`${stateStyles[status]} relative rounded-lg p-1 text-xs select-none transition-shadow custom-node`}
      style={{ width: 150, height: 40 }}
      onContextMenu={handleContextMenu}
      onMouseDown={() => contextMenuVisible && setContextMenuVisible(false)}
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
          left: 0,
          width: '100%',
          height: '100%',
          background: 'transparent',
          border: 'none',
          borderRadius: '0.5rem',
          zIndex: 10, // Just under source handle
          cursor: 'grab',
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
      />

      {contextMenuVisible &&
        ReactDOM.createPortal(
          <div
            ref={contextMenuRef}
            className="absolute bg-gray-700 text-white text-xs rounded shadow-lg p-2"
            style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
          >
            <div className="cursor-pointer hover:bg-gray-600 p-1 rounded">Edit</div>
            <div className="cursor-pointer hover:bg-gray-600 p-1 rounded">Delete</div>
          </div>,
          nodeRef.current
        )}
    </div>
  );
}
