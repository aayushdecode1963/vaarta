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
function saveProfile() {
    const name = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();

    if (!name || !email) {
        alert('Please fill in all fields!');
        return;
    }

    // Update display
    document.getElementById('displayName').textContent = name;
    document.getElementById('displayEmail').textContent = email;

    // Update avatar letter
    document.getElementById('avatarCircle').textContent = name.charAt(0).toUpperCase();

    // Hide form
    toggleEdit();

    alert('Profile updated! ✅');
}

// Change avatar (placeholder for now)
function changeAvatar() {
    alert('Photo upload coming soon!');
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'login.html';
    }
}