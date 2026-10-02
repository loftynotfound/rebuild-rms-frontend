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
    <h1 class="text-2xl font-bold text-slate-800">
      PPN (Pajak Pertambahan Nilai)
    </h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <!-- Form PPN Default -->
      <div class="bg-white rounded-md shadow-sm p-4 sm:p-6">
        <div class="flex items-center gap-2 mb-4 sm:mb-6">
          <span class="text-base font-medium text-slate-800"
            >PPN Default *</span
          >
        </div>

        <div v-if="loading" class="text-sm text-slate-500 py-4">
          Loading PPN data...
        </div>

        <template v-else>
          <label class="block text-sm text-slate-600 mb-2" for="ppn-rate">
            PPN Rate
          </label>
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
              class="w-full rounded-sm bg-indigo-50/60 border border-transparent px-4 py-3 pr-10 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <span
              class="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-700 text-sm"
              >%</span
            >
          </div>

          <div class="flex gap-2 rounded-sm bg-emerald-50 p-3 sm:p-4 mb-6">
            <svg
              class="w-5 h-5 text-emerald-700 shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" stroke-width="2" />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 16v-4m0-4h.01"
              />
            </svg>
            <p class="text-sm text-emerald-800">
              The PPN rate will be applied as the default rate for new
              transactions.
            </p>
          </div>

          <p v-if="error" class="text-sm text-red-600 mb-4">
            {{ error }}
          </p>
          <p v-if="saveSuccess" class="text-sm text-emerald-600 mb-4">
            PPN rate has been saved successfully.
          </p>

          <div class="flex justify-end">
            <button
              v-if="authStore.hasAccess('edit_ppn')"
              type="button"
              :disabled="saving"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-sm bg-teal-500 px-5 py-2.5 text-white text-sm font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="handleSave"
            >
              {{ saving ? "Saving..." : "Save" }}
            </button>
          </div>
        </template>
      </div>

      <!-- Calculation Preview (statis, client-side) -->
      <div class="bg-white rounded-md shadow-sm p-4 sm:p-6">
        <h2 class="text-base font-medium text-slate-800 mb-1">
          Calculation Preview
        </h2>
        <p class="text-sm text-slate-500 mb-6">
          Calculation preview based on the current PPN rate.
        </p>

        <div class="space-y-4">
          <div class="flex justify-between text-sm">
            <span class="text-slate-600">Subtotal</span>
            <span class="text-slate-800">{{
              formatCurrency(PREVIEW_SUBTOTAL)
            }}</span>
          </div>

          <div class="flex justify-between text-sm">
            <span class="text-slate-600">
              PPN ({{ Number(inputValue) || 0 }}%)
            </span>
            <span class="text-slate-800">{{
              formatCurrency(previewPpnAmount)
            }}</span>
          </div>

          <hr class="my-4 h-0.5 border-0 bg-slate-200 rounded-xl" />

          <div class="flex justify-between items-center">
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
