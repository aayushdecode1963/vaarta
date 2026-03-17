import { auth } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Switch tabs
function switchTab(tab) {
    document.querySelectorAll('.vt-tab').forEach((t, i) => {
        t.classList.toggle('active',
            (tab === 'login' && i === 0) ||
            (tab === 'signup' && i === 1)
        );
    });
    document.getElementById('login-view').style.display =
        tab === 'login' ? 'block' : 'none';
    document.getElementById('signup-view').style.display =
        tab === 'signup' ? 'block' : 'none';
}

// Show message
function showMsg(id, text, type) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = 'vt-msg ' + type;
}

// ===== LOGIN =====
async function doLogin() {
    const email = document.getElementById('l-email').value;
    const password = document.getElementById('l-pass').value;

    if (!email || !password) {
        showMsg('l-msg', 'Please fill in all fields', 'error');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMsg('l-msg', 'Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } catch (err) {
        // Show friendly error messages
        if (err.code === 'auth/user-not-found') {
            showMsg('l-msg', 'No account found with this email', 'error');
        } else if (err.code === 'auth/wrong-password') {
            showMsg('l-msg', 'Wrong password!', 'error');
        } else {
            showMsg('l-msg', err.message, 'error');
        }
    }
}

// ===== SIGNUP =====
async function doSignup() {
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

    try {
        // Create account
        const userCredential = await createUserWithEmailAndPassword(
            auth, email, password
        );

        // Save name to Firebase profile
        await updateProfile(userCredential.user, {
            displayName: name
        });

        showMsg('s-msg', 'Account created! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
            showMsg('s-msg', 'Email already registered!', 'error');
        } else {
            showMsg('s-msg', err.message, 'error');
        }
    }
}

// ===== GOOGLE LOGIN =====
async function googleLogin() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        console.log('Google login success:', result.user);
        window.location.href = 'dashboard.html';
    } catch (err) {
        console.log('Google error code:', err.code);
        console.log('Google error message:', err.message);
        alert(err.code);
    }
}

// Make functions available globally
window.switchTab = switchTab;
window.doLogin = doLogin;
window.doSignup = doSignup;
window.googleLogin = googleLogin;