import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut , updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Load real user data from Firebase
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('displayName').textContent =
            user.displayName || 'User';
        document.getElementById('displayEmail').textContent =
            user.email;
        document.getElementById('avatarCircle').textContent =
            (user.displayName || 'U').charAt(0).toUpperCase();

        // ✅ Disable email for ALL users — not just Google
        const emailInput = document.getElementById('emailInput');
        emailInput.disabled = true;
        emailInput.style.opacity = '0.4';
        emailInput.style.cursor = 'not-allowed';
        emailInput.title = 'Email cannot be changed';
    }
});

// Toggle edit form
function toggleEdit() {
    const form = document.getElementById('editForm');
    const btnRow = document.getElementById('btnRow');

    const isEditing = form.classList.contains('show');

    if (!isEditing) {
        // Fill inputs with current values
        document.getElementById('nameInput').value =
            document.getElementById('displayName').textContent.trim();
        document.getElementById('emailInput').value =
            document.getElementById('displayEmail').textContent.trim();
    }

    form.classList.toggle('show', !isEditing);
    btnRow.style.display = isEditing ? 'flex' : 'none';
}

// Save profile
async function saveProfile() {
    const name = document.getElementById('nameInput').value.trim();

    if (!name) {
        alert('Name cannot be empty!');
        return;
    }

    try {
        await updateProfile(auth.currentUser, {
            displayName: name
        });

        document.getElementById('displayName').textContent = name;
        document.getElementById('avatarCircle').textContent =
            name.charAt(0).toUpperCase();

        toggleEdit();
        alert('Name updated! ✅');

    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// Change avatar (placeholder for now)
function changeAvatar() {
    alert('Photo upload coming soon!');
}

// Logout
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        await signOut(auth);
        window.location.href = 'index.html';
    }
}

// Make functions accessible to HTML onclick
window.toggleEdit = toggleEdit;
window.saveProfile = saveProfile;
window.changeAvatar = changeAvatar;
window.logout = logout;