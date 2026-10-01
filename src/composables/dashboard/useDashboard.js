import { ref, computed, onMounted } from "vue";
import api from "@/js/api"; // axios instance dengan interceptor auth & token refresh

export function useDashboard() {
  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);

  async function fetchDashboard() {
    loading.value = true;
    error.value = null;

    try {
      // Response interceptor sudah unwrap ke response.data,
      // jadi yang kembali langsung objek { success, message, data }
      const json = await api.get("/dashboard");

      data.value = json.data;
    } catch (err) {
      // Axios melempar error untuk status non-2xx;
      // clearSession sudah ditangani interceptor saat refresh gagal
      error.value =
        err.response?.data?.message || err.message || "Terjadi kesalahan";
    } finally {
      loading.value = false;
    }
  }

  const totalPO = computed(() => {
    if (!data.value) return 0;

    return (
      (data.value.total_open ?? 0) +
      (data.value.total_progress ?? 0) +
      (data.value.total_prepared ?? 0) +
      (data.value.total_complete ?? 0) +
      (data.value.total_cancel ?? 0)
    );
  });

  const statusCards = computed(() => {
    if (!data.value) return [];

    return [
      {
        label: "Open",
        key: "open", // cocok dengan filters.status di usePO.js — dipakai untuk link ke /po?status=open
        value: data.value.total_open ?? 0,
        accent: "#01DEBB",
        iconBg: "#E3F7F3",
      },
      {
        label: "Prepared",
        key: "prepared",
        value: data.value.total_prepared ?? 0,
        accent: "#F89C0E",
        iconBg: "#FDF1E3",
      },
      {
        label: "In Progress",
        key: "progress",
        value: data.value.total_progress ?? 0,
        accent: "#CF4AA3",
        iconBg: "#FCEAF6",
      },
      {
        label: "Completed",
        key: "complete",
        value: data.value.total_complete ?? 0,
        accent: "#03B864",
        iconBg: "#E4F7EE",
      },
      {
        label: "Canceled",
        key: "cancel",
        value: data.value.total_cancel ?? 0,
        accent: "#E14F4F",
        iconBg: "#FBE9E9",
      },
      {
        label: "Paid",
        key: null, // bukan status tab PO (field po_paid, bukan filters.status) — card ini tidak diklik
        value: data.value.total_paid ?? 0, // field belum ada di response — tampil 0
        accent: "#4C7AEF",
        iconBg: "#EAF0FE",
      },
    ];
  });

  const recentOpenPO = computed(() => data.value?.recent_open_po ?? []);

  onMounted(fetchDashboard);

  return {
    loading,
    error,
    totalPO,
    statusCards,
    recentOpenPO,
    refresh: fetchDashboard,
  };
}
