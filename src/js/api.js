import axios from "axios";
import { useAuthStore } from "../stores/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 30000,

  // Wajib true agar backend mengirim refresh_token melalui httpOnly cookie.
  // Cookie akan otomatis dikirim pada request dan disimpan dari response.
  // Ini diperlukan ketika frontend dan backend berada pada origin yang berbeda.
  withCredentials: true,
});

// Interceptor request
// Menambahkan Bearer token ke setiap request yang membutuhkan autentikasi.
// accessToken diambil dari Pinia store karena token hanya disimpan di memory.
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

// Interceptor response
// Menangani token yang sudah expired dengan melakukan refresh secara otomatis.
// Response yang berhasil juga langsung diubah menjadi response.data.
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(onSuccess, onFail) {
  refreshSubscribers.push({ onSuccess, onFail });
}

function onRefreshed(newToken) {
  refreshSubscribers.forEach(({ onSuccess }) => onSuccess(newToken));
  refreshSubscribers = [];
}

function onRefreshFailed(error) {
  refreshSubscribers.forEach(({ onFail }) => onFail(error));
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

      // Request lain akan menunggu ketika proses refresh sedang berjalan.
      // Setelah token baru diterima, request yang menunggu akan dijalankan kembali.
      // Cara ini mencegah banyak request refresh berjalan secara bersamaan.
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(
            (newToken) => {
              originalRequest._retry = true;
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            },
            (refreshError) => reject(refreshError),
          );
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // refresh_token tidak dikirim melalui body karena berada di httpOnly cookie.
        // Backend akan membaca cookie tersebut dan mengembalikan access_token baru.
        // withCredentials diperlukan agar cookie ikut dikirim dan cookie hasil rotasi diterima.
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
        onRefreshFailed(refreshError);

        authStore.clearSession();

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
