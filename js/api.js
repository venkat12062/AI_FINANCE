/**
 * Frontend API Utility
 * Centralizes API calls, dynamically resolves Railway backend in cloud/Vercel environments,
 * automatically injects JWT Authorization headers, and handles 401 session expiration.
 */

const RAILWAY_BACKEND_URL = 'https://aifinance-production-d8db.up.railway.app';

const getApiBaseUrl = () => {
    if (typeof window === 'undefined') return 'http://localhost:5000/api';
    const host = window.location.hostname;
    
    // If running locally (localhost / 127.0.0.1) on port 5000/8080/etc., use same-origin /api
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
        // If served by Express backend directly
        return window.location.origin + '/api';
    }
    
    // If deployed on Vercel, Netlify, or any external hosting domain, connect to Railway backend
    return `${RAILWAY_BACKEND_URL}/api`;
};

const Api = {
    consts: {
        get BASE_URL() {
            return getApiBaseUrl();
        }
    },

    getBaseUrl: () => getApiBaseUrl(),

    /**
     * Helper to perform fetch requests with auth headers and dynamic backend URL.
     * @param {string} endpoint - e.g. '/dashboard/overview'
     * @param {object} options - Fetch options (method, body, etc)
     */
    request: async (endpoint, options = {}) => {
        // Ensure endpoint starts with a slash
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${getApiBaseUrl()}${cleanEndpoint}`;
        
        // Merge headers
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        // Inject JWT if available
        if (typeof Auth !== 'undefined' && Auth.isTokenPresent()) {
            headers['Authorization'] = `Bearer ${Auth.getToken()}`;
        }

        const fetchOptions = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, fetchOptions);

            // Intercept 401 Unauthorized globally
            if (response.status === 401) {
                if (typeof Auth !== 'undefined') {
                    // Only redirect if not already on the login or register page
                    const path = window.location.pathname;
                    if (!path.includes('login.html') && !path.includes('register.html') && path !== '/') {
                        Auth.logout();
                    }
                }
                return { status: 401, ok: false, data: { success: false, message: 'Session expired' } };
            }

            const data = await response.json().catch(() => ({}));
            return {
                status: response.status,
                ok: response.ok,
                data
            };
        } catch (error) {
            console.error('API Request Failed:', error);
            return {
                status: 500,
                ok: false,
                data: { success: false, message: 'Cannot reach backend server. Please verify your connection.' }
            };
        }
    },

    get: (endpoint, headers = {}) => {
        return Api.request(endpoint, { method: 'GET', headers });
    },

    post: (endpoint, body, headers = {}) => {
        return Api.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
            headers
        });
    },

    put: (endpoint, body, headers = {}) => {
        return Api.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
            headers
        });
    },

    delete: (endpoint, headers = {}) => {
        return Api.request(endpoint, { method: 'DELETE', headers });
    }
};

// Global export
if (typeof window !== 'undefined') {
    window.Api = Api;
    window.getApiBaseUrl = getApiBaseUrl;
}
