import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';

import { appRouter } from '../routers/index.js';
import { createWsContext } from './wsContext.js';

const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10);

export function startWebSocketServer() {
  const wss = new WebSocketServer({ port: WS_PORT });
  
  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: createWsContext,
  });
  
  wss.on('connection', (ws) => {
    console.log('[WS] Client connected');
    ws.once('close', () => {
      console.log('[WS] Client disconnected');
    });
  });
  
  console.log(`📡 WebSocket server listening on ws://localhost:${WS_PORT}`);
  
  // Cleanup on shutdown
  process.on('SIGTERM', () => {
    console.log('[WS] Shutting down...');
    handler.broadcastReconnectNotification();
    wss.close();
  });
  
  return wss;
}
