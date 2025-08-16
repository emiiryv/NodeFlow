import logger from './utils/logger';

import { WebSocketServer } from 'ws';
import type WebSocket from 'ws';
import type { Server } from 'https';

interface Client {
  id: string;
  socket: WebSocket;
}

const clients = new Map<string, WebSocket>();

export const wss = new WebSocketServer({ noServer: true });

export const setupWebSocket = (server: Server) => {

  wss.on('connection', (ws) => {
    let clientId: string | null = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        const { type, payload, target } = data;

        if (type === 'join') {
          if (typeof payload.id === 'string') {
            clientId = payload.id;
            if (typeof clientId === 'string') {
              clients.set(clientId, ws);
              logger.info(`[WS] Client joined: ${clientId}`);
            }
          } else {
            logger.warn('[WS] Join message received without valid client ID');
          }
        }
        else if (type === 'offer' || type === 'answer' || type === 'ice-candidate') {
          if (target && clients.has(target)) {
            const targetSocket = clients.get(target);
            targetSocket?.send(JSON.stringify({ type, payload, from: clientId }));
            logger.info(`[WS] Relayed ${type} from ${clientId} to ${target}`);
          } else {
            logger.warn(`[WS] Target ${target} not found for message type: ${type}`);
          }
        }
      } catch (err) {
        logger.error({ msg: '[WS] Message handling error:', error: err instanceof Error ? err.message : String(err) });
      }
    });

    ws.on('close', () => {
      if (clientId && clients.has(clientId)) {
        clients.delete(clientId);
        logger.info(`[WS] Client disconnected: ${clientId}`);
      }
    });
  });

  logger.info('[WS] WebSocket server is running.');
};