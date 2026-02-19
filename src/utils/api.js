import axios from 'axios';

// ================================================================
// AXIOS INSTANCE
// ================================================================
const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// ================================================================
// OFFLINE NOTIFICATION STATE
// Tracks whether we've shown the offline toast to avoid spamming
// ================================================================
let offlineToastShown = false;
let networkListenersAttached = false;

function showOfflineToast() {
    if (offlineToastShown) return;
    offlineToastShown = true;

    // Create toast notification element
    const toast = document.createElement('div');
    toast.id = 'sm-offline-toast';
    toast.innerHTML = `
        <div style="
            position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white; padding: 12px 24px; border-radius: 16px;
            font-size: 12px; font-weight: 700; z-index: 99999;
            box-shadow: 0 8px 32px rgba(239,68,68,0.3);
            display: flex; align-items: center; gap: 8px;
            animation: slideUp 0.3s ease-out;
            font-family: system-ui, -apple-system, sans-serif;
        ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                <path d="M10.71 5.05A16 16 0 0 1 22.56 9"></path>
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
            Koneksi terputus. Ibadah offline akan disinkronkan nanti.
        </div>
    `;
    document.body.appendChild(toast);

    // Add animation keyframe
    if (!document.getElementById('sm-toast-style')) {
        const style = document.createElement('style');
        style.id = 'sm-toast-style';
        style.textContent = `@keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`;
        document.head.appendChild(style);
    }
}

function hideOfflineToast() {
    offlineToastShown = false;
    const toast = document.getElementById('sm-offline-toast');
    if (toast) toast.remove();
}

// Attach network listeners once
if (!networkListenersAttached && typeof window !== 'undefined') {
    window.addEventListener('online', hideOfflineToast);
    window.addEventListener('offline', showOfflineToast);
    networkListenersAttached = true;
}

// ================================================================
// REQUEST INTERCEPTOR
// Auto-inject JWT token
// ================================================================
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ================================================================
// RESPONSE INTERCEPTOR
// Handle 401, 429, 500, Network errors
// ================================================================
axiosInstance.interceptors.response.use(
    (response) => {
        // Successful response: ensure offline toast is hidden
        hideOfflineToast();
        return response;
    },
    (error) => {
        // ── Network Error (No Response) ──────────────
        if (!error.response) {
            // Only show toast for non-heartbeat requests
            const isHeartbeat = error.config?.headers?.['X-Heartbeat'] === '1';
            if (!isHeartbeat) {
                showOfflineToast();
            }
            console.warn('NETWORK ERROR:', error.message);
            return Promise.reject(error);
        }

        const status = error.response.status;

        // ── 401 Unauthorized ──────────────
        if (status === 401) {
            if (!window.location.pathname.includes('/auth')) {
                localStorage.removeItem('auth_user');
                localStorage.removeItem('auth_token');
            }
        }

        // ── 429 Rate Limited ──────────────
        if (status === 429) {
            console.warn('Rate limited. Retry after:', error.response.data?.data?.retry_after);
        }

        // ── 500 Server Error ──────────────
        if (status >= 500) {
            console.error('SERVER ERROR:', error.response.data);
        }

        return Promise.reject(error);
    }
);

// ================================================================
// API NAMESPACE EXPORTS
// ================================================================
export default {
    // Auth
    auth: {
        login: (credentials) => axiosInstance.post('/auth/login', credentials),
        register: (data) => axiosInstance.post('/auth/register', data),
        logout: () => axiosInstance.post('/auth/logout'),
        me: () => axiosInstance.get('/auth/me'),
        updateProfile: (data) => axiosInstance.put('/auth/profile', data),
        refreshToken: (token) => axiosInstance.post('/auth/refresh', { refresh_token: token }),
    },

    // Ibadah (legacy)
    ibadah: {
        getToday: () => axiosInstance.get('/ibadah/today'),
        log: (data) => axiosInstance.post('/ibadah/log', data),
        getHistory: (days) => axiosInstance.get(`/ibadah/history?days=${days}`),
        getLeaderboard: (limit) => axiosInstance.get(`/ibadah/leaderboard?limit=${limit}`),
        claimBadge: (badgeId) => axiosInstance.post('/ibadah/badges/claim', { badge_id: badgeId }),
    },

    // Community & Chat
    community: {
        list: () => axiosInstance.get('/communities'),
        show: (slug) => axiosInstance.get(`/communities/${slug}`),
        create: (data) => axiosInstance.post('/communities', data),
        join: (slug) => axiosInstance.post(`/communities/${slug}/join`),
        members: (slug) => axiosInstance.get(`/communities/${slug}/members`),
        delete: (slug) => axiosInstance.delete(`/communities/${slug}`),
    },
    chat: {
        getMessages: (conversationId) => axiosInstance.get(`/conversations/${conversationId}/messages`),
        sendMessage: (conversationId, data) => axiosInstance.post(`/conversations/${conversationId}/messages`, data),
        unreadCount: () => axiosInstance.get('/conversations/unread'),
    },

    // Admin
    admin: {
        dashboard: () => axiosInstance.get('/admin/dashboard'),
        users: () => axiosInstance.get('/admin/users'),
        liveUsers: () => axiosInstance.get('/admin/live-users'),
        editXp: (data) => axiosInstance.post('/admin/users/edit-xp', data),
        resetPassword: (data) => axiosInstance.post('/admin/users/reset-password', data),
        banUser: (data) => axiosInstance.post('/admin/users/ban', data),
        getConfig: () => axiosInstance.get('/admin/gamification-config'),
        updateConfig: (ibadahId, data) => axiosInstance.put(`/admin/gamification-config/${ibadahId}`, data),
    },

    // Generic (for communityStore)
    get: (url, params) => axiosInstance.get(url, { params }),
    post: (url, data, config) => axiosInstance.post(url, data, config),
    put: (url, data) => axiosInstance.put(url, data),
    delete: (url) => axiosInstance.delete(url),
};
