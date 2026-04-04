import app from './app';
import { connectToDatabase } from './config/db';
import { env } from './config/env';
import { connectRedis } from './config/redis';
import { initSocket } from './socket/socket.server';
import http from 'http';

const server =http.createServer(app)
const startServer = async (): Promise<void> => {
  try {
    await connectToDatabase();
    await connectRedis();
    initSocket(server); 
    server.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

void startServer();  
   