/**
 * Frontend Authentication Utilities
 * Centralizes session management, user retrieval, and page protection.
 */

const Auth = {
    /**
     * Checks if a user is currently logged in (has valid token).
     */
    isLoggedIn: () => {
        return !!(localStorage.getItem('token') || localStorage.getItem('authToken'));
    },

    /**
     * Checks if a token is present in localStorage
     */
    isTokenPresent: () => {
        return Auth.isLoggedIn();
    },

    /**
     * Returns the stored auth token
     */
    getToken: () => {
        return localStorage.getItem('token') || localStorage.getItem('authToken') || '';
    },

    /**
     * Returns the parsed user object from localStorage
     * Supports both 'user' and 'currentUser' keys for complete compatibility.
     */
    getUser: () => {
        try {
            const raw = localStorage.getItem('user') || localStorage.getItem('currentUser');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error('Error parsing user from localStorage:', e);
            return null;
        }
    },

    /**
     * Alias for getUser() to ensure backward compatibility across all modules
     */
    getCurrentUser: () => {
        return Auth.getUser();
    },

    /**
     * Sets user session data in localStorage
     */
    setSession: (token, user) => {
        if (token) {
            localStorage.setItem('token', token);
            localStorage.setItem('authToken', token);
        }
        if (user) {
            const str = typeof user === 'string' ? user : JSON.stringify(user);
            localStorage.setItem('user', str);
            localStorage.setItem('currentUser', str);
        }
    },

    /**
     * Redirects to dashboard if user is already logged in.
     */
    checkSessionAndRedirect: () => {
        if (Auth.isLoggedIn()) {
            window.location.href = '/pages/dashboard/dashboard.html';
        }
    },

    /**
     * Protects a page by checking for token existence.
     * If missing, redirects to login page.
     */
    protectPage: () => {
        if (!Auth.isLoggedIn()) {
            window.location.href = '/pages/login/login.html';
        }
    },

    /**
     * Logs the user out by clearing session data and redirecting.
     */
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('currentUser');
        localStorage.clear();
        
        // Redirect to login page
        window.location.href = '/pages/login/login.html';
    }
};
