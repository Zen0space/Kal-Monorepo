import type { CreateWSSContextFnOptions } from '@trpc/server/adapters/ws';
import type { User } from 'kal-shared';
import type { Db } from 'mongodb';

import { getDB } from './db.js';

/**
 * WebSocket context for tRPC subscriptions
 * Note: WebSocket connections don't have cookies/sessions,
 * so we rely on connection params for auth
 */
export async function createWsContext(
  _opts: CreateWSSContextFnOptions
): Promise<{
  db: Db;
  user: User | null;
  userId: string | undefined;
}> {
  const db = getDB();
  
  // For now, WebSocket auth will be handled via connection params
  // The user info would be passed during the WebSocket handshake
  // For initial implementation, we'll return null user
  // TODO: Parse auth from connection params when available
  
  return {
    db,
    user: null,
    userId: undefined,
  };
}
