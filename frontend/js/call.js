import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ===== SETUP =====
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room') || 'test-room';
document.getElementById('roomId').textContent = roomId;

// Connect to signaling server
const BACKEND_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://vaarta-production.up.railway.app';
const socket = io(BACKEND_URL);

// ===== STATE =====
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let micOn = true;
let camOn = true;
let chatOpen = false;
let seconds = 0;
let timerInterval = null;
let currentUser = null;

// WebRTC config — uses Google's free STUN server
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// ===== GET USER FROM FIREBASE =====
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
    } else {
        // Guest user
        currentUser = { displayName: 'Guest' };
    }
});

// ===== START CAMERA =====
async function startCamera() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: {
                echoCancellation: true,
                noiseSuppression: true
            }
        });

        const localVideo = document.getElementById('localVideo');
        
        // ✅ These 3 lines are critical
        localVideo.srcObject = localStream;
        localVideo.muted = true;        // must be muted to autoplay
        localVideo.play();              // force play

        console.log('✅ Camera started');
        socket.emit('join-room', roomId);

    } catch (err) {
        console.log('❌ Camera error:', err);
        alert('Please allow camera and microphone!');
    }
}

// ===== CREATE PEER CONNECTION =====
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(rtcConfig);

    // ✅ Add video quality
    localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
    });

    // When remote stream arrives → show it
    peerConnection.ontrack = (event) => {
        console.log('Remote stream received!');
        const remoteVideo = document.getElementById('remoteVideo');
        remoteVideo.srcObject = event.streams[0];
        remoteVideo.style.display = 'block';

        // Hide waiting screen
        document.getElementById('waitingState').style.display = 'none';

        // Update status
        updateStatus('Connected', true);
        startTimer();
    };

    // Send ICE candidates to other person
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                roomId,
                candidate: event.candidate
            });
        }
    };

    peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
    };

    return peerConnection;
}

// ===== SOCKET EVENTS =====

// Joined room successfully
socket.on('room-joined', async ({ usersInRoom }) => {
    console.log('Joined room, users:', usersInRoom);
    updateStatus('Waiting for someone...', false);
});

// Someone else joined → YOU create the offer
socket.on('user-joined', async (userId) => {
    console.log('Another user joined:', userId);
    updateStatus('Connecting...', false);

    // Create offer
    createPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit('offer', { roomId, offer });
});

// Received offer → create answer
socket.on('offer', async (offer) => {
    console.log('Received offer');
    createPeerConnection();

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit('answer', { roomId, answer });
});

// Received answer
socket.on('answer', async (answer) => {
    console.log('Received answer');
    await peerConnection.setRemoteDescription(answer);
});

// Received ICE candidate
socket.on('ice-candidate', async (candidate) => {
    try {
        await peerConnection.addIceCandidate(candidate);
    } catch (err) {
        console.log('ICE error:', err);
    }
});

// Room is full
socket.on('room-full', () => {
    alert('This call is full! Only 2 people allowed.');
    window.location.href = 'dashboard.html';
});

// Other person left
socket.on('user-left', () => {
    updateStatus('Call ended — other person left', false);
    document.getElementById('remoteVideo').style.display = 'none';
    document.getElementById('waitingState').style.display = 'flex';
    clearInterval(timerInterval);
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
});

// ===== CHAT =====
socket.on('chat-message', ({ message, sender }) => {
    addMessage(message, 'received', sender);
});

// ===== CONTROLS =====
function toggleMic() {
    if (!localStream) return;
    micOn = !micOn;
    localStream.getAudioTracks().forEach(t => t.enabled = micOn);
    const btn = document.getElementById('micBtn');
    btn.classList.toggle('off', !micOn);
    document.getElementById('micLabel').textContent = micOn ? 'Mute' : 'Unmuted';
}

function toggleCamera() {
    if (!localStream) return;
    camOn = !camOn;
    localStream.getVideoTracks().forEach(t => t.enabled = camOn);
    const btn = document.getElementById('camBtn');
    btn.classList.toggle('off', !camOn);
    document.getElementById('camLabel').textContent = camOn ? 'Camera' : 'Cam Off';
}

function endCall() {
    if (confirm('End the call?')) {
        if (localStream) localStream.getTracks().forEach(t => t.stop());
        if (peerConnection) peerConnection.close();
        clearInterval(timerInterval);
        socket.disconnect();

        const cameFromDashboard = document.referrer.includes('dashboard');
        window.location.href = cameFromDashboard ? 'dashboard.html' : 'goodbye.html';
    }
}

function toggleChat() {
    chatOpen = !chatOpen;
    document.getElementById('chatPanel').classList.toggle('hidden', !chatOpen);
    document.getElementById('chatBtn').classList.toggle('active', chatOpen);
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    // ✅ Show YOUR name on your side
    addMessage(text, 'sent', currentUser?.displayName || 'You');

    socket.emit('chat-message', {
        roomId,
        message: text,
        sender: currentUser?.displayName || 'You'
    });

    input.value = '';
}

function addMessage(text, type, sender = '') {
    const box = document.getElementById('chatMessages');
    const time = new Date().toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit'
    });
    const div = document.createElement('div');
    div.className = `msg-${type}`;
    div.innerHTML = `
        <div style="font-size:11px;color:#888;margin-bottom:3px;">
            ${sender}
        </div>
        <div class="msg-bubble">${text}</div>
        <div class="msg-time">${time}</div>
    `;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function handleKey(e) {
    if (e.key === 'Enter') sendMessage();
}

// ===== TIMER =====
function startTimer() {
    seconds = 0;
    timerInterval = setInterval(() => {
        seconds++;
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        document.getElementById('callTimer').textContent = `${m}:${s}`;
    }, 1000);
}

// ===== STATUS =====
function updateStatus(text, connected) {
    document.getElementById('statusText').textContent = text;
    const dot = document.querySelector('.status-dot');
    if (dot) dot.classList.toggle('connected', connected);
}

// ===== Make functions global =====
window.toggleMic = toggleMic;
window.toggleCamera = toggleCamera;
window.endCall = endCall;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.handleKey = handleKey;

// ===== INIT =====
startCamera();