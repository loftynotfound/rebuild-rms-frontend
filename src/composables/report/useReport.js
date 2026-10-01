import { ref, reactive, computed } from "vue";
import api from "@/js/api";

export function useReports() {
  const chartData = ref([]); // [{ date, total }] - jumlah PO per hari
  const barData = ref([]); // [{ region_id, region_title, total_amount }]
  const statsData = ref([]); // [{ region_id, region_title, total_open, total_prepared, total_progress, total_complete, total_cancel, total_po }]
  const regionOptions = ref([]); // [{ id, title }] - untuk dropdown filter region
  const yearOptions = ref([]); // [number] - untuk dropdown filter tahun
  const activeChartYear = ref(null); // tahun yang benar-benar dipakai backend untuk /reports/chart (echo dari response, termasuk saat fallback ke latest year)
  const activeBarYear = ref(null); // tahun yang benar-benar dipakai backend untuk /reports/bars

  const loading = ref(false);
  const error = ref("");

  const filters = reactive({
    start_date: "",
    end_date: "",
    year: "",
    region: "",
    status: "",
  });

  // start_date/end_date dan year saling eksklusif — date range menang jika keduanya terisi.
  const query = computed(() => {
    const params = {};
    if (filters.start_date && filters.end_date) {
      params.start_date = filters.start_date;
      params.end_date = filters.end_date;
    } else if (filters.year) {
      params.year = filters.year;
    }
    if (filters.region) params.region = filters.region;
    if (filters.status) params.status = filters.status;
    return params;
  });

  // Ringkasan jumlah PO tertinggi/terendah/rata-rata per hari,
  // dihitung dari total (/api/reports/chart) — jumlah PO yang dibuat per tanggal.
  const summary = computed(() => {
    if (!chartData.value.length) {
      return { highest: null, lowest: null, average: 0 };
    }

    const highest = chartData.value.reduce((a, b) =>
      b.total > a.total ? b : a,
    );
    const lowest = chartData.value.reduce((a, b) =>
      b.total < a.total ? b : a,
    );
    const total = chartData.value.reduce((sum, d) => sum + d.total, 0);

    return { highest, lowest, average: total / chartData.value.length };
  });

  const totalPoAllRegion = computed(() =>
    statsData.value.reduce((sum, r) => sum + r.total_po, 0),
  );

  // Group data harian menjadi per bulan, selalu 12 bulan penuh (Jan-Des)
  // untuk tahun yang datanya ada — bulan tanpa transaksi diisi `total: null`
  // (bukan 0) supaya Chart.js menggambar garis terputus di bulan kosong,
  // bukan seolah-olah 0 transaksi.
  const monthlyChartData = computed(() => {
    if (chartData.value.length === 0) return [];

    // Kumpulkan total & daftar hari per bulan yang benar-benar ada datanya
    const map = new Map();
    chartData.value.forEach((d) => {
      const date = new Date(d.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!map.has(key)) map.set(key, { total: 0, days: [] });
      const entry = map.get(key);
      entry.total += d.total;
      entry.days.push({ date: d.date, total: d.total });
    });

    // Tentukan tahun yang dipakai dari data pertama (asumsi 1 tahun per view)
    const year = new Date(chartData.value[0].date).getFullYear();

    return Array.from({ length: 12 }, (_, i) => {
      const key = `${year}-${String(i + 1).padStart(2, "0")}`;
      const label = new Date(year, i, 1).toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric",
      });
      const entry = map.get(key);

      return {
        key,
        label,
        total: entry ? entry.total : 0,
        days: entry ? entry.days : [],
      };
    });
  });

  async function fetchReportChart() {
    const res = await api.get("/reports/chart", { params: query.value });
    chartData.value = res.data?.data ?? [];
    activeChartYear.value = res.data?.year ?? null;
  }

  async function fetchReportBars(overrideParams = null) {
    const params = overrideParams ?? { params: query.value };
    const res = await api.get("/reports/bars", params);
    barData.value = res.data?.data ?? [];
    activeBarYear.value = res.data?.year ?? null;
  }

  async function fetchReportStats() {
    const res = await api.get("/reports/stats");
    statsData.value = res.data ?? [];
  }

  // Lazy load, hanya fetch sekali (cache guard) — dipanggil saat dropdown di-focus/klik.
  async function fetchRegionOptions() {
    if (regionOptions.value.length > 0) return;
    const res = await api.get("/regions/select");
    regionOptions.value = (res.data ?? []).map((r) => ({
      id: r.region_id,
      title: r.region_title,
    }));
  }

  // Lazy load, hanya fetch sekali (cache guard) — dipanggil saat dropdown di-focus/klik.
  async function fetchReportYears() {
    if (yearOptions.value.length > 0) return;
    const res = await api.get("/reports/years");
    yearOptions.value = res.data?.years ?? [];
  }

  async function fetchAll() {
    loading.value = true;
    error.value = "";

    try {
      await Promise.all([
        fetchReportChart(),
        fetchReportBars(),
        fetchReportStats(),
      ]);
    } catch (err) {
      error.value = err.response?.data?.message || "Gagal memuat data laporan";
    } finally {
      loading.value = false;
    }
  }

  return {
    chartData,
    monthlyChartData, // ← exported
    barData,
    statsData,
    regionOptions,
    yearOptions,
    activeChartYear,
    activeBarYear,
    loading,
    error,
    filters,
    summary,
    totalPoAllRegion,
    fetchAll,
    fetchReportChart, // ← exported agar bisa di-call ulang dari komponen saat filter chart berubah
    fetchReportBars, // ← exported agar bisa di-call ulang dengan filter date bar chart
    fetchRegionOptions, // ← exported agar bisa di-call saat dropdown region difokus/diklik
    fetchReportYears, // ← exported agar bisa di-call saat dropdown tahun difokus/diklik
  };
}
