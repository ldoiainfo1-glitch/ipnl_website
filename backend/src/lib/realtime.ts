import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { getSupabaseAdmin } from './supabaseServer';

let io: Server | null = null;

export function initRealtime(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== 'string') return next(new Error('Missing auth token'));

    const supabase = getSupabaseAdmin();
    if (!supabase) return next(new Error('Supabase not configured'));

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return next(new Error('Invalid auth token'));

    socket.data.userId = data.user.id;
    return next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(userRoom(userId));

    socket.on('join', (room: string) => {
      if (room === userRoom(userId)) socket.join(room);
    });
  });

  return io;
}

export function emitToUsers(userIds: string[], event: string, payload: unknown) {
  if (!io) return;

  for (const userId of userIds) {
    io.to(userRoom(userId)).emit(event, payload);
  }
}

function userRoom(userId: string) {
  return `user:${userId}`;
}