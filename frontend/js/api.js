/**
 * Frontend API Utility
 * Centralizes API calls and automatically injects JWT Authorization headers.
 * Automatically intercepts 401 Unauthorized responses to trigger logout.
 */

const Api = {
    consts: {
        BASE_URL: (typeof window !== 'undefined' && window.location.origin ? window.location.origin + '/api' : 'http://localhost:5000/api')
    },

    /**
     * Helper to perform fetch requests with auth headers.
     * @param {string} endpoint - e.g. '/auth/me'
     * @param {object} options - Fetch options (method, body, etc)
     */
    request: async (endpoint, options = {}) => {
        const url = `${Api.consts.BASE_URL}${endpoint}`;
        
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
                    // Show message (could use a toast/alert in real app)
                    alert('Session expired. Please login again.');
                    Auth.logout();
                }
                return { success: false, message: 'Session expired' };
            }

            const data = await response.json();
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
                data: { success: false, message: 'Network error. Please try again later.' }
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
