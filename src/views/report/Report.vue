<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import Table from "@/components/ui/Table.vue";
import Card from "@/components/ui/CardList.vue";
import { useReports } from "@/composables/report/useReport";
import { useChart } from "@/composables/report/useChart";
import { formatCurrency, formatDate } from "@/composables/po/usePO";
import DateRange from "@/components/ui/DateRange.vue";

const {
  chartData,
  monthlyChartData,
  barData,
  statsData,
  regionOptions,
  yearOptions,
  loading,
  error,
  filters,
  summary,
  totalPoAllRegion,
  fetchAll,
  fetchReportChart,
  fetchReportBars,
  fetchRegionOptions,
  fetchReportYears,
} = useReports();

// region & status tersimpan langsung di filters composable,
// sehingga otomatis masuk ke query params saat fetchReportChart dipanggil.

// ── Chart date/year filter (khusus trend chart, trigger refetch, saling eksklusif) ──
const chartDateError = ref("");
const chartRange = ref(null); // { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' } | null

function onChartRangeChange(val) {
  chartRange.value = val;
  if (!val) {
    filters.start_date = "";
    filters.end_date = "";
    return;
  }
  filters.year = ""; // date range dipilih → lepas filter tahun
  filters.start_date = val.start;
  filters.end_date = val.end;
}

function onChartYearChange(e) {
  const val = e.target.value;
  filters.year = val;
  if (val) {
    // tahun dipilih → lepas filter date range
    chartRange.value = null;
    filters.start_date = "";
    filters.end_date = "";
  }
}

// Computed agar isDateFiltered tetap bisa pakai chartRange
const chartStartDate = computed(() => chartRange.value?.start ?? "");
const chartEndDate = computed(() => chartRange.value?.end ?? "");

// Refetch chart setiap kali salah satu filter chart berubah.
// Date: hanya fetch jika kedua tanggal terisi (atau keduanya kosong = reset).
// Year/region/status: fetch langsung tanpa syarat tanggal.
watch(
  () => [filters.start_date, filters.end_date],
  ([start, end]) => {
    if ((start && end) || (!start && !end)) fetchReportChart();
  },
);

watch(
  () => [filters.year, filters.region, filters.status],
  () => {
    fetchReportChart();
  },
);

// ── Trend Chart ──────────────────────────────────────────────────────────────
// Mode otomatis:
//   - Filter aktif (kedua tanggal terisi) → per tanggal (chartData)
//   - Tidak difilter                       → per bulan  (monthlyChartData)
const isDateFiltered = computed(
  () => !!chartStartDate.value && !!chartEndDate.value,
);

const trendCanvas = ref(null);
const trendChartConfig = computed(() => {
  // Data sumber sesuai mode
  const daily = chartData.value; // [{ date, total }]
  const monthly = monthlyChartData.value; // [{ key, label, total, days[] }]

  const labels = isDateFiltered.value
    ? daily.map((d) => formatDate(d.date))
    : monthly.map((d) => d.label);

  const values = isDateFiltered.value
    ? daily.map((d) => d.total)
    : monthly.map((d) => d.total);

  return {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Jumlah PO",
          data: values,
          borderColor: "#01D2B1",
          backgroundColor: "rgba(1, 210, 177, 0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => labels[items[0].dataIndex] ?? "",
            label: (item) => `Total: ${item.raw} PO`,
            // Mode bulanan: tampilkan detail per tanggal dalam bulan
            afterBody: isDateFiltered.value
              ? undefined
              : (items) => {
                  const days = monthly[items[0].dataIndex]?.days ?? [];
                  return days.map(
                    (d) => `  ${formatDate(d.date)}: ${d.total} PO`,
                  );
                },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            autoSkip: false, // semua tick tetap ada (grid line tiap hari), yang di-skip hanya teks labelnya
            maxRotation: 45,
            minRotation: 0,
            callback: (value, index) => {
              // Tampilkan label hanya tiap N titik, sisanya dikosongkan agar tidak berdesakan.
              // Grid line & titik tetap digambar untuk semua index karena tick-nya tidak dihapus.
              const total = labels.length;
              const step = Math.max(1, Math.ceil(total / 12)); // ≈ 12 label tampil sekaligus
              return index % step === 0 ? labels[index] : "";
            },
          },
        },
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  };
});
useChart(trendCanvas, trendChartConfig);

// ── Region Bar Chart ──────────────────────────────────
const barDateError = ref("");
const barRange = ref(null);
const barYear = ref("");
const barStatus = ref("");

function buildBarParams() {
  const params = {};
  if (barRange.value) {
    params.start_date = barRange.value.start;
    params.end_date = barRange.value.end;
  } else if (barYear.value) {
    params.year = barYear.value;
  }
  if (barStatus.value) params.status = barStatus.value;
  return params;
}

function onBarRangeChange(val) {
  barRange.value = val;
  if (val) barYear.value = ""; // date range dipilih → lepas filter tahun
  fetchReportBars({ params: buildBarParams() });
}

function onBarYearChange(e) {
  barYear.value = e.target.value;
  if (barYear.value) barRange.value = null; // tahun dipilih → lepas date range
  fetchReportBars({ params: buildBarParams() });
}

watch(barStatus, () => {
  fetchReportBars({ params: buildBarParams() });
});

watch(barRange, (val) => {
  if (!val) fetchReportBars({ params: buildBarParams() });
});

const barCanvas = ref(null);
const barChartConfig = computed(() => ({
  type: "bar",
  data: {
    labels: barData.value.map((d) => d.region_title),
    datasets: [
      {
        label: "Total Amount",
        data: barData.value.map((d) => d.total_amount),
        backgroundColor: "#01D2B1",
        borderRadius: 6,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => formatCurrency(v) } },
    },
  },
}));
useChart(barCanvas, barChartConfig);

// ── Status Table ──────────────────────────────────────
const statusColumns = [
  { key: "region_title", label: "Region", class: "text-left" },
  { key: "total_open", label: "Open" },
  { key: "total_prepared", label: "Prepared" },
  { key: "total_progress", label: "Progress" },
  { key: "total_complete", label: "Complete" },
  { key: "total_cancel", label: "Cancel" },
  { key: "total_po", label: "Total" },
];

onMounted(fetchAll);
</script>

<template>
  <div>
    <h1 class="mb-6 text-2xl font-semibold text-slate-800">
      Report Purchase Order
    </h1>

    <!-- Summary + Trend Chart -->
    <div class="rounded-md bg-white p-4 shadow-sm sm:p-6">
      <div
        class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      >
        <h2 class="text-base font-semibold text-slate-800">
          Purchase Order Summary
        </h2>

        <!-- Filter bar -->
        <div class="flex flex-col gap-2">
          <div
            class="flex flex-col gap-2 sm:flex-row xs:flex-wrap xs:items-center"
          >
            <DateRange
              class="w-full sm:w-52 sm:shrink-0"
              :model-value="chartRange"
              :error="chartDateError"
              placeholder="Date Range Filter"
              @update:model-value="onChartRangeChange"
              @error="chartDateError = $event"
            />
            <select
              :value="filters.year"
              class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:border-teal-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300 xs:w-auto"
              :disabled="
                !!(chartRange || (filters.start_date && filters.end_date))
              "
              @focus="fetchReportYears"
              @change="onChartYearChange"
            >
              <option value="">All Years</option>
              <option v-for="y in yearOptions" :key="y" :value="y">
                {{ y }}
              </option>
            </select>
            <select
              v-model="filters.region"
              class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:border-teal-400 focus:outline-none xs:w-auto"
              @focus="fetchRegionOptions"
            >
              <option value="">All Regions</option>
              <option
                v-for="region in regionOptions"
                :key="region.id"
                :value="region.id"
              >
                {{ region.title }}
              </option>
            </select>
            <select
              v-model="filters.status"
              class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:border-teal-400 focus:outline-none xs:w-auto"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="progress">Progress</option>
              <option value="prepared">Prepared</option>
              <option value="complete">Complete</option>
              <option value="cancel">Cancel</option>
            </select>
          </div>
          <p v-if="chartDateError" class="text-xs text-red-500">
            {{ chartDateError }}
          </p>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="rounded-xl border border-slate-100 p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-slate-400">
            Highest PO
          </p>
          <p class="mt-2 text-2xl font-bold text-slate-800">
            {{ summary.highest ? `${summary.highest.total}` : "-" }}
          </p>
          <p class="mt-1 text-xs text-slate-400">
            {{ summary.highest ? formatDate(summary.highest.date) : "-" }}
          </p>
        </div>

        <div class="rounded-xl border border-slate-100 p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-slate-400">
            Lowest PO
          </p>
          <p class="mt-2 text-2xl font-bold text-slate-800">
            {{ summary.lowest ? `${summary.lowest.total}` : "-" }}
          </p>
          <p class="mt-1 text-xs text-slate-400">
            {{ summary.lowest ? formatDate(summary.lowest.date) : "-" }}
          </p>
        </div>

        <div class="rounded-xl border border-slate-100 p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-slate-400">
            Average PO
          </p>
          <p class="mt-2 text-2xl font-bold text-slate-800">
            {{ Math.round(summary.average) }}
          </p>
          <p class="mt-1 text-xs text-slate-400">
            Per Hari &middot; {{ totalPoAllRegion }} Total PO
          </p>
        </div>
      </div>

      <!-- Trend Chart -->
      <h3 class="mb-4 text-sm font-semibold text-slate-700">
        Total Purchase Order Trend
      </h3>
      <div
        v-if="loading"
        class="flex h-72 items-center justify-center text-sm text-slate-400"
      >
        Load data...
      </div>
      <div
        v-else-if="error"
        class="flex h-72 items-center justify-center text-sm text-red-500"
      >
        {{ error }}
      </div>
      <div
        v-else-if="chartData.length === 0"
        class="flex h-72 items-center justify-center text-sm text-slate-400"
      >
        No data
      </div>
      <div v-else class="relative h-56 sm:h-72">
        <canvas ref="trendCanvas" />
      </div>
    </div>

    <!-- Region Bar Chart -->
    <div class="mt-6 rounded-md bg-white p-4 shadow-sm sm:p-6">
      <div
        class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      >
        <h2 class="text-base font-semibold text-slate-800">
          Region Report Summary
        </h2>
        <div class="flex flex-col gap-2">
          <div
            class="flex flex-col gap-2 sm:flex-row xs:flex-wrap xs:items-center"
          >
            <DateRange
              class="w-full sm:w-52 sm:shrink-0"
              :model-value="barRange"
              :error="barDateError"
              placeholder="Date Range Filter"
              @update:model-value="onBarRangeChange"
              @error="barDateError = $event"
            />
            <select
              :value="barYear"
              class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:border-teal-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300 xs:w-auto"
              :disabled="!!barRange"
              @focus="fetchReportYears"
              @change="onBarYearChange"
            >
              <option value="">All Years</option>
              <option v-for="y in yearOptions" :key="y" :value="y">
                {{ y }}
              </option>
            </select>
            <select
              v-model="barStatus"
              class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:border-teal-400 focus:outline-none xs:w-auto"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="progress">Progress</option>
              <option value="prepared">Prepared</option>
              <option value="complete">Complete</option>
              <option value="cancel">Cancel</option>
            </select>
          </div>
          <p v-if="barDateError" class="text-xs text-red-500">
            {{ barDateError }}
          </p>
        </div>
      </div>

      <div
        v-if="loading"
        class="flex h-64 items-center justify-center text-sm text-slate-400"
      >
        Load data...
      </div>
      <div
        v-else-if="error"
        class="flex h-64 items-center justify-center text-sm text-red-500"
      >
        {{ error }}
      </div>
      <div
        v-else-if="barData.length === 0"
        class="flex h-64 items-center justify-center text-sm text-slate-400"
      >
        No data
      </div>
      <div v-else class="relative h-56 sm:h-64">
        <canvas ref="barCanvas" />
      </div>
    </div>

    <!-- Status Table -->
    <div class="mt-6 rounded-md bg-white shadow-sm">
      <div class="p-4 pb-0 sm:p-6 sm:pb-0">
        <h2 class="text-base font-semibold text-slate-800 mb-5">
          Status Purchase Order Report
        </h2>
      </div>

      <!-- MOBILE: card list (replaces table below sm), driven by the same statusColumns/statsData as the Table -->
      <div class="p-4 sm:hidden">
        <Card
          :columns="statusColumns"
          :rows="statsData"
          :loading="loading"
          :error="error"
          row-key="region_id"
          title-key="region_title"
          empty-message="Belum ada data laporan"
        >
          <template #region_title="{ row }">
            {{ row.region_title }}
          </template>
          <template #total_complete="{ row }">
            <span class="font-semibold text-teal-600">{{
              row.total_complete
            }}</span>
          </template>
          <template #total_cancel="{ row }">
            <span class="font-semibold text-red-500">{{
              row.total_cancel
            }}</span>
          </template>
          <template #total_po="{ row }">
            <span class="font-semibold text-slate-800">{{ row.total_po }}</span>
          </template>
        </Card>
      </div>

      <!-- DESKTOP/TABLET: table (sm and up) -->
      <div class="hidden sm:block">
        <Table
          :columns="statusColumns"
          :rows="statsData"
          :loading="loading"
          :error="error"
          row-key="region_id"
          empty-message="Belum ada data laporan"
        >
          <template #region_title="{ row }">
            <span class="font-medium text-slate-700">{{
              row.region_title
            }}</span>
          </template>
          <template #total_complete="{ row }">
            <span class="font-semibold text-teal-600">{{
              row.total_complete
            }}</span>
          </template>
          <template #total_cancel="{ row }">
            <span class="font-semibold text-red-500">{{
              row.total_cancel
            }}</span>
          </template>
          <template #total_po="{ row }">
            <span class="font-semibold text-slate-800">{{ row.total_po }}</span>
          </template>
        </Table>
      </div>

      <div
        v-if="statsData.length"
        class="flex items-center justify-between border-t border-slate-100 px-4 py-4 sm:px-6"
      >
        <span class="text-sm font-medium text-slate-500">Total</span>
        <span class="text-sm font-semibold text-orange-500">{{
          totalPoAllRegion
        }}</span>
      </div>
    </div>
  </div>
</template>
