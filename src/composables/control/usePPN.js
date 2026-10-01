import { ref } from "vue";
import api from "@/js/api";

/**
 * Composable untuk mengelola data PPN Default.
 * Endpoint sesuai dokumentasi backend (section 4.4):
 * - GET  /api/ppn/current  -> tarif PPN yang sedang berlaku
 * - POST /api/ppn          -> buat tarif PPN baru (butuh akses edit_ppn)
 *
 * Catatan: instance `api` sudah unwrap response ke `response.data` lewat
 * interceptor, jadi hasil request di sini langsung berupa body JSON
 * (mis. { success, message, data, meta }).
 * Field nilai PPN dari backend bernama `ppn_value`, bukan `value`.
 */
export function usePpn() {
  const ppnValue = ref(0);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref("");

  async function fetchCurrent() {
    loading.value = true;
    error.value = "";
    try {
      const res = await api.get("/ppn/current");
      ppnValue.value = res?.data?.ppn_value ?? 0;
    } catch (err) {
      error.value = err?.response?.data?.message || "Gagal memuat data PPN.";
    } finally {
      loading.value = false;
    }
  }

  async function save(value) {
    saving.value = true;
    error.value = "";
    try {
      await api.post("/ppn", { value });
      ppnValue.value = value;
      return true;
    } catch (err) {
      error.value = err?.response?.data?.message || "Gagal menyimpan PPN.";
      return false;
    } finally {
      saving.value = false;
    }
  }

  return {
    ppnValue,
    loading,
    saving,
    error,
    fetchCurrent,
    save,
  };
}
