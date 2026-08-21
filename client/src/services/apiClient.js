import axios from "axios";
import { toast } from "react-toastify";

let API_BASE = import.meta.env.VITE_SERVER;
if (import.meta.env.VITE_SERVER && !import.meta.env.VITE_SERVER.endsWith('/api')) {
    API_BASE = `${import.meta.env.VITE_SERVER}/api`;
}

const apiClient = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
});

// ── Request Interceptor: Attach access token ───────────────────────────────────
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("getway_token");
        if (token && token !== 'undefined') {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Token Refresh State ────────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });
    failedQueue = [];
};

// ── Routes that must NEVER trigger token refresh ──────────────────────────────
const NO_REFRESH_ROUTES = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh-token',
    '/auth/forgot-password',
    '/auth/reset-password',
];

const isNoRefreshRoute = (url = '') =>
    NO_REFRESH_ROUTES.some((route) => url.includes(route));

// ── Response Interceptor ───────────────────────────────────────────────────────
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // ── Token Refresh Logic ──
        // Only attempt refresh for 401 on protected routes, not auth endpoints
        if (status === 401 && !originalRequest._retry && !isNoRefreshRoute(originalRequest.url)) {

            // If a refresh is already in flight, queue this request to retry after refresh completes
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((newToken) => {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        originalRequest._retry = true;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Use plain axios to avoid apiClient interceptors and sending the expired token
                const localRefreshToken = localStorage.getItem("getway_refresh_token_fallback");
                const { data } = await axios.post(`${API_BASE}/auth/refresh-token`, {
                    refreshToken: localRefreshToken
                }, {
                    withCredentials: true
                });

                if (!data?.token) {
                    // Refresh endpoint returned success:false or missing token
                    throw new Error('Refresh token response missing token');
                }

                const newToken = data.token;

                // Persist the new token
                localStorage.setItem("getway_token", newToken);
                apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                if (data.refreshToken) {
                    localStorage.setItem("getway_refresh_token_fallback", data.refreshToken);
                }

                // Notify React app that token was silently refreshed
                window.dispatchEvent(new CustomEvent("auth:tokenRefreshed", { detail: { token: newToken } }));

                // Retry all queued requests with new token
                processQueue(null, newToken);

                // Retry the original request with new token
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(originalRequest);

            } catch (refreshError) {
                // Refresh failed
                processQueue(refreshError, null);

                // Extract specific backend message for debugging
                const refreshStatus = refreshError.response?.status;
                const backendMessage = refreshError.response?.data?.message || refreshError.message;

                // Only log out if the server explicitly rejected the refresh token (4xx error)
                if (refreshStatus >= 400 && refreshStatus < 500) {
                    localStorage.removeItem("getway_token");
                    localStorage.removeItem("getway_user");

                    toast.error(`Session Expired: ${backendMessage}`, {
                        toastId: "session_expired",
                    });
                    window.dispatchEvent(new CustomEvent("auth:logout"));
                } else {
                    // For network errors or 5xx, don't logout, but inform the user
                    toast.error(`Refresh Failed: ${backendMessage}`, {
                        toastId: "refresh_failed",
                    });
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // ── Global Error Toast ──
        // Skip toast for: auth endpoints (login/signup show their own errors),
        // requests with hideErrorToast flag, and all 4xx errors (components handle these manually)
        const suppressToast =
            originalRequest?.hideErrorToast ||
            isNoRefreshRoute(originalRequest?.url) ||
            (status >= 400 && status < 500);

        if (!suppressToast) {
            let message = error.response?.data?.message;

            if (!message) {
                if (status === 403) message = "You do not have permission to perform this action.";
                else if (status === 404) message = "Resource not found.";
                else if (status === 429) message = "Too many requests. Please try again later.";
                else if (status >= 500) message = "An internal server error occurred.";
                else if (!error.response) message = "Network error. Please check your connection.";
                else message = "An unexpected error occurred.";
            }

            toast.error(message, { toastId: message });
        }

        return Promise.reject(error);
    }
);

export default apiClient;
