<script setup>
import { ref } from "vue";
import { usePaymentRequest } from "@/composables/paymentRequest/usePaymentRequest";

import DateInput from "@/components/paymentRequest/input/Date.vue";

// Nilai awal tanggal diambil dari filter tanggal di Overview (boleh kosong)
const props = defineProps({
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
});

const emit = defineEmits(["close"]);

const { exportExcel } = usePaymentRequest();

const form = ref({ startDate: props.startDate, endDate: props.endDate });
const exporting = ref(false);
const exportError = ref("");

// Backend mewajibkan start dan end diisi berpasangan.
// Kalau keduanya kosong, backend mengekspor semua data.
const validate = () => {
  const { startDate, endDate } = form.value;

  if (!startDate && !endDate) return "";
  if (!startDate || !endDate)
    return "Start date and end date must be filled together.";
  if (startDate > endDate) return "Start date cannot be later than end date.";

  return "";
};

const submit = async () => {
  exportError.value = validate();
  if (exportError.value) return;

  exporting.value = true;

  try {
    await exportExcel({
      startDate: form.value.startDate,
      endDate: form.value.endDate,
    });
    emit("close");
  } catch (err) {
    exportError.value = err.message;
  } finally {
    exporting.value = false;
  }
};

const close = () => {
  if (!exporting.value) emit("close");
};
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 sm:items-center sm:px-4"
    @click.self="close"
  >
    <div
      class="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-white shadow-lg sm:rounded-md p-6"
    >
      <div class="flex flex-col pb-3 gap-1 border-b border-slate-200">
        <span class="text-base font-semibold text-slate-800">
          Export File .xlsx
        </span>
        <span class="text-sm text-slate-500">
          Download payment requests data. Set dates empty to export all
          data.
        </span>
      </div>

      <div class="pt-4 flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <span class="block text-sm font-medium text-slate-800">
            Start Date
          </span>
          <DateInput v-model="form.startDate" placeholder="Start date" />
        </div>
        <div class="flex flex-col gap-2">
          <span class="block text-sm font-medium text-slate-800">
            End Date
          </span>
          <DateInput v-model="form.endDate" placeholder="End date" />
        </div>
      </div>

      <span
        v-if="exportError"
        class="mb-4 rounded-sm bg-red-50 px-3 py-2 text-sm text-red-600"
      >
        {{ exportError }}
      </span>

      <div
        class="pt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end"
      >
        <button
          type="button"
          :disabled="exporting"
          class="w-full rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          @click="close"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="exporting"
          class="w-full rounded-sm bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50 cursor-pointer"
          @click="submit"
        >
          {{ exporting ? "Generating..." : "Export" }}
        </button>
      </div>
    </div>
  </div>
</template>
