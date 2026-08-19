document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    const alertBox = document.getElementById('alert-box');

    // Toggle Password Visibility
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            }
        });
    });

    // Password Strength & Rules Validation
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    const ruleLength = document.getElementById('rule-length');
    const ruleUpper = document.getElementById('rule-upper');
    const ruleLower = document.getElementById('rule-lower');
    const ruleNumber = document.getElementById('rule-number');
    const ruleSpecial = document.getElementById('rule-special');

    const validatePasswordStrength = (password) => {
        let score = 0;
        
        // Length check
        if (password.length >= 8) {
            score++;
            ruleLength.classList.add('valid');
        } else {
            ruleLength.classList.remove('valid');
        }

        // Uppercase check
        if (/[A-Z]/.test(password)) {
            score++;
            ruleUpper.classList.add('valid');
        } else {
            ruleUpper.classList.remove('valid');
        }

        // Lowercase check
        if (/[a-z]/.test(password)) {
            score++;
            ruleLower.classList.add('valid');
        } else {
            ruleLower.classList.remove('valid');
        }

        // Number check
        if (/[0-9]/.test(password)) {
            score++;
            ruleNumber.classList.add('valid');
        } else {
            ruleNumber.classList.remove('valid');
        }

        // Special char check
        if (/[^A-Za-z0-9]/.test(password)) {
            score++;
            ruleSpecial.classList.add('valid');
        } else {
            ruleSpecial.classList.remove('valid');
        }

        // Update UI
        if (password.length === 0) {
            strengthBar.style.width = '0%';
            strengthText.textContent = 'None';
            strengthText.style.color = 'var(--text-muted)';
        } else if (score <= 2) {
            strengthBar.style.width = '33%';
            strengthBar.style.backgroundColor = 'var(--danger)';
            strengthText.textContent = 'Weak';
            strengthText.style.color = 'var(--danger)';
        } else if (score <= 4) {
            strengthBar.style.width = '66%';
            strengthBar.style.backgroundColor = 'var(--warning)';
            strengthText.textContent = 'Medium';
            strengthText.style.color = 'var(--warning)';
        } else {
            strengthBar.style.width = '100%';
            strengthBar.style.backgroundColor = 'var(--success)';
            strengthText.textContent = 'Strong';
            strengthText.style.color = 'var(--success)';
        }
        
        return score === 5;
    };

    passwordInput.addEventListener('input', (e) => {
        validatePasswordStrength(e.target.value);
        if (confirmPasswordInput.value) {
            validateConfirmPassword();
        }
    });

    // Real-time Confirm Password Validation
    const validateConfirmPassword = () => {
        const errorEl = document.getElementById('confirmPassword-error');
        if (confirmPasswordInput.value !== passwordInput.value) {
            confirmPasswordInput.classList.add('error');
            errorEl.textContent = 'Passwords do not match';
            return false;
        } else {
            confirmPasswordInput.classList.remove('error');
            errorEl.textContent = '';
            return true;
        }
    };
    confirmPasswordInput.addEventListener('input', validateConfirmPassword);

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset state
        document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
        document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
        alertBox.className = 'alert hidden';
        
        const payload = {
            name: nameInput.value,
            email: emailInput.value,
            password: passwordInput.value,
            confirmPassword: confirmPasswordInput.value
        };

        // Basic frontend empty checks
        let hasError = false;
        if (!payload.name) {
            document.getElementById('name-error').textContent = 'Name is required';
            nameInput.classList.add('error');
            hasError = true;
        }
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
        if (!validateConfirmPassword()) {
            hasError = true;
        }

        if (hasError) return;

        // Loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Registering...';
        btnSpinner.classList.remove('hidden');

        try {
            const apiRes = await Api.post('/auth/register', payload);
            const data = apiRes.data;

            if ((apiRes.ok || apiRes.status === 201 || apiRes.status === 200) && data && data.success) {
                // Success
                alertBox.textContent = 'Registration successful! Redirecting to login...';
                alertBox.className = 'alert alert-success';
                form.reset();
                validatePasswordStrength(''); // reset rules
                setTimeout(() => {
                    window.location.href = '/pages/login/login.html';
                }, 1200);
            } else {
                // Handle API Errors
                if (data && data.errors && data.errors.length > 0) {
                    // Map field errors to inputs
                    data.errors.forEach(err => {
                        const errorEl = document.getElementById(`${err.field}-error`);
                        const inputEl = document.getElementById(err.field);
                        if (errorEl) errorEl.textContent = err.message;
                        if (inputEl) inputEl.classList.add('error');
                    });
                }
                
                // Show general alert
                alertBox.textContent = (data && data.message) || 'Registration failed';
                alertBox.className = 'alert alert-error';
            }
        } catch (error) {
            alertBox.textContent = 'Cannot connect to the server. Please try again later.';
            alertBox.className = 'alert alert-error';
        } finally {
            // Revert loading state
            submitBtn.disabled = false;
            btnText.textContent = 'Register';
            btnSpinner.classList.add('hidden');
        }
    });
});
