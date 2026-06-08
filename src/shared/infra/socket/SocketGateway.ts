import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { TokenProvider } from '@shared/providers/TokenProvider.js';
import { conversationService } from '@modules/conversations/service/ConversationService.js';

export class SocketGateway {
  private readonly io: SocketServer;
  // Mapa para trackear usuarios conectados: userId -> socketId
  private readonly onlineUsers = new Map<string, string>();

  constructor(server: HTTPServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: '*', // Se puede configurar con variables de entorno
        methods: ['GET', 'POST'],
      },
    });

    this.initializeMiddlewares();
    this.initializeEvents();
  }

  private initializeMiddlewares(): void {
    this.io.use((socket: Socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      // Limpiar prefijo Bearer si existe
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

      try {
        const decoded = TokenProvider.verifyToken(cleanToken);
        socket.data.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
        };
        next();
      } catch (err) {
        return next(new Error('Authentication error: Invalid or expired token'));
      }
    });
  }

  private initializeEvents(): void {
    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user;
      this.onlineUsers.set(user.id, socket.id);
      
      console.log(`🔌 Socket connected: User ${user.name || user.id} (${user.role}) - Socket: ${socket.id}`);

      // Notificar presencia online
      socket.broadcast.emit('user_online', { userId: user.id });

      // Unirse a una sala de conversación específica
      socket.on('join_room', (data: { conversationId: string }) => {
        socket.join(data.conversationId);
        console.log(`💬 User ${user.id} joined room: ${data.conversationId}`);
      });

      // Envío de mensaje en tiempo real
      socket.on('send_message', async (data: { conversationId: string; content: string }) => {
        try {
          const message = await conversationService.sendMessage(
            data.conversationId,
            user.id,
            data.content
          );

          // Emitir a todos en la sala (incluyendo remitente para confirmación)
          this.io.to(data.conversationId).emit('message_received', message);
          
          console.log(`📩 Message from ${user.id} to room ${data.conversationId}`);
        } catch (err: any) {
          socket.emit('error', { message: err.message || 'Error al enviar mensaje' });
        }
      });

      // Evento de "escribiendo..."
      socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
        socket.to(data.conversationId).emit('user_typing', {
          userId: user.id,
          isTyping: data.isTyping,
        });
      });

      // Evento para notificar mensajes creados vía REST (ej. negociaciones)
      socket.on('notify_new_message', (message: any) => {
        if (message && message.conversationId) {
          socket.to(message.conversationId).emit('message_received', message);
        }
      });

      // Recibo de lectura
      socket.on('read_receipt', async (data: { conversationId: string }) => {
        try {
          await conversationService.markAsRead(data.conversationId, user.id);
          // Notificar a la sala que los mensajes fueron leídos
          socket.to(data.conversationId).emit('messages_read', {
            conversationId: data.conversationId,
            readBy: user.id,
          });
        } catch (err: any) {
          socket.emit('error', { message: err.message || 'Error al marcar lectura' });
        }
      });

      // Desconexión
      socket.on('disconnect', () => {
        this.onlineUsers.delete(user.id);
        socket.broadcast.emit('user_offline', { userId: user.id });
        console.log(`🔌 Socket disconnected: User ${user.id}`);
      });
    });
  }

  public getIO(): SocketServer {
    return this.io;
  }
}
export default SocketGateway;
