// Generate random room ID
function generateRoomId() {
    return Math.random().toString(36).substring(2, 10);
}

// Create a new call
function createCall() {
    const roomId = generateRoomId();
    const link = `${window.location.origin}/call.html?room=${roomId}`;
    document.getElementById('callLink').value = link;
    document.getElementById('copyBtn').textContent = 'Copy';
}

// Copy link to clipboard
function copyLink() {
    const link = document.getElementById('callLink').value;
    if (!link) {
        alert('First click Create New Call!');
        return;
    }
    navigator.clipboard.writeText(link);
    document.getElementById('copyBtn').textContent = 'Copied ✓';
    setTimeout(() => {
        document.getElementById('copyBtn').textContent = 'Copy';
    }, 2000);
}

// Join a call from link
function joinCall() {
    const input = document.getElementById('joinInput').value.trim();
    if (!input) {
        alert('Please paste a call link!');
        return;
    }
    // If full URL pasted
    if (input.includes('call.html')) {
        window.location.href = input;
    } else {
        // If just room ID pasted
        window.location.href = `call.html?room=${input}`;
    }
}

// Call a specific user
function callUser(name) {
    const roomId = generateRoomId();
    const link = `call.html?room=${roomId}`;
    if (confirm(`Start a video call with ${name}?`)) {
        window.location.href = link;
    }
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'login.html';
    }
}