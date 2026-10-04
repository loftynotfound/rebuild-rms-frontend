<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRoute, useRouter } from "vue-router";
import Table from "@/components/ui/Table.vue";
import CardList from "@/components/ui/CardList.vue";
import Pagination from "@/components/ui/Pagination.vue";
import DateRange from "@/components/ui/DateRange.vue";
import {
  usePurchaseOrders,
  PO_STATUS_TABS,
  formatCurrency,
  formatDate,
  formatProductNames,
} from "@/composables/po/usePO";
import { useExportPO } from "@/composables/po/useExportPO";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

// Status tab awal bisa datang dari query (?status=complete), misal saat diklik dari StatCard dashboard.
// Fallback ke 'open' jika query kosong/tidak valid.
const validStatusKeys = PO_STATUS_TABS.map((tab) => tab.key);
const initialStatus = validStatusKeys.includes(route.query.status)
  ? route.query.status
  : undefined;

const {
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
} = usePurchaseOrders(initialStatus);

const {
  showExportModal,
  exporting,
  exportError,
  lastCacheStatus,
  exportFilters,
  divisionOptions,
  regionOptions: exportRegionOptions,
  clientKeyword: exportClientKeyword,
  clientOptions: exportClientOptions,
  clientSearchLoading: exportClientSearchLoading,
  onClientKeywordInput,
  selectExportClient,
  clearExportClient,
  resetExportFilters,
  openExportModal,
  closeExportModal,
  submitExport,
} = useExportPO();

// ── Definisi kolom per status ──────────────────────────────────────
// Class w-[n%] ditulis literal (bukan dirakit dari template literal/variable),
// karena Tailwind men-scan source code secara statis untuk generate CSS —
// class yang dibangun dinamis saat runtime tidak akan pernah muncul di build.
// Field "No" sengaja diberi lebar paling kecil.

const NO_COLUMN = { key: "no", label: "No", class: "w-[4%] !px-1" };
const ACTION_CLASS = "w-[7%] !px-1 text-center";

// Dipakai oleh tab: open, prepared, cancel (field identik: + Document Date)
const openLikeColumns = [
  NO_COLUMN,
  { key: "po_id", label: "PO ID", class: "w-[11%]" },
  { key: "po_order_num", label: "PO Number", class: "w-[9%]" },
  { key: "product_names", label: "Product", class: "w-[11%]" },
  { key: "client_name", label: "Client", class: "w-[12%]" },
  { key: "po_subclient", label: "Sub Client", class: "w-[6%]" },
  { key: "region_title", label: "Region", class: "w-[8%]" },
  { key: "pic_name", label: "PIC", class: "w-[8%]" },
  { key: "division_title", label: "Division", class: "w-[7%]" },
  { key: "po_total", label: "Total Amount", class: "w-[9%]" },
  { key: "po_date", label: "Document Date", class: "w-[8%]" },
  { key: "action", label: "Action", class: ACTION_CLASS },
];

// Tab: in progress (+ Invoice State, Document Status)
const progressColumns = [
  NO_COLUMN,
  { key: "po_id", label: "PO ID", class: "w-[10%]" },
  { key: "po_order_num", label: "PO Number", class: "w-[8%]" },
  { key: "product_names", label: "Product", class: "w-[9%]" },
  { key: "client_name", label: "Client", class: "w-[11%]" },
  { key: "po_subclient", label: "Sub Client", class: "w-[6%]" },
  { key: "region_title", label: "Region", class: "w-[6%]" },
  { key: "pic_name", label: "PIC", class: "w-[8%]" },
  { key: "division_title", label: "Division", class: "w-[7%]" },
  { key: "po_total", label: "Total Amount", class: "w-[8%]" },
  { key: "po_invoice", label: "Invoice State", class: "w-[8%]" },
  { key: "po_status", label: "Document Status", class: "w-[8%]" },
  { key: "action", label: "Action", class: ACTION_CLASS },
];

// Tab: completed (+ Invoice State, Paid, Document Status)
const completeColumns = [
  NO_COLUMN,
  { key: "po_id", label: "PO ID", class: "w-[9%]" },
  { key: "po_order_num", label: "PO Number", class: "w-[7%]" },
  { key: "product_names", label: "Product", class: "w-[8%]" },
  { key: "client_name", label: "Client", class: "w-[8%]" },
  { key: "po_subclient", label: "Sub Client", class: "w-[6%]" },
  { key: "region_title", label: "Region", class: "w-[7%]" },
  { key: "pic_name", label: "PIC", class: "w-[8%]" },
  { key: "division_title", label: "Division", class: "w-[7%]" },
  { key: "po_total", label: "Total Amount", class: "w-[8%]" },
  { key: "po_invoice", label: "Invoice State", class: "w-[8%]" },
  { key: "po_paid", label: "Paid", class: "w-[6%] !px-1" },
  { key: "po_status", label: "Document Status", class: "w-[8%]" },
  { key: "action", label: "Action", class: ACTION_CLASS },
];

const COLUMNS_BY_STATUS = {
  open: openLikeColumns,
  prepared: openLikeColumns,
  progress: progressColumns,
  complete: completeColumns,
  cancel: openLikeColumns,
};

const columns = computed(
  () => COLUMNS_BY_STATUS[filters.status] ?? openLikeColumns,
);

const dateRangeModel = computed({
  get: () =>
    filters.start_date && filters.end_date
      ? { start: filters.start_date, end: filters.end_date }
      : null,
  set: (val) => {
    applyFilters({
      start_date: val?.start ?? "",
      end_date: val?.end ?? "",
    });
  },
});

const dateRangeError = ref("");
function onDateRangeError(msg) {
  dateRangeError.value = msg;
}

let searchTimeout = null;
function onSearchInput(event) {
  clearTimeout(searchTimeout);
  const keyword = event.target.value;
  searchTimeout = setTimeout(() => applyFilters({ keyword }), 400);
}

function onSortChange(event) {
  applyFilters({ sortby: event.target.value });
}

function onRegionChange(event) {
  applyFilters({ region: event.target.value });
}

function goToDetail(id) {
  router.push(`/po/${id}`);
}

function goToCreate() {
  router.push("/po/create");
}

onMounted(() => {
  fetchPurchaseOrders();
  fetchTotalByStatus();
});
</script>

<template>
  <div>
    <div class="space-y-4">
      <h1 class="text-2xl font-bold text-slate-800">Purchase Order</h1>

      <div class="rounded-md bg-white shadow-sm">
        <!-- Header actions -->
        <div
          class="flex flex-col gap-3 border-b-[1.5px] border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-end sm:p-6"
        >
          <button
            v-if="authStore.hasAccess('export_po')"
            type="button"
            @click="
              openExportModal({
                status: filters.status,
                region: filters.region,
                start_date: filters.start_date,
                end_date: filters.end_date,
              })
            "
            class="flex items-center justify-center gap-2 rounded-sm border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
              />
            </svg>
            Export
          </button>
          <button
            v-if="authStore.hasAccess('create_po')"
            type="button"
            class="flex items-center justify-center gap-2 rounded-sm bg-teal-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-600"
            @click="goToCreate"
          >
            Create PO
          </button>
        </div>

        <!-- Status Tabs -->
        <div class="flex overflow-x-auto border-b-[1.5px] border-slate-100">
          <button
            v-for="tab in PO_STATUS_TABS"
            :key="tab.key"
            type="button"
            class="flex flex-1 items-center justify-center gap-2 whitespace-nowrap border-b-2 px-4 py-4 text-sm font-semibold uppercase tracking-wide transition-colors sm:px-6"
            :class="
              filters.status === tab.key
                ? 'border-teal-500 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            "
            @click="setStatus(tab.key)"
          >
            {{ tab.label }}
            <span
              class="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold text-white"
              :class="
                filters.status === tab.key ? 'bg-teal-500' : 'bg-slate-300'
              "
            >
              {{ totalByStatus[tab.key] }}
            </span>
          </button>
        </div>

        <!-- Filters -->
        <div
          class="grid grid-cols-1 gap-3 p-4 sm:p-6 lg:grid-cols-[2fr_1fr_1fr_1fr]"
        >
          <div class="relative">
            <svg
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search PO / PO No / Client / Product"
              class="w-full rounded-sm border border-slate-200 py-2 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-teal-400 focus:outline-none"
              @input="onSearchInput"
            />
          </div>

          <select
            class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
            @change="onSortChange"
          >
            <option value="new">Newest</option>
            <option value="old">Oldest</option>
          </select>

          <DateRange
            v-model="dateRangeModel"
            :max-months="12"
            placeholder="Range Date Filter"
            :error="dateRangeError"
            @error="onDateRangeError"
          />

          <select
            class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
            @focus="fetchRegionOptions"
            @change="onRegionChange"
          >
            <option value="">All Region</option>
            <option
              v-for="region in regionOptions"
              :key="region.region_id"
              :value="region.region_id"
            >
              {{ region.region_title }}
            </option>
          </select>
        </div>

        <!-- MOBILE: card list (replaces table below sm), driven by the same rows as the Table -->
        <div class="p-4 sm:hidden">
          <CardList
            :rows="rows"
            :loading="loading"
            :error="error"
            row-key="po_id"
            empty-message="No Purchase Order available"
          >
            <template #default="{ row, index }">
              <div class="mb-2 flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p
                    class="text-xs font-medium uppercase tracking-wide text-slate-400"
                  >
                    #{{
                      index + 1 + (pagination.page - 1) * filters.item
                    }}
                    &middot; {{ formatDate(row.po_date) }}
                  </p>
                  <p class="wrap-break-word text-sm font-semibold text-slate-800">
                    {{ row.po_order_num ?? row.po_id }}
                  </p>
                </div>
                <span
                  class="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-600"
                >
                  {{ row.po_status }}
                </span>
              </div>

              <p
                v-if="row.client_name"
                class="mb-2 wrap-break-word text-sm text-slate-600"
              >
                {{ row.client_name }}
              </p>

              <p class="mb-3 wrap-break-word text-xs text-slate-500">
                {{ formatProductNames(row.product_names) }}
              </p>

              <div
                class="mb-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-50 pt-3"
              >
                <span class="text-sm font-semibold text-slate-900">{{
                  formatCurrency(row.po_total)
                }}</span>
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  :class="
                    row.po_paid === 'yes'
                      ? 'bg-teal-50 text-teal-600'
                      : 'bg-slate-100 text-slate-500'
                  "
                >
                  {{ row.po_paid === "yes" ? "Paid" : "Unpaid" }}
                </span>
              </div>

              <div v-if="row.po_invoice" class="mb-3 text-xs text-slate-400">
                Invoice:
                <span class="text-slate-600">{{ row.po_invoice }}</span>
              </div>

              <button
                type="button"
                class="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 py-2 text-sm font-medium text-indigo-500 hover:bg-indigo-50"
                aria-label="Lihat detail PO"
                @click="goToDetail(row.po_id)"
              >
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Detail
              </button>
            </template>
          </CardList>
        </div>

        <!-- DESKTOP/TABLET: table (sm and up). Column widths kept relative (%) so it always
            fits 100% without overflow/scrolling, and stays proportional as the sidebar
            opens/closes. Headers may wrap (not truncated with "...") so labels stay fully readable. -->
        <div
          class="hidden sm:block [&_table]:table-fixed [&_td]:px-3! [&_td]:py-3! [&_td]:text-xs [&_td]:wrap-break-word [&_th]:px-2! [&_th]:py-3! [&_th]:text-[11px] [&_th]:wrap-break-word"
        >
          <Table
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :error="error"
            row-key="po_id"
            empty-message="No Purchase Order available"
          >
            <template #no="{ row }">
              {{ rows.indexOf(row) + 1 + (pagination.page - 1) * filters.item }}
            </template>

            <template #product_names="{ row }">
              {{ formatProductNames(row.product_names) }}
            </template>

            <template #po_total="{ row }">
              {{ formatCurrency(row.po_total) }}
            </template>

            <template #po_date="{ row }">
              {{ formatDate(row.po_date) }}
            </template>

            <template #po_invoice="{ row }">
              {{ row.po_invoice ?? "-" }}
            </template>

            <template #po_paid="{ row }">
              <div class="flex justify-center">
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  :class="
                    row.po_paid === 'yes'
                      ? 'bg-teal-50 text-teal-600'
                      : 'bg-slate-100 text-slate-500'
                  "
                >
                  {{ row.po_paid === "yes" ? "Paid" : "Unpaid" }}
                </span>
              </div>
            </template>

            <template #po_status="{ row }">
              <div class="flex justify-center">
                <span
                  class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-600"
                >
                  {{ row.po_status }}
                </span>
              </div>
            </template>

            <template #action="{ row }">
              <div class="flex justify-center">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-md p-1.5 text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
                  aria-label="Lihat detail PO"
                  @click="goToDetail(row.po_id)"
                >
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span class="text-xs font-medium">Detail</span>
                </button>
              </div>
            </template>
          </Table>
        </div>

        <Pagination
          class="p-4"
          :page="pagination.page"
          :total-page="pagination.totalPage"
          :total-data="pagination.totalData"
          :per-page="filters.item"
          @change="setPage"
        />
      </div>
    </div>

    <!-- Modal: Export PO -->
    <div
      v-if="showExportModal"
      class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:px-4"
      @click.self="closeExportModal"
    >
      <div
        class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 shadow-lg sm:rounded-md sm:p-6"
      >
        <h3 class="mb-1 text-base font-semibold text-slate-800">
          Export Purchase Order
        </h3>
        <p class="mb-5 text-sm text-slate-500">
          Download the per-item breakdown as an Excel (.xlsx) file based on the
          filters below
        </p>

        <p
          v-if="exportError"
          class="mb-4 rounded-sm bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {{ exportError }}
        </p>

        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700"
                >Start Date</label
              >
              <input
                v-model="exportFilters.start_date"
                type="date"
                class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700"
                >End Date</label
              >
              <input
                v-model="exportFilters.end_date"
                type="date"
                class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700"
                >Status</label
              >
              <select
                v-model="exportFilters.status"
                class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option
                  v-for="tab in PO_STATUS_TABS"
                  :key="tab.key"
                  :value="tab.key"
                >
                  {{ tab.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700"
                >Region</label
              >
              <select
                v-model="exportFilters.region"
                class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
              >
                <option value="">All Regions</option>
                <option
                  v-for="region in exportRegionOptions"
                  :key="region.region_id"
                  :value="region.region_id"
                >
                  {{ region.region_title }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700"
              >Division</label
            >
            <select
              v-model="exportFilters.division"
              class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
            >
              <option value="">All Divisions</option>
              <option
                v-for="division in divisionOptions"
                :key="division.division_id"
                :value="division.division_id"
              >
                {{ division.division_title }}
              </option>
            </select>
          </div>

          <div class="relative">
            <label class="mb-1.5 block text-sm font-medium text-slate-700"
              >Client (optional)</label
            >
            <div class="relative">
              <input
                :value="exportClientKeyword"
                type="text"
                autocomplete="off"
                placeholder="Search client, or leave empty for all clients"
                class="w-full rounded-sm border border-slate-200 px-3 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
                @input="onClientKeywordInput"
              />
              <button
                v-if="exportFilters.client"
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear client filter"
                @click="clearExportClient"
              >
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
            <ul
              v-if="exportClientOptions.length > 0"
              class="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto overflow-x-hidden rounded-sm border border-slate-200 bg-white shadow-lg"
            >
              <li
                v-if="exportClientSearchLoading"
                class="px-3 py-2 text-sm text-slate-400"
              >
                Searching...
              </li>
              <li
                v-for="client in exportClientOptions"
                :key="client.client_id"
                class="cursor-pointer px-3 py-2 text-sm hover:bg-teal-50"
                @click="selectExportClient(client)"
              >
                {{ client.client_name }}
              </li>
            </ul>
          </div>
        </div>

        <div
          class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <button
            type="button"
            class="text-sm font-medium text-slate-400 hover:text-slate-600 sm:text-left"
            @click="resetExportFilters"
          >
            Reset filters
          </button>
          <div class="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              :disabled="exporting"
              class="w-full rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
              @click="closeExportModal"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="exporting"
              class="w-full rounded-sm bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50 sm:w-auto"
              v-if="authStore.hasAccess('export_po')"
              @click="submitExport"
            >
              {{ exporting ? "Generating..." : "Export" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
