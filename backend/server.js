const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

// ===== SETUP =====
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static('../frontend'));

// ===== TRACK ROOMS =====
// rooms = { roomId: [socketId1, socketId2] }
const rooms = {};

// ===== SOCKET EVENTS =====
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // ===== JOIN ROOM =====
    socket.on('join-room', (roomId) => {
        console.log(`${socket.id} joining room: ${roomId}`);

        // Create room if doesn't exist
        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }

        // Max 2 people per room
        if (rooms[roomId].length >= 2) {
            socket.emit('room-full');
            return;
        }

        // Join the room
        rooms[roomId].push(socket.id);
        socket.join(roomId);
        socket.roomId = roomId;

        // Tell this user how many people are in room
        const usersInRoom = rooms[roomId].length;
        socket.emit('room-joined', { usersInRoom });

        // If second person joins → tell first person
        if (usersInRoom === 2) {
            socket.to(roomId).emit('user-joined', socket.id);
        }

        console.log(`Room ${roomId} now has ${usersInRoom} users`);
    });

    // ===== WEBRTC SIGNALING =====

    // Pass offer from A to B
    socket.on('offer', (data) => {
        console.log('Offer received, sending to room:', data.roomId);
        socket.to(data.roomId).emit('offer', data.offer);
    });

    // Pass answer from B to A
    socket.on('answer', (data) => {
        console.log('Answer received, sending to room:', data.roomId);
        socket.to(data.roomId).emit('answer', data.answer);
    });

    // Pass ICE candidates
    socket.on('ice-candidate', (data) => {
        socket.to(data.roomId).emit('ice-candidate', data.candidate);
    });

    // ===== CHAT MESSAGES =====
    socket.on('chat-message', (data) => {
        // Send message to OTHER person in room
        socket.to(data.roomId).emit('chat-message', {
            message: data.message,
            sender: data.sender
        });
    });

    // ===== DISCONNECT =====
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        const roomId = socket.roomId;
        if (roomId && rooms[roomId]) {
            // Remove user from room
            rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);

            // Tell other person in room
            socket.to(roomId).emit('user-left');

            // Delete room if empty
            if (rooms[roomId].length === 0) {
                delete rooms[roomId];
                console.log(`Room ${roomId} deleted`);
            }
        }
    });
});

// ===== START SERVER =====
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Vaarta server running on http://localhost:${PORT}`);
});