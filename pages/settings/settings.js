document.addEventListener('DOMContentLoaded', async () => {
    // 1. Guard route
    if (typeof Auth !== 'undefined') {
        Auth.protectPage();
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Auth.logout();
        });
    }

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

    const globalAlert = document.getElementById('global-alert');
    const showAlert = (message, isSuccess = false) => {
        globalAlert.textContent = message;
        globalAlert.className = `alert ${isSuccess ? 'alert-success' : 'alert-error'}`;
        // Auto hide after 5 seconds
        setTimeout(() => {
            globalAlert.classList.add('hidden');
        }, 5000);
    };

    // Load Profile Data
    const loadProfile = async () => {
        try {
            const response = await Api.get('/profile');
            if (response.ok && response.data.success) {
                const user = response.data.data;
                // Pre-fill profile form
                document.getElementById('name').value = user.name;
                document.getElementById('email').value = user.email;

                // Set account info
                document.getElementById('display-id').textContent = user.userId;
                document.getElementById('display-created').textContent = new Date(user.createdAt).toLocaleString();
                document.getElementById('display-updated').textContent = new Date(user.updatedAt).toLocaleString();
                
                // Update local storage user just in case
                const storedUser = Auth.getCurrentUser() || {};
                storedUser.name = user.name;
                storedUser.email = user.email;
                localStorage.setItem('user', JSON.stringify(storedUser));
            } else {
                showAlert(response.data.message || 'Failed to load profile');
            }
        } catch (error) {
            showAlert('Network error while loading profile');
        }
    };

    await loadProfile();

    // Profile Form Submission
    const profileForm = document.getElementById('profile-form');
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset errors
        document.querySelectorAll('#profile-form .error-text').forEach(el => el.textContent = '');
        document.querySelectorAll('#profile-form input').forEach(el => el.classList.remove('error'));
        globalAlert.classList.add('hidden');
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();

        if (!name || !email) {
            if (!name) document.getElementById('name-error').textContent = 'Name is required';
            if (!email) document.getElementById('email-error').textContent = 'Email is required';
            return;
        }

        const btn = document.getElementById('profile-btn');
        const btnText = document.getElementById('profile-btn-text');
        const spinner = document.getElementById('profile-btn-spinner');

        btn.disabled = true;
        btnText.textContent = 'Updating...';
        spinner.classList.remove('hidden');

        try {
            const response = await Api.put('/profile', { name, email });
            
            if (response.ok && response.data.success) {
                showAlert(response.data.message, true);
                // Refresh profile data
                loadProfile();
            } else {
                // Map validation errors
                if (response.data.errors) {
                    response.data.errors.forEach(err => {
                        const errEl = document.getElementById(`${err.field}-error`);
                        if (errEl) errEl.textContent = err.message;
                        document.getElementById(err.field).classList.add('error');
                    });
                }
                showAlert(response.data.message || 'Update failed');
            }
        } catch (error) {
            showAlert('Network error');
        } finally {
            btn.disabled = false;
            btnText.textContent = 'Update Profile';
            spinner.classList.add('hidden');
        }
    });


    // Password Strength
    const newPasswordInput = document.getElementById('newPassword');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');

    newPasswordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        let score = 0;
        
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

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
    });

    // Password Form Submission
    const passwordForm = document.getElementById('password-form');
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset errors
        document.querySelectorAll('#password-form .error-text').forEach(el => el.textContent = '');
        document.querySelectorAll('#password-form input').forEach(el => el.classList.remove('error'));
        globalAlert.classList.add('hidden');

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            if (!currentPassword) document.getElementById('currentPassword-error').textContent = 'Required';
            if (!newPassword) document.getElementById('newPassword-error').textContent = 'Required';
            if (!confirmPassword) document.getElementById('confirmPassword-error').textContent = 'Required';
            return;
        }

        const btn = document.getElementById('password-btn');
        const btnText = document.getElementById('password-btn-text');
        const spinner = document.getElementById('password-btn-spinner');

        btn.disabled = true;
        btnText.textContent = 'Changing...';
        spinner.classList.remove('hidden');

        try {
            const payload = { currentPassword, newPassword, confirmPassword };
            const response = await Api.put('/profile/change-password', payload);
            
            if (response.ok && response.data.success) {
                showAlert(response.data.message, true);
                passwordForm.reset();
                strengthBar.style.width = '0%';
                strengthText.textContent = 'None';
                strengthText.style.color = 'var(--text-muted)';
            } else {
                // Map validation errors
                if (response.data.errors) {
                    response.data.errors.forEach(err => {
                        const errEl = document.getElementById(`${err.field}-error`);
                        if (errEl) errEl.textContent = err.message;
                        document.getElementById(err.field).classList.add('error');
                    });
                }
                showAlert(response.data.message || 'Password change failed');
            }
        } catch (error) {
            showAlert('Network error');
        } finally {
            btn.disabled = false;
            btnText.textContent = 'Change Password';
            spinner.classList.add('hidden');
        }
    });
});
