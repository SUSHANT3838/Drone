// Signup form handling and redirection
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Form submission handler
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Basic validation
        if (!fullName || !email || !password || !confirmPassword) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters long', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        // Simulate signup process (replace with actual registration)
        setTimeout(() => {
            // For demo purposes, accept any valid form data
            if (fullName && email && password && confirmPassword) {
                showMessage('Account created successfully! Redirecting...', 'success');
                
                // Store user data (optional)
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userName', fullName);
                
                // Redirect to home page after a short delay
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1500);
            } else {
                showMessage('Something went wrong. Please try again.', 'error');
                setLoadingState(false);
            }
        }, 2000);
    });

    // Email validation function
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Password strength checker
    function checkPasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        if (strength < 3) return 'weak';
        if (strength < 5) return 'medium';
        return 'strong';
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
        const form = document.getElementById('signupForm');
        const submitButton = form.querySelector('button[type="submit"]');
        
        if (loading) {
            form.classList.add('loading');
            submitButton.textContent = 'Creating Account...';
            submitButton.disabled = true;
        } else {
            form.classList.remove('loading');
            submitButton.textContent = 'Create Account';
            submitButton.disabled = false;
        }
    }

    // Real-time password strength indicator
    passwordInput.addEventListener('input', function() {
        const strength = checkPasswordStrength(this.value);
        const strengthIndicator = document.querySelector('.password-strength');
        
        if (!strengthIndicator) {
            const indicator = document.createElement('div');
            indicator.className = 'password-strength';
            this.parentElement.appendChild(indicator);
        }
        
        const indicator = this.parentElement.querySelector('.password-strength');
        indicator.className = `password-strength ${strength}`;
    });

    // Real-time password confirmation check
    confirmPasswordInput.addEventListener('input', function() {
        const password = passwordInput.value;
        const confirmPassword = this.value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.style.borderColor = '#ef4444';
            this.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.2)';
        } else {
            this.style.borderColor = '';
            this.style.boxShadow = '';
        }
    });

    // Add input focus effects
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
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
        if (e.key === 'Enter' && (fullNameInput === document.activeElement || 
                                 emailInput === document.activeElement || 
                                 passwordInput === document.activeElement || 
                                 confirmPasswordInput === document.activeElement)) {
            signupForm.dispatchEvent(new Event('submit'));
        }
        
        // Escape key to clear form
        if (e.key === 'Escape') {
            signupForm.reset();
            inputs.forEach(input => {
                input.parentElement.classList.remove('focused');
                input.style.borderColor = '';
                input.style.boxShadow = '';
            });
            const strengthIndicator = document.querySelector('.password-strength');
            if (strengthIndicator) {
                strengthIndicator.remove();
            }
        }
    });

    // Check if user is already logged in (optional - can be removed if you want signup page to always show)
    // if (localStorage.getItem('isLoggedIn') === 'true') {
    //     showMessage('You are already logged in!', 'success');
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