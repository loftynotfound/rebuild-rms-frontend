import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "../js/api";

export const useAuthStore = defineStore("auth", () => {
  // access_token & admin HANYA di memori — TIDAK PERNAH disimpan ke localStorage.
  // refresh_token TIDAK disentuh JS sama sekali — dikelola backend via httpOnly cookie.
  const accessToken = ref(null);
  const admin = ref(null);

  const isAuthenticated = computed(() => !!accessToken.value);

  function hasAccess(slug) {
    return admin.value?.role?.access_slugs?.includes(slug) ?? false;
  }

  // payload = { access_token, token_type, expires_in, admin }
  // (ini adalah field "data" dari APIResponse backend)
  function setSession(payload) {
    accessToken.value = payload.access_token;
    admin.value = payload.admin ?? admin.value;
  }

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    // res = APIResponse { success, message, data }
    // response interceptor sudah unwrap axios envelope, jadi res.data = field "data"
    setSession(res.data);
    await fetchMe();
    return res.data;
  }

  async function fetchMe() {
    const meRes = await api.get("/auth/me");
    const adminData = meRes.data; // { admin_id, email, role_id }

    const accessRes = await api.get("/access/mine");
    const accessSlugs = accessRes.data?.access_slugs ?? [];

    adminData.role = {
      access_slugs: accessSlugs,
    };

    admin.value = adminData;
    return adminData;
  }

  async function logout() {
    try {
      // Cookie refresh_token terkirim otomatis, backend baca dari sana.
      await api.post("/auth/logout");
    } finally {
      clearSession();
    }
  }

  function clearSession() {
    accessToken.value = null;
    admin.value = null;
  }

  // Dipanggil sekali di main.js sebelum app mount.
  // Langsung coba refresh — browser otomatis kirim cookie refresh_token kalau ada.

  // Menandai apakah proses restore session (refresh token) sudah PERNAH dicoba,
  // sekali saja per lifecycle app. Dipakai oleh navigation guard di router.js
  // supaya tidak memanggil /auth/refresh berulang kali di setiap navigasi.
  const sessionRestored = ref(false);

  async function restoreSession() {
    try {
      const res = await api.post("/auth/refresh");
      accessToken.value = res.data.access_token;
      await fetchMe();
    } catch {
      clearSession();
    } finally {
      sessionRestored.value = true;
    }
  }

  return {
    admin,
    accessToken,
    isAuthenticated,
    sessionRestored,
    hasAccess,
    login,
    fetchMe,
    logout,
    clearSession,
    restoreSession,
  };
});
