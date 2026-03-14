// Switch between Login and Signup tabs
function switchTab(tab) {
    document.querySelectorAll('.vt-tab').forEach((t, i) => {
        t.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'signup' && i === 1));
    });
    document.getElementById('login-view').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('signup-view').style.display = tab === 'signup' ? 'block' : 'none';
}

// Show message inside card
function showMsg(id, text, type) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = 'vt-msg ' + type;
}

// Login function
function doLogin() {
    const email = document.getElementById('l-email').value;
    const password = document.getElementById('l-pass').value;

    if (!email || !password) {
        showMsg('l-msg', 'Please fill in all fields', 'error');
        return;
    }
    if (!email.includes('@')) {
        showMsg('l-msg', 'Enter a valid email', 'error');
        return;
    }

    // Backend connection comes later
    showMsg('l-msg', 'Login successful! Backend coming soon 🎉', 'success');
}

// Signup function
function doSignup() {
    const name = document.getElementById('s-name').value;
    const email = document.getElementById('s-email').value;
    const password = document.getElementById('s-pass').value;

    if (!name || !email || !password) {
        showMsg('s-msg', 'Please fill in all fields', 'error');
        return;
    }
    if (password.length < 6) {
        showMsg('s-msg', 'Password must be at least 6 characters', 'error');
        return;
    }

    // Backend connection comes later
    showMsg('s-msg', 'Account created! Welcome to Vaarta 🚀', 'success');
}