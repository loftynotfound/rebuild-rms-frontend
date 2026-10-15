<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { usePpn } from "@/composables/control/usePPN";

const authStore = useAuthStore();

const PREVIEW_SUBTOTAL = 1000000;

const { ppnValue, loading, saving, error, fetchCurrent, save } = usePpn();

const inputValue = ref(0);
const saveSuccess = ref(false);

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

const previewPpnAmount = computed(() => {
  const percentage = Number(inputValue.value) || 0;
  return (PREVIEW_SUBTOTAL * percentage) / 100;
});

const previewTotal = computed(() => PREVIEW_SUBTOTAL + previewPpnAmount.value);

function formatCurrency(amount) {
  return currencyFormatter.format(amount);
}

function limitPercentage(event) {
  let value = Number(event.target.value);

  if (value > 100) {
    value = 100;
  } else if (value < 0) {
    value = 0;
  }

  inputValue.value = value;
}

async function handleSave() {
  saveSuccess.value = false;
  const success = await save(Number(inputValue.value));
  if (success) {
    saveSuccess.value = true;
    setTimeout(() => (saveSuccess.value = false), 3000);
  }
}

onMounted(async () => {
  await fetchCurrent();
  inputValue.value = ppnValue.value;
});
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-slate-800">PPN (Pajak Pertambahan Nilai)</h1>

    <div class="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
      <div class="rounded-sm border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
        <div class="mb-4 flex items-center gap-2 sm:mb-6">
          <span class="text-base font-medium text-slate-800">PPN Default *</span>
        </div>

        <div v-if="loading" class="py-4 text-sm text-slate-500">Loading PPN data...</div>

        <template v-else>
          <label class="mb-2 block text-sm text-slate-600" for="ppn-rate"> PPN Rate </label>
          <div class="relative mb-4">
            <input
              id="ppn-rate"
              v-model="inputValue"
              :disabled="!authStore.hasAccess('edit_ppn')"
              type="number"
              min="0"
              max="100"
              step="1"
              @input="limitPercentage"
              class="w-full rounded-sm border border-transparent bg-indigo-50/60 px-4 py-3 pr-10 text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none" />
            <span class="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-emerald-700"
              >%</span
            >
          </div>

          <div class="mb-6 flex gap-2 rounded-sm bg-emerald-50 p-3 sm:p-4">
            <svg
              class="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke-width="2" />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 16v-4m0-4h.01" />
            </svg>
            <p class="text-sm text-emerald-800">
              The PPN rate will be applied as the default rate for new transactions.
            </p>
          </div>

          <p v-if="error" class="mb-4 text-sm text-red-600">
            {{ error }}
          </p>
          <p v-if="saveSuccess" class="mb-4 text-sm text-emerald-600">
            PPN rate has been saved successfully.
          </p>

          <div class="flex justify-end">
            <button
              v-if="authStore.hasAccess('edit_ppn')"
              type="button"
              :disabled="saving"
              class="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-teal-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              @click="handleSave">
              {{ saving ? "Saving..." : "Save" }}
            </button>
          </div>
        </template>
      </div>

      <div class="rounded-sm bg-white p-4 shadow-sm sm:p-6">
        <h2 class="mb-1 text-base font-medium text-slate-800">Calculation Preview</h2>
        <p class="mb-6 text-sm text-slate-500">
          Calculation preview based on the current PPN rate.
        </p>

        <div class="space-y-4">
          <div class="flex justify-between text-sm">
            <span class="text-slate-600">Subtotal</span>
            <span class="text-slate-800">{{ formatCurrency(PREVIEW_SUBTOTAL) }}</span>
          </div>

          <div class="flex justify-between text-sm">
            <span class="text-slate-600"> PPN ({{ Number(inputValue) || 0 }}%) </span>
            <span class="text-slate-800">{{ formatCurrency(previewPpnAmount) }}</span>
          </div>

          <hr class="my-4 h-0.5 rounded-sm border-0 bg-slate-200" />

          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-600">Total</span>
            <span class="text-lg font-semibold text-emerald-700">
              {{ formatCurrency(previewTotal) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
