import { createServer } from 'http';
import app from './app.js';
import { SocketGateway } from '@shared/infra/socket/SocketGateway.js';
import { env } from '@config/environment.js';
import { prisma } from '@shared/database/prisma.js';

const httpServer = createServer(app);

// Inicializar la Pasarela de Websockets
const socketGateway = new SocketGateway(httpServer);

const startServer = async () => {
  try {
    // 1. Probar conexión a la base de datos
    await prisma.$connect();
    console.log('📦 Database connection verified successfully.');

    // 2. Levantar el servidor HTTP
    httpServer.listen(env.PORT, () => {
      console.log(`🚀 ==========================================`);
      console.log(`🚀 PlatJob Enterprise Backend is now running!`);
      console.log(`🚀 Environment: ${env.NODE_ENV}`);
      console.log(`🚀 Server listening on: http://localhost:${env.PORT}`);
      console.log(`🚀 WebSocket Gateway is online & listening`);
      console.log(`🚀 ==========================================`);
    });
  } catch (err) {
    console.error('❌ Failed to launch the PlatJob Backend Server:', err);
    process.exit(1);
  }
};

// Captura segura de señales del sistema para cierre limpio
const gracefulShutdown = async () => {
  console.log('Shutting down server gracefully...');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('HTTP Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();

export { httpServer, socketGateway };
