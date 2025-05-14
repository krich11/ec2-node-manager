// WebSocketContext.jsx
import React, { createContext, useContext } from 'react';

export const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);
