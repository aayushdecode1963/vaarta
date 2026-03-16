const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room') || 'demo';
document.getElementById('roomId').textContent = roomId;

let micOn = true;
let camOn = true;
let chatOpen = true;
let localStream = null;
let seconds = 0;
let timerInterval = null;

// Start camera
async function startCamera() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true, audio: true
        });
        document.getElementById('localVideo').srcObject = localStream;
    } catch (err) {
        console.log('Camera error:', err);
    }
}

// Timer
function startTimer() {
    timerInterval = setInterval(() => {
        seconds++;
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        document.getElementById('callTimer').textContent = `${m}:${s}`;
    }, 1000);
}

// Toggle mic
function toggleMic() {
    if (!localStream) return;
    micOn = !micOn;
    localStream.getAudioTracks().forEach(t => t.enabled = micOn);
    const btn = document.getElementById('micBtn');
    btn.classList.toggle('off', !micOn);
    document.getElementById('micLabel').textContent = micOn ? 'Mute' : 'Unmuted';
}

// Toggle camera
function toggleCamera() {
    if (!localStream) return;
    camOn = !camOn;
    localStream.getVideoTracks().forEach(t => t.enabled = camOn);
    const btn = document.getElementById('camBtn');
    btn.classList.toggle('off', !camOn);
    document.getElementById('camLabel').textContent = camOn ? 'Camera' : 'Cam Off';
}

// End call
function endCall() {
    if (confirm('End the call?')) {
        if (localStream) localStream.getTracks().forEach(t => t.stop());
        clearInterval(timerInterval);

        // Check if user came from a shared link (guest)
        const cameFromLink = document.referrer === '' || 
                             !document.referrer.includes('dashboard');

        if (cameFromLink) {
            // Guest → show simple goodbye page
            window.location.href = 'goodbye.html';
        } else {
            // Logged in user → back to dashboard
            window.location.href = 'dashboard.html';
        }
    }
}

// Toggle chat panel
function toggleChat() {
    chatOpen = !chatOpen;
    document.getElementById('chatPanel').classList.toggle('hidden', !chatOpen);
    document.getElementById('chatBtn').classList.toggle('active', chatOpen);
}

// Send message
function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'sent');
    input.value = '';
}

// Add message bubble
function addMessage(text, type) {
    const box = document.getElementById('chatMessages');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = `msg-${type}`;
    div.innerHTML = `<div class="msg-bubble">${text}</div><div class="msg-time">${time}</div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// Enter key to send
function handleKey(e) {
    if (e.key === 'Enter') sendMessage();
}

// Init
startCamera();
startTimer();