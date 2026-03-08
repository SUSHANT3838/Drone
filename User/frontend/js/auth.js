// Authentication Module
const API_BASE = 'http://localhost:3000';

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('user_email') && localStorage.getItem('user_logged_in') === 'true';
}

// Get current user
function getCurrentUser() {
    return {
        email: localStorage.getItem('user_email'),
        name: localStorage.getItem('user_name') || 'User'
    };
}

// Update UI based on auth state
function updateAuthUI() {
    const loginBtn = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');
    const userMenu = document.querySelector('.user-menu');
    
    if (isLoggedIn()) {
        const user = getCurrentUser();
        
        // Hide login/signup buttons
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        
        // Show user menu if exists
        if (userMenu) {
            userMenu.style.display = 'flex';
            const userName = userMenu.querySelector('.user-name');
            if (userName) userName.textContent = user.name || user.email.split('@')[0];
        }
    } else {
        // Show login/signup buttons
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (signupBtn) signupBtn.style.display = 'inline-block';
        
        // Hide user menu
        if (userMenu) userMenu.style.display = 'none';
    }
}

// Open Login Modal
function openLoginModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        showLoginForm();
    }
}

// Open Signup Modal
function openSignupModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        showSignupForm();
    }
}

// Close Auth Modal
function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        clearAuthForms();
    }
}

// Show Login Form
function showLoginForm() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === 'login');
    });
}

// Show Signup Form
function showSignupForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === 'signup');
    });
}

// Clear forms
function clearAuthForms() {
    document.querySelectorAll('#auth-modal input').forEach(input => input.value = '');
    document.querySelectorAll('#auth-modal .auth-error').forEach(err => err.textContent = '');
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Validation
    if (!email || !password) {
        errorEl.textContent = 'Please fill in all fields';
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    
    // Check local users first (includes Formspree-registered users)
    const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
    const user = localUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Log login to Formspree for tracking
        try {
            await fetch('https://formspree.io/f/mwvrpbgr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _subject: 'User Login',
                    email: email,
                    name: user.name,
                    login_date: new Date().toISOString(),
                    status: 'successful'
                })
            });
        } catch (e) { console.log('Formspree log skipped'); }
        
        localStorage.setItem('user_email', user.email);
        localStorage.setItem('user_name', user.name || email.split('@')[0]);
        localStorage.setItem('user_logged_in', 'true');
        
        closeAuthModal();
        updateAuthUI();
        showNotification('Login successful! Welcome back.', 'success');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Login';
        setTimeout(() => location.reload(), 1000);
        return;
    }
    
    // Try backend API if no local user found
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Save user data
            localStorage.setItem('user_email', data.email || email);
            localStorage.setItem('user_name', data.name || email.split('@')[0]);
            localStorage.setItem('user_logged_in', 'true');
            
            closeAuthModal();
            updateAuthUI();
            showNotification('Login successful! Welcome back.', 'success');
            
            setTimeout(() => location.reload(), 1000);
        } else {
            errorEl.textContent = data.message || 'Login failed';
        }
    } catch (error) {
        console.error('Login error:', error);
        // No matching user found
        if (localUsers.length === 0) {
            // No local users exist, allow demo login
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_name', email.split('@')[0]);
            localStorage.setItem('user_logged_in', 'true');
            
            closeAuthModal();
            updateAuthUI();
            showNotification('Login successful! (Demo mode)', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            errorEl.textContent = 'Invalid email or password. Please sign up first.';
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Login';
    }
}

// Handle Signup
async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const errorEl = document.getElementById('signup-error');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        errorEl.textContent = 'Please fill in all fields';
        return;
    }
    
    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        return;
    }
    
    if (password !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match';
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    
    // Check if email already exists locally
    const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
    if (localUsers.find(u => u.email === email)) {
        errorEl.textContent = 'Email already registered';
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Account';
        return;
    }
    
    try {
        // Submit to Formspree for record-keeping
        await fetch('https://formspree.io/f/mwvrpbgr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                _subject: 'New User Signup',
                name: name,
                email: email,
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
            body: JSON.stringify({ email, password, name })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Also save locally for offline use
            saveLocalUser({ name, email, password });
            
            showNotification('Account created successfully!', 'success');
            
            // Auto-login after signup
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_name', name);
            localStorage.setItem('user_logged_in', 'true');
            
            closeAuthModal();
            updateAuthUI();
            setTimeout(() => location.reload(), 1000);
        } else {
            errorEl.textContent = data.message || 'Registration failed';
        }
    } catch (error) {
        console.error('Signup error:', error);
        // Fallback: Local signup when server unavailable
        
        // Save user locally
        saveLocalUser({ name, email, password });
        
        showNotification('Account created successfully!', 'success');
        
        // Auto-login after signup
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_name', name);
        localStorage.setItem('user_logged_in', 'true');
        
        closeAuthModal();
        updateAuthUI();
        setTimeout(() => location.reload(), 1000);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Account';
    }
}

// Save user locally for offline fallback
function saveLocalUser(user) {
    const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
    if (!localUsers.find(u => u.email === user.email)) {
        localUsers.push(user);
        localStorage.setItem('local_users', JSON.stringify(localUsers));
    }
}

// Handle Logout
function handleLogout() {
    localStorage.removeItem('user_logged_in');
    showNotification('You have been logged out.', 'success');
    updateAuthUI();
    setTimeout(() => location.reload(), 1000);
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notifications
    document.querySelectorAll('.auth-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `auth-notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize auth
document.addEventListener('DOMContentLoaded', () => {
    // Update UI
    updateAuthUI();
    
    // Add click handlers for login/signup buttons
    document.querySelectorAll('.btn-login').forEach(btn => {
        btn.addEventListener('click', openLoginModal);
    });
    
    document.querySelectorAll('.btn-signup').forEach(btn => {
        btn.addEventListener('click', openSignupModal);
    });
    
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.dataset.tab === 'login') showLoginForm();
            else showSignupForm();
        });
    });
    
    // Close modal on overlay click
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAuthModal();
        });
    }
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAuthModal();
    });
    
    // Form submissions
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
    
    // Logout button
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', handleLogout);
    });
});
