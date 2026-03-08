// Authentication functionality for Owner Portal
const API_BASE = window.location.origin;

// Check if owner is logged in
function isLoggedIn() {
    return localStorage.getItem('ownerLoggedIn') === 'true';
}

// Get logged in owner
function getLoggedInOwner() {
    const owner = localStorage.getItem('ownerEmail');
    return owner || null;
}

// Update UI based on login status
function updateAuthUI() {
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    const userName = document.querySelector('.user-name');

    if (isLoggedIn()) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        if (userName) userName.textContent = getLoggedInOwner() || 'Owner';
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// Open auth modal
function openLoginModal() {
    document.getElementById('auth-modal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('show');
    document.body.style.overflow = '';
}

function showLoginForm() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector('.auth-tab[data-tab="login"]').classList.add('active');
}

function showSignupForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector('.auth-tab[data-tab="signup"]').classList.add('active');
}

// Handle login
async function handleLogin(email, password) {
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role: 'owner' })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('ownerLoggedIn', 'true');
            localStorage.setItem('ownerEmail', email);
            closeAuthModal();
            updateAuthUI();
            return { success: true };
        } else {
            return { success: false, message: data.message };
        }
    } catch (err) {
        // Fallback for demo - allow local login
        localStorage.setItem('ownerLoggedIn', 'true');
        localStorage.setItem('ownerEmail', email);
        closeAuthModal();
        updateAuthUI();
        return { success: true };
    }
}

// Handle signup
async function handleSignup(name, email, phone, password) {
    // Submit supplier data to Formspree for record-keeping
    try {
        await fetch('https://formspree.io/f/mbdzlkek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                _subject: 'New Supplier/Owner Registration',
                name: name,
                email: email,
                phone: phone,
                role: 'supplier/owner',
                signup_date: new Date().toISOString()
            })
        });
    } catch (formspreeError) {
        console.log('Formspree submission skipped:', formspreeError);
    }
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password, role: 'owner' })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('ownerLoggedIn', 'true');
            localStorage.setItem('ownerEmail', email);
            closeAuthModal();
            updateAuthUI();
            return { success: true };
        } else {
            return { success: false, message: data.message };
        }
    } catch (err) {
        // Fallback for demo
        localStorage.setItem('ownerLoggedIn', 'true');
        localStorage.setItem('ownerEmail', email);
        closeAuthModal();
        updateAuthUI();
        return { success: true };
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('ownerLoggedIn');
    localStorage.removeItem('ownerEmail');
    updateAuthUI();
    window.location.href = 'index.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();

    // Login button click
    const loginBtn = document.querySelector('.btn-login');
    if (loginBtn) {
        loginBtn.addEventListener('click', openLoginModal);
    }

    // Signup button click
    const signupBtn = document.querySelector('.btn-signup');
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            openLoginModal();
            showSignupForm();
        });
    }

    // Logout button click
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            if (this.dataset.tab === 'login') showLoginForm();
            else showSignupForm();
        });
    });

    // Login form submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorEl = document.getElementById('login-error');

            const result = await handleLogin(email, password);
            if (!result.success) {
                errorEl.textContent = result.message || 'Login failed';
            }
        });
    }

    // Signup form submit
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const phone = document.getElementById('signup-phone')?.value || '';
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            const errorEl = document.getElementById('signup-error');

            if (password !== confirmPassword) {
                errorEl.textContent = 'Passwords do not match';
                return;
            }

            if (password.length < 6) {
                errorEl.textContent = 'Password must be at least 6 characters';
                return;
            }

            const result = await handleSignup(name, email, phone, password);
            if (!result.success) {
                errorEl.textContent = result.message || 'Signup failed';
            }
        });
    }

    // Close modal on overlay click
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            if (e.target === authModal) closeAuthModal();
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeAuthModal();
    });
});
