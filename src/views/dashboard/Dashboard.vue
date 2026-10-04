<script setup>
import { RouterLink } from "vue-router";
import StatCard from "@/components/ui/StatCard.vue";
import Table from "@/components/ui/Table.vue";
import Card from "@/components/ui/CardList.vue";
import { useDashboard } from "@/composables/dashboard/useDashboard";
import { formatDate } from "@/composables/po/usePO";

const { loading, error, totalPO, statusCards, recentOpenPO } = useDashboard();

const recentPOColumns = [
  { key: "no", label: "No" },
  { key: "po_id", label: "PO ID" },
  { key: "po_order_num", label: "PO Number" },
  { key: "client_name", label: "Client Name" },
  { key: "po_subclient", label: "Sub Client" },
  { key: "region_title", label: "Region" },
  { key: "pic_name", label: "PIC" },
  { key: "po_date", label: "Document Date" },
];
</script>

<template>
  <div class="flex flex-col gap-4 sm:gap-6 bg-[#F5F7FA] min-h-screen">
    <!-- Error state -->
    <div
      v-if="error"
      class="rounded-md px-4 sm:px-6 py-4 bg-red-50 border border-red-200 text-red-600 text-sm"
    >
      Gagal memuat data: {{ error }}
    </div>

    <!-- Total Purchase Order -->
    <div
      class="relative overflow-hidden rounded-sm px-4 sm:px-6 py-5 sm:py-6 bg-white shadow-sm border-b-4 transition-all duration-200 ease-out"
      style="border-bottom-color: #14aea1"
    >
      <div class="flex items-center justify-between gap-4">
        <!-- Kiri -->
        <div class="flex items-center gap-3 sm:gap-4">
          <span
            class="flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-sm bg-[#14AEA1] text-white shrink-0"
          >
            <svg
              class="w-6 h-6 sm:w-7 sm:h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 7h12l1 13H5L6 7Z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 7a3 3 0 1 1 6 0"
              />
            </svg>
          </span>

          <h2 class="text-base sm:text-xl font-semibold text-gray-600">
            <span class="sm:hidden">Total PO</span>
            <span class="hidden sm:inline">Total Purchase Order</span>
          </h2>
        </div>

        <!-- Kanan -->
        <div class="flex items-center gap-4">
          <div class="hidden sm:block h-12 w-px bg-gray-200"></div>
          <span class="text-2xl sm:text-3xl font-bold text-[#14AEA1]">
            {{ totalPO.toLocaleString() }}
          </span>
        </div>
      </div>
    </div>

    <!-- Status Cards -->
    <div v-if="loading" class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <div
        v-for="n in 6"
        :key="n"
        class="rounded-sm bg-white shadow-sm h-24 sm:h-28 animate-pulse"
      />
    </div>

    <div v-else class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <component
        :is="card.key ? RouterLink : 'div'"
        v-for="card in statusCards"
        :key="card.label"
        :to="
          card.key ? { path: '/po', query: { status: card.key } } : undefined
        "
        :class="card.key ? 'block' : ''"
      >
        <StatCard
          :label="card.label"
          :value="card.value"
          :accent="card.accent"
          :icon-bg="card.iconBg"
        >
          <template #icon>
            <!-- Open: folder -->
            <svg
              v-if="card.label === 'Open'"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
              />
            </svg>

            <!-- Prepared: pencil / note -->
            <svg
              v-else-if="card.label === 'Prepared'"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h11M4 12h7M4 18h5"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m16 15 4-4 2 2-4 4h-2v-2Z"
              />
            </svg>

            <!-- In Progress: refresh/sync -->
            <svg
              v-else-if="card.label === 'In Progress'"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h5M20 20v-5h-5"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4.5 9a8 8 0 0 1 14-3.3M19.5 15a8 8 0 0 1-14 3.3"
              />
            </svg>

            <!-- Completed: check circle -->
            <svg
              v-else-if="card.label === 'Completed'"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="9" stroke-width="2" />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m8.5 12.5 2.5 2.5 4.5-5"
              />
            </svg>

            <!-- Canceled: x circle -->
            <svg
              v-else-if="card.label === 'Canceled'"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="9" stroke-width="2" />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="m9.5 9.5 5 5m0-5-5 5"
              />
            </svg>

            <!-- Paid: card -->
            <svg
              v-else
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <rect
                x="3"
                y="6"
                width="18"
                height="12"
                rx="2"
                stroke-width="2"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 10h18M7 15h4"
              />
            </svg>
          </template>
        </StatCard>
      </component>
    </div>

    <!-- Recent Open PO -->
    <div class="rounded-md bg-white shadow-sm overflow-hidden">
      <div class="px-4 sm:px-6 py-3 sm:py-4 border-slate-200">
        <h2 class="text-base sm:text-lg font-semibold text-gray-800">
          Recent Open PO
        </h2>
      </div>

      <!-- MOBILE: card list (below sm), sama layout dengan PO.vue -->
      <div class="p-4 sm:hidden">
        <Card
          :rows="recentOpenPO"
          :loading="loading"
          row-key="po_id"
          empty-message="Belum ada PO open"
        >
          <template #default="{ row, index }">
            <div class="mb-2 flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p
                  class="text-xs font-medium uppercase tracking-wide text-slate-400"
                >
                  #{{ index + 1 }} &middot; {{ formatDate(row.po_date) }}
                </p>
                <p class="wrap-break-word text-sm font-semibold text-slate-800">
                  {{ row.po_order_num ?? row.po_id }}
                </p>
              </div>
            </div>

            <p
              v-if="row.client_name"
              class="mb-2 wrap-break-word text-sm text-slate-600"
            >
              {{ row.client_name }}
            </p>

            <p v-if="row.po_subclient" class="mb-1 text-xs text-slate-400">
              Sub Client:
              <span class="text-slate-600">{{ row.po_subclient }}</span>
            </p>

            <div
              class="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400"
            >
              <span v-if="row.region_title">{{ row.region_title }}</span>
              <span v-if="row.pic_name"
                >PIC:
                <span class="text-slate-600">{{ row.pic_name }}</span></span
              >
            </div>
          </template>
        </Card>
      </div>

      <!-- DESKTOP/TABLET: table (sm and up) -->
      <div class="hidden sm:block overflow-x-auto">
        <Table
          :columns="recentPOColumns"
          :rows="recentOpenPO"
          :loading="loading"
          row-key="po_id"
          empty-message="Belum ada PO open"
        >
          <template #no="{ row }">
            {{ recentOpenPO.indexOf(row) + 1 }}
          </template>

          <template #po_subclient="{ row }">
            {{ row.po_subclient || "-" }}
          </template>

          <template #po_date="{ row }">
            {{ formatDate(row.po_date) }}
          </template>
        </Table>
      </div>
    </div>
  </div>
</template>
