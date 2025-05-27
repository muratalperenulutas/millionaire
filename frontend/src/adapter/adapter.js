const { createServer } = require('http');
const { Server } = require('socket.io');
const net = require('net');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const GAME_SERVER_HOST = process.env.GAME_SERVER_HOST || '127.0.0.1';
const GAME_SERVER_PORT = 4337;

console.log(`Using game server at ${GAME_SERVER_HOST}:${GAME_SERVER_PORT}`);

const clients = new Map();

io.on('connection', (socket) => {
  console.log('WebSocket client connected:', socket.id);
  
  const tcpClient = new net.Socket();
  
  tcpClient.connect(GAME_SERVER_PORT, GAME_SERVER_HOST, () => {
    console.log(`[${socket.id}] Connected to game server`);
  });
  
  clients.set(socket.id, tcpClient);
  
  tcpClient.on('data', (data) => {
    try {
      let message = data.toString().trim();
      console.log(`[${socket.id}] Received from game server: ${message}`);
      socket.emit('data', message);
    } catch (error) {
      console.error(`[${socket.id}] Error processing data from server:`, error);
      socket.emit('alert', 'Connection to game server lost. Please reload the page.');
    }
  });
  
  tcpClient.on('error', (err) => {
    console.error(`[${socket.id}] TCP connection error:`, err);
    socket.emit('alert', 'Connection to game server lost. Please reload the page.');
  });
  
  tcpClient.on('close', () => {
    console.log(`[${socket.id}] TCP connection closed`);
    socket.emit('alert', 'Game server connection closed. Please reload the page to reconnect.');
  });

  socket.on('data', (data) => {
    console.log(`[${socket.id}] Received data:`, data);
    const tc = clients.get(socket.id);
    
    if (tc && !tc.destroyed) {
      try {
        tc.write(`${data}`);
      } catch (error) {
        console.error(`[${socket.id}] Error processing data from server:`, error);
      }
    } else {
      socket.emit('alert', 'ERROR:Connection to game server lost. Please reload the page.');
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`[${socket.id}] WebSocket client disconnected`);
    
    const tc = clients.get(socket.id);
    
    if (tc) {
      try {
        tc.write(`DISCONNECT`);
      } catch (error) {
        console.error(`[${socket.id}] Error notifying server about disconnection:`, error);
      }
      
      tc.end();

      clients.delete(socket.id);
    }
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down WebSocket adapter...');
  
  for (const [socketId, connection] of clients.entries()) {
    try {
      connection.end();
    } catch (error) {
      console.error(`Error ending connection for ${socketId}:`, error);
    }
  }
  
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});


const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`WebSocket adapter running on port ${PORT}`);
});