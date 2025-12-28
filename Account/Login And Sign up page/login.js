// Login form handling and redirection
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Form submission handler
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Basic validation
        if (!email || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        // Simulate login process (replace with actual authentication)
        setTimeout(() => {
            // For demo purposes, accept any valid email/password combination
            if (email && password) {
                showMessage('Login successful! Redirecting...', 'success');
                
                // Store login state (optional)
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', email);
                
                // Redirect to home page after a short delay
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1500);
            } else {
                showMessage('Invalid credentials. Please try again.', 'error');
                setLoadingState(false);
            }
        }, 2000);
    });

    // Email validation function
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Show message function
    function showMessage(message, type) {
        // Remove existing message if any
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
            type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
        }`;
        messageDiv.textContent = message;

        // Add to page
        document.body.appendChild(messageDiv);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    // Set loading state
    function setLoadingState(loading) {
        const form = document.getElementById('loginForm');
        const submitButton = form.querySelector('button[type="submit"]');
        
        if (loading) {
            form.classList.add('loading');
            submitButton.textContent = 'Signing In...';
            submitButton.disabled = true;
        } else {
            form.classList.remove('loading');
            submitButton.textContent = 'Sign In';
            submitButton.disabled = false;
        }
    }

    // Add input focus effects
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Enter key to submit form
        if (e.key === 'Enter' && (emailInput === document.activeElement || passwordInput === document.activeElement)) {
            loginForm.dispatchEvent(new Event('submit'));
        }
        
        // Escape key to clear form
        if (e.key === 'Escape') {
            loginForm.reset();
            inputs.forEach(input => input.parentElement.classList.remove('focused'));
        }
    });

    // Check if user is already logged in (optional - can be removed if you want login page to always show)
    // if (localStorage.getItem('isLoggedIn') === 'true') {
    //     showMessage('Welcome back!', 'success');
    //     setTimeout(() => {
    //         window.location.href = 'home.html';
    //     }, 1000);
    // }
});

// Add smooth animations for page load
window.addEventListener('load', function() {
    const container = document.querySelector('.glass-container');
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        container.style.transition = 'all 0.6s ease-out';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }, 100);
}); 