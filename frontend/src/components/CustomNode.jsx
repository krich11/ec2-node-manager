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

    // Common handle style (Note: This object is defined but not used in the Handle components' style prop)
    const handleStyle = {
      width: 15,
      height: 15,
      backgroundColor: '#6366f1', // Indigo color for all handles
      border: '1px solid white',
      cursor: 'crosshair',
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

    export default function CustomNode({ id, data, selected }) {
      const [contextMenuVisible, setContextMenuVisible] = useState(false);
      const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
      const contextMenuRef = useRef(null);
      const nodeRef = useRef(null);
      // Handle refs are defined but not used in the Handle components' ref prop
      const rightHandleRef = useRef(null);
      const leftHandleRef = useRef(null);
      const { getNode } = useReactFlow();
      const status = data.status || 'idle';

      const handleContextMenu = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();

        // Get node dimensions and position
        const node = getNode(id);
        if (!node) return;

        // Calculate position relative to the node
        const rect = nodeRef.current.getBoundingClientRect();

        setContextMenuPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });
        setContextMenuVisible(true);
      }, [id, getNode]);

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
        // Add event listeners for both mousedown and click
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
          } custom-node`} // <-- react-flow__node-drag-handle removed from here
          style={{ minWidth: 100, maxWidth: 160, cursor: 'grab' }}
          onContextMenu={handleContextMenu}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              {icons[status]}
              <span className="truncate font-medium node-label">{data.label}</span> {/* Added node-label class */}
            </div>
            <div className="p-1">
              <MoreHorizontal size={12} className="opacity-60 cursor-pointer" />
            </div>
          </div>

          {/* Handle on left side (source) - positioned center */}
          <Handle
            type="source"
            position={Position.Center}
            id="sourceCenterHandle"
            className="center-handle source-handle-style"
            isConnectable={true} // Allows this handle to be connected TO
            isConnectableStart={true} // Allows dragging FROM this handle (default for source)
          />

          {/* Handle on right side (target) - positioned center */}
          <Handle
            type="target"
            position={Position.Center}
            id="targetCenterHandle"
            className="center-handle target-handle-style"
            isConnectable={true} // Allows this handle to be connected TO
            isConnectableStart={false} // Prevents dragging FROM this handle
          />

          {contextMenuVisible && (
            <div
              ref={contextMenuRef}
              className="absolute bg-gray-800 text-white rounded shadow-lg z-10"
              style={{
                left: contextMenuPosition.x,
                top: contextMenuPosition.y,
                position: 'absolute'
              }}
            >
              {['Provision', 'Run', 'Reboot', 'Stop', 'Configure'].map((action) => (
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
    
