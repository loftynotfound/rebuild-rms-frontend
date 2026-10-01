import { ref, reactive, computed } from "vue";
import api from "@/js/api";

// Status tab sesuai endpoint GET /api/po (param `status`)
export const PO_STATUS_TABS = [
  { key: "open", label: "Open" },
  { key: "prepared", label: "Prepared" },
  { key: "progress", label: "In Progress" },
  { key: "complete", label: "Completed" },
  { key: "cancel", label: "Canceled" },
];

// Formatter native Intl — dibuat sekali di module scope, dipakai oleh formatCurrency/formatDate
const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return "-";
  return currencyFormatter.format(Number(value));
}

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return dateFormatter.format(date);
}

export function formatProductNames(productNames) {
  if (!productNames || productNames.length === 0) return "-";
  return productNames[0]?.trim() || "-";
}

export function usePurchaseOrders(initialStatus) {
  const rows = ref([]);
  const loading = ref(false);
  const error = ref("");

  // Badge total per status, diisi dari GET /api/po/total
  const totalByStatus = reactive({
    open: 0,
    progress: 0,
    prepared: 0,
    complete: 0,
    cancel: 0,
  });

  const filters = reactive({
    status: initialStatus ?? "open",
    keyword: "",
    region: "",
    start_date: "",
    end_date: "",
    sortby: "new",
    page: 1,
    item: 10,
  });

  const pagination = reactive({
    page: 1,
    totalPage: 1,
    totalData: 0,
  });

  // Opsi filter region, diisi dari GET /api/regions/select
  const regionOptions = ref([]);

  const query = computed(() => {
    // Hanya kirim param yang terisi agar query string bersih
    const params = {
      page: filters.page,
      item: filters.item,
      status: filters.status,
    };
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.region) params.region = filters.region;
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (filters.sortby) params.sortby = filters.sortby;
    return params;
  });

  async function fetchPurchaseOrders() {
    loading.value = true;
    error.value = "";

    try {
      const res = await api.get("/po", { params: query.value });
      rows.value = res.data ?? [];
      pagination.page = res.meta?.page ?? filters.page;
      pagination.totalPage = res.meta?.total_page ?? 1;
      pagination.totalData = res.meta?.total_data ?? 0;
    } catch (err) {
      error.value =
        err.response?.data?.message || "Gagal memuat data Purchase Order";
      rows.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchTotalByStatus() {
    try {
      const params = {};
      if (filters.region) params.region = filters.region;
      if (filters.keyword) params.keyword = filters.keyword;

      const res = await api.get("/po/total", { params });
      const data = res.data ?? {};
      totalByStatus.open = data.open ?? 0;
      totalByStatus.progress = data.progress ?? 0;
      totalByStatus.prepared = data.prepared ?? 0;
      totalByStatus.complete = data.complete ?? 0;
      totalByStatus.cancel = data.cancel ?? 0;
    } catch {
      // Badge total bukan data kritikal, gagal diam-diam agar tidak menutupi tabel utama
    }
  }

  // Lazy-load: dipanggil saat dropdown filter region difokuskan pertama kali,
  // bukan saat halaman list PO mount.
  async function fetchRegionOptions() {
    if (regionOptions.value.length > 0) return;
    try {
      const res = await api.get("/regions/select");
      regionOptions.value = res.data ?? [];
    } catch {
      regionOptions.value = [];
    }
  }

  function setStatus(status) {
    if (filters.status === status) return;
    filters.status = status;
    filters.page = 1;
    fetchPurchaseOrders();
  }

  function setPage(page) {
    filters.page = page;
    fetchPurchaseOrders();
  }

  function applyFilters(partial) {
    Object.assign(filters, partial, { page: 1 });
    fetchPurchaseOrders();
    fetchTotalByStatus();
  }

  return {
    rows,
    loading,
    error,
    filters,
    pagination,
    totalByStatus,
    regionOptions,
    fetchPurchaseOrders,
    fetchTotalByStatus,
    fetchRegionOptions,
    setStatus,
    setPage,
    applyFilters,
  };
}
