/**
 * Frontend Authentication Utilities
 */

const Auth = {
    /**
     * Checks if a user is currently logged in (has token).
     */
    isLoggedIn: () => {
        return !!localStorage.getItem('authToken');
    },

    /**
     * Redirects to dashboard if user is already logged in.
     */
    checkSessionAndRedirect: () => {
        if (Auth.isLoggedIn()) {
            // Dashboard page does not exist yet per module specs, but we redirect as requested.
            window.location.href = '../dashboard/dashboard.html';
        }
    },

    /**
     * Logs the user out by clearing session data and redirecting.
     */
    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // Redirect to login page
        window.location.href = '/frontend/pages/login/login.html';
    },

    /**
     * Returns the stored auth token
     */
    getToken: () => {
        return localStorage.getItem('authToken');
    },

    /**
     * Checks if a token is present in localStorage
     */
    isTokenPresent: () => {
        return !!localStorage.getItem('authToken');
    },

    /**
     * Protects a page by checking for token existence.
     * If missing, redirects to login page.
     */
    protectPage: () => {
        if (!Auth.isTokenPresent()) {
            window.location.href = '/frontend/pages/login/login.html';
        }
    },

    /**
     * Returns the parsed user object from localStorage
     */
    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
};
