import { reactive, ref } from "vue";
import axios from "axios";
import api from "@/js/api";
import { useAuthStore } from "@/stores/auth";

// Composable terpisah untuk modal Export PO (GET /api/po/export) - independen
// dari usePurchaseOrders() supaya bisa dipakai ulang di halaman lain kalau perlu.
export function useExportPO() {
  const showExportModal = ref(false);
  const exporting = ref(false);
  const exportError = ref("");
  const lastCacheStatus = ref(""); // 'HIT' | 'MISS' - info dari header X-Export-Cache

  const exportFilters = reactive({
    start_date: "",
    end_date: "",
    division: "",
    status: "all",
    region: "",
    client: "",
  });

  const divisionOptions = ref([]);
  const regionOptions = ref([]);

  // ── Client search (debounced), pola sama seperti pencarian client di form PO ──
  const clientKeyword = ref("");
  const clientOptions = ref([]);
  const clientSearchLoading = ref(false);
  let clientSearchTimeout = null;

  function onClientKeywordInput(event) {
    const keyword = event.target.value;
    clientKeyword.value = keyword;
    clearTimeout(clientSearchTimeout);

    if (exportFilters.client) exportFilters.client = "";

    if (!keyword) {
      clientOptions.value = [];
      return;
    }
    clientSearchTimeout = setTimeout(async () => {
      clientSearchLoading.value = true;
      try {
        const res = await api.get("/clients/select", { params: { keyword } });
        clientOptions.value = res.data ?? [];
      } catch {
        clientOptions.value = [];
      } finally {
        clientSearchLoading.value = false;
      }
    }, 400);
  }

  function selectExportClient(client) {
    exportFilters.client = client.client_id;
    clientKeyword.value = client.client_name;
    clientOptions.value = [];
  }

  function clearExportClient() {
    exportFilters.client = "";
    clientKeyword.value = "";
    clientOptions.value = [];
  }

  async function fetchExportFormOptions() {
    try {
      const [divisionRes, regionRes] = await Promise.all([
        api.get("/divisions/select"),
        api.get("/regions/select"),
      ]);
      divisionOptions.value = divisionRes.data ?? [];
      regionOptions.value = regionRes.data ?? [];
    } catch {
      divisionOptions.value = [];
      regionOptions.value = [];
    }
  }

  // prefill opsional: isi otomatis dari filter tabel yang sedang aktif saat
  // tombol Export diklik, supaya user tidak perlu isi ulang dari nol.
  function openExportModal(prefill = {}) {
    exportError.value = "";
    lastCacheStatus.value = "";
    exportFilters.start_date = prefill.start_date ?? "";
    exportFilters.end_date = prefill.end_date ?? "";
    exportFilters.division = "";
    // Tab default tabel adalah "open", tapi untuk export defaultnya "all"
    // kecuali user memang sedang browsing di tab status selain open.
    exportFilters.status =
      prefill.status && prefill.status !== "open" ? prefill.status : "all";
    exportFilters.region = prefill.region ?? "";
    clearExportClient();
    fetchExportFormOptions();
    showExportModal.value = true;
  }

  function closeExportModal() {
    if (exporting.value) return;
    showExportModal.value = false;
  }

  function resetExportFilters() {
    exportFilters.start_date = "";
    exportFilters.end_date = "";
    exportFilters.division = "";
    exportFilters.status = "all";
    exportFilters.region = "";
    clearExportClient();
  }

  // Ekstrak nama file dari header Content-Disposition backend, fallback ke nama
  // default kalau header tidak ada.
  function extractFilename(disposition, fallback) {
    if (!disposition) return fallback;
    const match = disposition.match(/filename="?([^";]+)"?/i);
    return match ? match[1] : fallback;
  }

  async function submitExport() {
    exportError.value = "";
    exporting.value = true;
    try {
      const params = {};
      if (exportFilters.start_date)
        params.start_date = exportFilters.start_date;
      if (exportFilters.end_date) params.end_date = exportFilters.end_date;
      if (exportFilters.division) params.division = exportFilters.division;
      if (exportFilters.status) params.status = exportFilters.status;
      if (exportFilters.region) params.region = exportFilters.region;
      if (exportFilters.client) params.client = exportFilters.client;

      // Sengaja TIDAK pakai instance `api` di sini. Interceptor response global
      // pada `api.js` melakukan `(response) => response.data`, jadi untuk request
      // biasa (JSON) itu artinya composable lain menerima body JSON secara
      // langsung. Tapi untuk request blob ini, itu berarti hasil `await api.get()`
      // BUKAN AxiosResponse lagi - dia sudah jadi Blob itu sendiri. Kode yang lama
      // mengakses `res.data` (undefined, karena Blob tidak punya field .data) dan
      // `res.headers` (undefined juga) - itulah sebabnya file yang ter-download
      // isinya literal teks "undefined". Pakai axios langsung supaya
      // AxiosResponse penuh (res.data = Blob, res.headers = header asli) tetap utuh.
      const authStore = useAuthStore();
      const res = await axios.get(`${api.defaults.baseURL}/po/export`, {
        params,
        responseType: "blob",
        withCredentials: true,
        headers: authStore.accessToken
          ? { Authorization: `Bearer ${authStore.accessToken}` }
          : {},
      });

      lastCacheStatus.value = res.headers?.["x-export-cache"] ?? "";

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const filename = extractFilename(
        res.headers?.["content-disposition"],
        `PO_Export_${Date.now()}.xlsx`,
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showExportModal.value = false;
      return true;
    } catch (err) {
      // Dengan responseType: 'blob', axios TETAP mengirim error body sebagai Blob
      // (bukan JSON) walau server balas 403/500 dengan JSON - harus di-parse manual,
      // kalau tidak pesan error yang tampil cuma "[object Blob]".
      if (err.response?.status === 401) {
        // Request export pakai axios langsung (lihat komentar di atas), jadi
        // tidak melewati interceptor auto-refresh token milik instance `api`.
        exportError.value =
          "Sesi login sudah berakhir, silakan muat ulang halaman lalu coba lagi";
      } else if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          exportError.value = parsed.message || "Gagal membuat file export";
        } catch {
          exportError.value = "Gagal membuat file export";
        }
      } else {
        exportError.value =
          err.response?.data?.message || "Gagal membuat file export";
      }
      return false;
    } finally {
      exporting.value = false;
    }
  }

  return {
    showExportModal,
    exporting,
    exportError,
    lastCacheStatus,
    exportFilters,
    divisionOptions,
    regionOptions,
    clientKeyword,
    clientOptions,
    clientSearchLoading,
    onClientKeywordInput,
    selectExportClient,
    clearExportClient,
    resetExportFilters,
    openExportModal,
    closeExportModal,
    submitExport,
  };
}
