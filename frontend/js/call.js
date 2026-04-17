// ===== SETUP =====
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room') || 'test-room';
document.getElementById('roomId').textContent = roomId;

const socket = io(window.BACKEND_URL);

// ===== STATE =====
let localStream = null;
let peerConnection = null;
let micOn = true;
let camOn = true;
let chatOpen = false;
let seconds = 0;
let timerInterval = null;

// WebRTC config
const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

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
        localVideo.srcObject = localStream;
        localVideo.muted = true;
        localVideo.play();

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

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        console.log('Remote stream received!');
        const remoteVideo = document.getElementById('remoteVideo');
        remoteVideo.srcObject = event.streams[0];
        remoteVideo.style.display = 'block';
        document.getElementById('waitingState').style.display = 'none';
        updateStatus('Connected', true);
        startTimer();
    };

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
socket.on('room-joined', ({ usersInRoom }) => {
    console.log('Joined room, users:', usersInRoom);
    updateStatus('Waiting for someone...', false);
});

socket.on('user-joined', async (userId) => {
    console.log('Another user joined:', userId);
    updateStatus('Connecting...', false);
    createPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', { roomId, offer });
});

socket.on('offer', async (offer) => {
    console.log('Received offer');
    createPeerConnection();
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', { roomId, answer });
});

socket.on('answer', async (answer) => {
    console.log('Received answer');
    await peerConnection.setRemoteDescription(answer);
});

socket.on('ice-candidate', async (candidate) => {
    try {
        await peerConnection.addIceCandidate(candidate);
    } catch (err) {
        console.log('ICE error:', err);
    }
});

socket.on('room-full', () => {
    alert('This call is full! Only 2 people allowed.');
    window.location.href = 'dashboard.html';
});

socket.on('user-left', () => {
    updateStatus('Other person left the call', false);
    document.getElementById('remoteVideo').style.display = 'none';
    document.getElementById('waitingState').style.display = 'flex';
    clearInterval(timerInterval);
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
});

socket.on('chat-message', ({ message, sender }) => {
    addMessage(message, 'received', sender);
});

// ===== CONTROLS =====
function toggleMic() {
    if (!localStream) return;
    micOn = !micOn;
    localStream.getAudioTracks().forEach(t => t.enabled = micOn);
    document.getElementById('micBtn').classList.toggle('off', !micOn);
    document.getElementById('micLabel').textContent = micOn ? 'Mute' : 'Unmuted';
}

function toggleCamera() {
    if (!localStream) return;
    camOn = !camOn;
    localStream.getVideoTracks().forEach(t => t.enabled = camOn);
    document.getElementById('camBtn').classList.toggle('off', !camOn);
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
    const name = window.currentUser?.displayName || 'You';
    addMessage(text, 'sent', name);
    socket.emit('chat-message', { roomId, message: text, sender: name });
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
        <div style="font-size:11px;color:#888;margin-bottom:3px;">${sender}</div>
        <div class="msg-bubble">${text}</div>
        <div class="msg-time">${time}</div>
    `;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function handleKey(e) {
    if (e.key === 'Enter') sendMessage();
}

function startTimer() {
    seconds = 0;
    timerInterval = setInterval(() => {
        seconds++;
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        document.getElementById('callTimer').textContent = `${m}:${s}`;
    }, 1000);
}

function updateStatus(text, connected) {
    const el = document.getElementById('statusText');
    if (el) el.textContent = text;
    const dot = document.querySelector('.status-dot');
    if (dot) dot.classList.toggle('connected', connected);
}

// ===== GLOBAL =====
window.toggleMic = toggleMic;
window.toggleCamera = toggleCamera;
window.endCall = endCall;
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
window.handleKey = handleKey;

// ===== INIT =====
startCamera();