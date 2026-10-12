<script setup>
import { ref, computed, onMounted } from "vue";
import Table from "@/components/ui/Table.vue";
import DateRange from "@/components/ui/DateRange.vue";
import { usePaymentRequest } from "@/composables/paymentRequest/usePaymentRequest";
import { useChart } from "@/composables/report/useChart";

const { STATUS, money, date, requests, fetchRequests, listLoading, listError } =
  usePaymentRequest();

const range = ref(null);
const rangeError = ref("");
const year = ref("");
const status = ref("");
const responsible = ref("");

const selectClass =
  "w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:border-teal-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300 xs:w-auto";

const dayOf = (item) => String(item.prCreateDate ?? "").slice(0, 10);

const yearOptions = computed(() =>
  [
    ...new Set(
      requests.value.map((item) => dayOf(item).slice(0, 4)).filter(Boolean),
    ),
  ]
    .sort()
    .reverse(),
);

const responsibleOptions = computed(() =>
  [
    ...new Set(
      requests.value.map((item) => item.responsibleName).filter(Boolean),
    ),
  ].sort(),
);

function onRangeChange(value) {
  range.value = value;
  if (value) year.value = "";
}

function onYearChange(event) {
  year.value = event.target.value;
  if (year.value) range.value = null;
}

const filtered = computed(() =>
  requests.value.filter((item) => {
    const day = dayOf(item);

    if (range.value && (day < range.value.start || day > range.value.end))
      return false;
    if (!range.value && year.value && !day.startsWith(year.value)) return false;
    if (status.value && item.prStatus !== status.value) return false;
    if (responsible.value && item.responsibleName !== responsible.value)
      return false;

    return true;
  }),
);

const dailyData = computed(() => {
  const map = new Map();

  filtered.value.forEach((item) => {
    const day = dayOf(item);
    if (!day) return;
    map.set(day, (map.get(day) ?? 0) + 1);
  });

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, total]) => ({ day, total }));
});

const monthlyData = computed(() => {
  const map = new Map();

  dailyData.value.forEach(({ day, total }) => {
    const key = day.slice(0, 7);
    map.set(key, (map.get(key) ?? 0) + total);
  });

  return [...map.entries()].map(([key, total]) => ({
    key,
    total,
    label: new Date(`${key}-01`).toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
    }),
  }));
});

const summary = computed(() => {
  if (!dailyData.value.length) {
    return { highest: null, lowest: null, average: 0 };
  }

  const highest = dailyData.value.reduce((a, b) => (b.total > a.total ? b : a));
  const lowest = dailyData.value.reduce((a, b) => (b.total < a.total ? b : a));
  const total = dailyData.value.reduce((sum, d) => sum + d.total, 0);

  return { highest, lowest, average: total / dailyData.value.length };
});

const totalAmount = computed(() =>
  filtered.value.reduce(
    (sum, item) => sum + Number(item.prRequestedAmount || 0),
    0,
  ),
);

const trendCanvas = ref(null);
const trendChartConfig = computed(() => {
  const useDaily = !!range.value;
  const source = useDaily ? dailyData.value : monthlyData.value;

  return {
    type: "line",
    data: {
      labels: source.map((d) => (useDaily ? date(d.day) : d.label)),
      datasets: [
        {
          label: "Jumlah PR",
          data: source.map((d) => d.total),
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
        tooltip: { callbacks: { label: (item) => `Total: ${item.raw} PR` } },
      },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  };
});
useChart(trendCanvas, trendChartConfig);

const statusKeys = Object.values(STATUS);

const statusColumns = [
  { key: "responsible", label: "Responsible", class: "text-left" },
  ...statusKeys.map((key) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
  })),
  { key: "total", label: "Total" },
];

const tableRows = computed(() => {
  const map = new Map();

  filtered.value.forEach((item) => {
    const name = item.responsibleName || "-";

    if (!map.has(name)) {
      map.set(name, {
        responsible: name,
        total: 0,
        amount: 0,
        ...Object.fromEntries(statusKeys.map((key) => [key, 0])),
      });
    }

    const row = map.get(name);
    row.total += 1;
    row.amount += Number(item.prRequestedAmount || 0);
    if (statusKeys.includes(item.prStatus)) row[item.prStatus] += 1;
  });

  return [...map.values()].sort((a, b) => b.total - a.total);
});

const barCanvas = ref(null);
const barChartConfig = computed(() => ({
  type: "bar",
  data: {
    labels: tableRows.value.map((row) => row.responsible),
    datasets: [
      {
        label: "Total Amount",
        data: tableRows.value.map((row) => row.amount),
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
      y: { beginAtZero: true, ticks: { callback: (value) => money(value) } },
    },
  },
}));
useChart(barCanvas, barChartConfig);

onMounted(fetchRequests);
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-slate-800">Request Summary</h1>

    <div class="rounded-md border border-slate-200 bg-white p-4 sm:p-6">
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      >
        <h2 class="text-base font-semibold text-slate-800">Filter</h2>

        <div class="flex flex-col gap-2">
          <div
            class="flex flex-col gap-2 sm:flex-row xs:flex-wrap xs:items-center"
          >
            <DateRange
              class="w-full sm:w-52 sm:shrink-0"
              :model-value="range"
              :error="rangeError"
              placeholder="Date Range Filter"
              @update:model-value="onRangeChange"
              @error="rangeError = $event"
            />
            <select
              :value="year"
              :class="selectClass"
              :disabled="!!range"
              @change="onYearChange"
            >
              <option value="">All Years</option>
              <option v-for="y in yearOptions" :key="y" :value="y">
                {{ y }}
              </option>
            </select>
            <select v-model="responsible" :class="selectClass">
              <option value="">All Responsible</option>
              <option v-for="r in responsibleOptions" :key="r" :value="r">
                {{ r }}
              </option>
            </select>
            <select v-model="status" :class="selectClass">
              <option value="">All Status</option>
              <option v-for="s in statusKeys" :key="s" :value="s">
                {{ s.charAt(0).toUpperCase() + s.slice(1) }}
              </option>
            </select>
          </div>
          <p v-if="rangeError" class="text-xs text-red-500">{{ rangeError }}</p>
        </div>
      </div>
    </div>

    <div class="rounded-md border border-slate-200 bg-white p-4 sm:p-6">
      <h2 class="mb-6 text-base font-semibold text-slate-800">
        Payment Request Summary
      </h2>

      <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="rounded-xl border border-slate-200 p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-slate-400">
            Highest PR
          </p>
          <p class="mt-2 text-2xl font-bold text-slate-800">
            {{ summary.highest ? summary.highest.total : "-" }}
          </p>
          <p class="mt-1 text-xs text-slate-400">
            {{ summary.highest ? date(summary.highest.day) : "-" }}
          </p>
        </div>

        <div class="rounded-xl border border-slate-200 p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-slate-400">
            Lowest PR
          </p>
          <p class="mt-2 text-2xl font-bold text-slate-800">
            {{ summary.lowest ? summary.lowest.total : "-" }}
          </p>
          <p class="mt-1 text-xs text-slate-400">
            {{ summary.lowest ? date(summary.lowest.day) : "-" }}
          </p>
        </div>

        <div class="rounded-xl border border-slate-200 p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-slate-400">
            Average PR
          </p>
          <p class="mt-2 text-2xl font-bold text-slate-800">
            {{ Math.round(summary.average) }}
          </p>
          <p class="mt-1 text-xs text-slate-400">
            Per Hari &middot; {{ filtered.length }} Total PR &middot;
            {{ money(totalAmount) }}
          </p>
        </div>
      </div>

      <h3 class="mb-4 text-sm font-semibold text-slate-700">
        Total Payment Request Trend
      </h3>
      <div
        v-if="listLoading"
        class="flex h-72 items-center justify-center text-sm text-slate-400"
      >
        Load data...
      </div>
      <div
        v-else-if="listError"
        class="flex h-72 items-center justify-center text-sm text-red-500"
      >
        {{ listError }}
      </div>
      <div
        v-else-if="dailyData.length === 0"
        class="flex h-72 items-center justify-center text-sm text-slate-400"
      >
        No data
      </div>
      <div v-else class="relative h-56 sm:h-72">
        <canvas ref="trendCanvas" />
      </div>
    </div>

    <div class="rounded-md border border-slate-200 bg-white p-4 sm:p-6">
      <h2 class="mb-6 text-base font-semibold text-slate-800">
        Responsible Amount Summary
      </h2>

      <div
        v-if="listLoading"
        class="flex h-64 items-center justify-center text-sm text-slate-400"
      >
        Load data...
      </div>
      <div
        v-else-if="listError"
        class="flex h-64 items-center justify-center text-sm text-red-500"
      >
        {{ listError }}
      </div>
      <div
        v-else-if="tableRows.length === 0"
        class="flex h-64 items-center justify-center text-sm text-slate-400"
      >
        No data
      </div>
      <div v-else class="relative h-56 sm:h-64">
        <canvas ref="barCanvas" />
      </div>
    </div>

    <div class="rounded-md border border-slate-200 bg-white">
      <div class="p-4 pb-0 sm:p-6 sm:pb-0">
        <h2 class="mb-5 text-base font-semibold text-slate-800">
          Status Payment Request Report
        </h2>
      </div>

      <Table
        :columns="statusColumns"
        :rows="tableRows"
        :loading="listLoading"
        :error="listError"
        row-key="responsible"
        empty-message="Belum ada data laporan"
      >
        <template #responsible="{ row }">
          <span class="font-medium text-slate-700">{{ row.responsible }}</span>
        </template>
        <template #completed="{ row }">
          <span class="font-semibold text-teal-600">{{ row.completed }}</span>
        </template>
        <template #cancelled="{ row }">
          <span class="font-semibold text-red-500">{{ row.cancelled }}</span>
        </template>
        <template #total="{ row }">
          <span class="font-semibold text-slate-800">{{ row.total }}</span>
        </template>
      </Table>

      <div
        v-if="tableRows.length"
        class="flex items-center justify-between border-t border-slate-200 px-4 py-4 sm:px-6"
      >
        <span class="text-sm font-medium text-slate-500">Total</span>
        <span class="text-sm font-semibold text-orange-500">{{
          filtered.length
        }}</span>
      </div>
    </div>
  </div>
</template>
