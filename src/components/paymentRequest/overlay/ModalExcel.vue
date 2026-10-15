<script setup>
import { ref } from "vue";
import { usePaymentRequest } from "@/composables/paymentRequest/usePaymentRequest";

import InputDate from "@/components/paymentRequest/base/InputDate.vue";

const props = defineProps({
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
});

const emit = defineEmits(["close"]);

const { exportExcel } = usePaymentRequest();

const form = ref({
  startDate: props.startDate,
  endDate: props.endDate,
});

const exporting = ref(false);
const exportError = ref("");

const validate = () => {
  const { startDate, endDate } = form.value;

  if (!startDate && !endDate) return "";

  if (!startDate || !endDate) {
    return "Start date and end date must be filled together.";
  }

  if (startDate > endDate) {
    return "Start date cannot be later than end date.";
  }

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
    exportError.value = err.message ?? "Failed to export the Excel file.";
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
    @click.self="close">
    <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-white p-6 shadow-lg sm:rounded-sm">
      <div class="flex flex-col gap-1 border-b border-slate-200 pb-3">
        <span class="text-base font-semibold text-slate-800"> Export File .xlsx </span>

        <span class="text-sm text-slate-500">
          Download payment requests data. Leave both dates empty to export all data.
        </span>
      </div>

      <div class="flex flex-col gap-4 pt-4">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-slate-800"> Start Date </label>

          <InputDate v-model="form.startDate" placeholder="Start date" />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-slate-800"> End Date </label>

          <InputDate v-model="form.endDate" placeholder="End date" />
        </div>
      </div>

      <p
        v-if="exportError"
        role="alert"
        class="mt-4 rounded-sm bg-red-50 px-3 py-2 text-sm text-red-600">
        {{ exportError }}
      </p>

      <div class="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          :disabled="exporting"
          class="w-full cursor-pointer rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          @click="close">
          Cancel
        </button>

        <button
          type="button"
          :disabled="exporting"
          class="w-full cursor-pointer rounded-sm bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
          @click="submit">
          {{ exporting ? "Generating..." : "Export" }}
        </button>
      </div>
    </div>
  </div>
</template>
