import axios from "axios";
import { useAuthStore } from "../stores/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 30000,
  // Wajib true: backend sekarang mengirim refresh_token lewat httpOnly
  // Set-Cookie, bukan body JSON. withCredentials memastikan cookie
  // ikut terkirim (request) & disimpan (response) meski cross-subdomain.
  withCredentials: true,
});

// ── Request Interceptor ──────────────────────────────
// Attach Bearer token ke setiap request. accessToken diambil dari Pinia store (memori).
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ─────────────────────────────
// Handle auto-refresh token saat 401, dan unwrap format response
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onRefreshed(newToken) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const authStore = useAuthStore();

      // Tidak ada lagi pengecekan refresh_token di localStorage — cookie
      // httpOnly tidak bisa dibaca dari JS. Backend yang memutuskan valid
      // atau tidak (cookie kosong/kadaluarsa akan langsung dibalas 401 oleh
      // /auth/refresh, ditangkap di blok catch di bawah).

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Tanpa body — refresh_token diambil backend dari cookie.
        // withCredentials wajib di sini juga karena ini axios instance
        // terpisah (bukan `api`), dan cookie baru hasil rotasi diterima
        // lewat Set-Cookie response ini.
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const { access_token } = res.data.data;

        authStore.accessToken = access_token;

        isRefreshing = false;
        onRefreshed(access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        authStore.clearSession();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
