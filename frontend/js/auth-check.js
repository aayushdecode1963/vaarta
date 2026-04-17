import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        const nameEl = document.getElementById('navUserName');
        const avatarEl = document.getElementById('navAvatar');
        if (nameEl) nameEl.textContent = user.displayName || 'User';
        if (avatarEl) avatarEl.textContent =
            (user.displayName || 'U').charAt(0).toUpperCase();
    }
});

// Make logout available globally
window.logout = async function() {
    if (confirm('Are you sure you want to logout?')) {
        await signOut(auth);
        window.location.href = 'index.html';
    }
}