document.addEventListener('DOMContentLoaded', () => {
    // 1. Session Check: Automatically redirect if already logged in
    if (typeof Auth !== 'undefined') {
        Auth.checkSessionAndRedirect();
    }

    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    const alertBox = document.getElementById('alert-box');

    // Toggle Password Visibility
    const togglePassword = document.getElementById('toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            } else {
                passwordInput.type = 'password';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            }
        });
    }

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset state
        document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
        document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
        alertBox.className = 'alert hidden';
        
        const payload = {
            email: emailInput.value.trim(),
            password: passwordInput.value
        };

        // Basic frontend empty checks
        let hasError = false;
        if (!payload.email) {
            document.getElementById('email-error').textContent = 'Email is required';
            emailInput.classList.add('error');
            hasError = true;
        }
        if (!payload.password) {
            document.getElementById('password-error').textContent = 'Password is required';
            passwordInput.classList.add('error');
            hasError = true;
        }

        if (hasError) return;

        // Loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Logging in...';
        btnSpinner.classList.remove('hidden');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Success
                alertBox.textContent = data.message;
                alertBox.className = 'alert alert-success';
                
                // Store token and user in localStorage
                if (data.data && data.data.token) {
                    if (typeof Auth !== 'undefined' && Auth.setSession) {
                        Auth.setSession(data.data.token, data.data.user);
                    } else {
                        localStorage.setItem('token', data.data.token);
                        localStorage.setItem('authToken', data.data.token);
                        localStorage.setItem('user', JSON.stringify(data.data.user));
                        localStorage.setItem('currentUser', JSON.stringify(data.data.user));
                    }
                    
                    // Redirect to dashboard
                    setTimeout(() => {
                        window.location.href = '/pages/dashboard/dashboard.html';
                    }, 500);
                } else {
                    alertBox.textContent = 'Invalid response from server.';
                    alertBox.className = 'alert alert-error';
                }
            } else {
                // Handle API Errors
                if (data.errors && data.errors.length > 0) {
                    // Map field errors to inputs
                    data.errors.forEach(err => {
                        const errorEl = document.getElementById(`${err.field}-error`);
                        const inputEl = document.getElementById(err.field);
                        if (errorEl) errorEl.textContent = err.message;
                        if (inputEl) inputEl.classList.add('error');
                    });
                }
                
                // Show general alert if message exists
                if (data.message) {
                    alertBox.textContent = data.message;
                    alertBox.className = 'alert alert-error';
                }
            }
        } catch (error) {
            alertBox.textContent = 'Cannot connect to the server. Please try again later.';
            alertBox.className = 'alert alert-error';
        } finally {
            // Revert loading state
            submitBtn.disabled = false;
            btnText.textContent = 'Login';
            btnSpinner.classList.add('hidden');
        }
    });
});
