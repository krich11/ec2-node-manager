import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { PlayCircle, PauseCircle, AlertCircle, XCircle, MoreHorizontal, X, Info, Server, ArrowRightCircle, NetworkIcon } from 'lucide-react';
import ReactDOM from 'react-dom';
import { useWebSocket } from './WebSocketContext';


const icons = {
  idle: <PauseCircle size={14} />,
  running: <PlayCircle size={14} />,
  warning: <AlertCircle size={14} />,
  error: <XCircle size={14} />,
};

// Global state to track active context menu
let activeContextMenuId = null;

// Create a global component for the status window
const StatusWindow = ({ data, onClose, initialPosition }) => {
  if (!data) return null;

  const [position, setPosition] = useState(initialPosition || { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const statusWindowRef = useRef(null);
  const { getEdges, getNode } = useReactFlow();

  const statusColors = {
    idle: 'bg-gray-700 text-gray-300',
    running: 'bg-green-800 text-green-200',
    warning: 'bg-yellow-800 text-yellow-200',
    error: 'bg-red-800 text-red-200',
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);

      // Calculate the offset between mouse position and window position
      const rect = statusWindowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });

      // Prevent text selection during drag
      e.preventDefault();
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      // Update position based on mouse position and original offset
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  }, [isDragging, dragOffset]);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Get connected nodes and edges data
  const edges = getEdges();
  
  // Find edges connected to this node (either as source or target)
  const connectedEdges = edges.filter(edge => 
    edge.source === data.id || edge.target === data.id
  );
  
  // Get connected node IDs and details
  const sourceConnections = connectedEdges
    .filter(edge => edge.source === data.id)
    .map(edge => {
      const targetNode = getNode(edge.target);
      return {
        nodeId: edge.target,
        nodeName: targetNode?.data?.label || 'Unknown',
        edgeId: edge.id,
        direction: 'outgoing',
      };
    });
    
  const targetConnections = connectedEdges
    .filter(edge => edge.target === data.id)
    .map(edge => {
      const sourceNode = getNode(edge.source);
      return {
        nodeId: edge.source,
        nodeName: sourceNode?.data?.label || 'Unknown',
        edgeId: edge.id,
        direction: 'incoming',
      };
    });
    
  const connections = [...sourceConnections, ...targetConnections];

  return (
    <div
      ref={statusWindowRef}
      className="fixed z-50 shadow-lg rounded-lg overflow-hidden"
      style={{
        width: '430px',
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'auto'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={`flex justify-between items-center p-3 ${statusColors[data.status]} drag-handle`}
           style={{ cursor: 'grab' }}>
        <div className="flex items-center gap-2">
          <Server size={16} />
          <span className="font-medium">{data.label}</span>
        </div>
        <button onClick={onClose} className="hover:bg-black hover:bg-opacity-20 rounded p-1">
          <X size={16} />
        </button>
      </div>
      <div className="bg-gray-800 text-white p-4">
        <h3 className="text-lg mb-2">Node Details</h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Status</span>
            <span className={`font-medium ${data.status === 'running' ? 'text-green-400' :
              data.status === 'warning' ? 'text-yellow-400' :
              data.status === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
              {data.status.toUpperCase()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">ID</span>
            <span className="font-mono text-xs">{data.id}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Last Updated</span>
            <span>{data.created}</span>
          </div>

          {/* Connected Nodes and Edges Section */}
          <div className="bg-gray-900 p-3 rounded mt-3">
            <h4 className="text-sm font-medium mb-2 text-gray-300">Connections</h4>
            
            {connections.length === 0 ? (
              <div className="text-gray-400 text-sm italic">No connections</div>
            ) : (
              <div className="space-y-3">
                {connections.map((conn, index) => (
                  <div key={conn.edgeId} className="bg-gray-800 p-2 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        {conn.direction === 'outgoing' ? (
                          <ArrowRightCircle size={12} className="text-blue-400" />
                        ) : (
                          <ArrowRightCircle size={12} className="text-green-400 transform rotate-180" />
                        )}
                        <span className="text-xs font-medium">
			  Connection to:
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">Edge ID: {conn.edgeId}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Server size={12} className="text-gray-400" />
                      <span className="text-sm">{conn.nodeName}</span>
                      <span className="text-xs text-gray-500 ml-1">({conn.nodeId.substring(0, 8)})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-400">
              {connections.length} total connection{connections.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="flex justify-end mt-3">
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white text-xs py-1 px-3 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CustomNode({ id, data, selected, isConnectable, xPos, yPos }) {
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [statusWindowVisible, setStatusWindowVisible] = useState(false);
  const [statusWindowData, setStatusWindowData] = useState(null);
  const [statusWindowPosition, setStatusWindowPosition] = useState({ x: 0, y: 0 });
  const nodeRef = useRef(null);
  const { getNode, getViewport, setNodes } = useReactFlow();
  const status = data.status || 'idle';
  const wsRef = useWebSocket();
  const ws = wsRef.current;

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

    // Close status window on Escape key
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && statusWindowVisible) {
        setStatusWindowVisible(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('closeContextMenu', handleCloseContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Listen for global status window close events
    const handleCloseAllStatusWindows = () => {
      setStatusWindowVisible(false);
    };

    document.addEventListener('closeAllStatusWindows', handleCloseAllStatusWindows);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('closeContextMenu', handleCloseContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('closeAllStatusWindows', handleCloseAllStatusWindows);
    };
  }, [contextMenuVisible, statusWindowVisible, id]);

  const handleSourceHandleMouseDown = () => {
    window.debugLog(`Source handle position: x=${xPos + 75}, y=${yPos + 20}`);
  };

  // Menu action handlers
  const handleLaunch = () => {
    window.debugLog(`Launch action triggered for node ${id} with websocket: ${ws}`);
    console.log(`Launch action triggered for node ${id} with websocket: ${ws}`);

    // Send Websocket update to backend
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        id: id,
        type: 'node_action',
        message: 'launch',
      }));
    } else {
      console.warn('WebSocket not open');
    }

    setContextMenuVisible(false);
  };

  const handleProvision = () => {
    window.debugLog(`Provision action triggered for node ${id} with websocket: ${ws}`);
    console.log(`Provision action triggered for node ${id} with websocket: ${ws}`);

    // Send Websocket update to backend
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        id: id,
        type: 'node_action',
        message: 'provision',
      }));
    } else {
      console.warn('WebSocket not open');
    }

    setContextMenuVisible(false);
  };

  const handleStart = () => {
    window.debugLog(`Start action triggered for node ${id} with websocket: ${ws}`);
    console.log(`Start action triggered for node ${id} with websocket: ${ws}`);

    // Send Websocket update to backend
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        id: id,
        type: 'node_action',
        message: 'start',
      }));
    } else {
      console.warn('WebSocket not open');
    }

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
    // Show status window on canvas
    const node = getNode(id);
    if (node) {
      // Create status window data
      const statusData = {
        id: id,
        label: data.label,
        status: status,
        position: node.position,
        created: new Date().toLocaleTimeString()
      };

      // Calculate position for status window - right side of the node
      const { x, y } = node.position;
      const { zoom, x: panX, y: panY } = getViewport();

      // Convert node position to screen coordinates
      const screenX = x * zoom + panX + 160; // 160 = node width + slight offset
      const screenY = y * zoom + panY;

      setStatusWindowPosition({ x: screenX, y: screenY });
      setStatusWindowData(statusData);
      setStatusWindowVisible(true);
    }
    setContextMenuVisible(false);
  };

  // Close the status window
  const handleCloseStatusWindow = () => {
    setStatusWindowVisible(false);
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

      {/* Context menu - rendered to the document body */}
      {contextMenuVisible && ReactDOM.createPortal(
        <div
          className="node-context-menu"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={handleLaunch}>Launch</div>
          <div className="context-menu-item" onClick={handleProvision}>Provision</div>
          <div className="context-menu-item" onClick={handleStart}>Start</div>
          <div className="context-menu-item" onClick={handleStop}>Stop</div>
          <div className="context-menu-item" onClick={handleReboot}>Reboot</div>
          <div className="context-menu-item" onClick={handleConfigure}>Configure</div>
          <div className="context-menu-item" onClick={handleStatus}>Status</div>
        </div>,
        document.body
      )}
      {statusWindowVisible && statusWindowData && ReactDOM.createPortal(
        <StatusWindow
          data={statusWindowData}
          onClose={handleCloseStatusWindow}
          initialPosition={statusWindowPosition}
        />,
        document.body
      )}
    </div>
  );
}


