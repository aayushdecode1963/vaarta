const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// ===== ALLOWED ORIGINS =====
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://vaarta-sigma.vercel.app'
];

// ===== CORS =====
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());

// ===== HEALTH CHECK =====
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'running',
        message: 'Vaarta server is live! ✅'
    });
});

app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

// ===== SOCKET.IO =====
const io = socketIO(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

// ===== ROOMS =====
const rooms = {};

io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    socket.on('join-room', (roomId) => {
        console.log(`${socket.id} joining room: ${roomId}`);

        if (!rooms[roomId]) rooms[roomId] = [];

        if (rooms[roomId].length >= 2) {
            socket.emit('room-full');
            return;
        }

        rooms[roomId].push(socket.id);
        socket.join(roomId);
        socket.roomId = roomId;

        const usersInRoom = rooms[roomId].length;
        socket.emit('room-joined', { usersInRoom });

        if (usersInRoom === 2) {
            socket.to(roomId).emit('user-joined', socket.id);
        }

        console.log(`Room ${roomId} has ${usersInRoom} users`);
    });

    socket.on('offer', (data) => {
        console.log('📤 Offer sent to room:', data.roomId);
        socket.to(data.roomId).emit('offer', data.offer);
    });

    socket.on('answer', (data) => {
        console.log('📤 Answer sent to room:', data.roomId);
        socket.to(data.roomId).emit('answer', data.answer);
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.roomId).emit('ice-candidate', data.candidate);
    });

    socket.on('chat-message', (data) => {
        socket.to(data.roomId).emit('chat-message', {
            message: data.message,
            sender: data.sender
        });
    });

    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
        const roomId = socket.roomId;
        if (roomId && rooms[roomId]) {
            rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
            socket.to(roomId).emit('user-left');
            if (rooms[roomId].length === 0) {
                delete rooms[roomId];
                console.log(`🗑️ Room ${roomId} deleted`);
            }
        }
    });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Vaarta server running on port ${PORT}`);
});

// ===== HANDLE CRASHES =====
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});