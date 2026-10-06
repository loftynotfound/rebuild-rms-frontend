<script setup>
import { computed, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { downloadFile } from "@/composables/paymentRequest/useDownload";

const props = defineProps({
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
});

const authStore = useAuthStore();
const canExport = computed(() => authStore.hasAccess("export_pr_payment_report"));

const loading = ref(false);
const error = ref("");

const pad = (n) => String(n).padStart(2, "0");
const stamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

const exportXlsx = async () => {
  error.value = "";

  if (Boolean(props.startDate) !== Boolean(props.endDate)) {
    error.value = "Select both start and end date.";
    return;
  }

  const params = {};
  if (props.startDate && props.endDate) {
    params.start_date = props.startDate;
    params.end_date = props.endDate;
  }

  loading.value = true;
  try {
    await downloadFile(
      "/pr/payments/export",
      `Summary_Payment_PR_${stamp()}.xlsx`,
      params,
    );
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div v-if="canExport" class="flex flex-col">
    <button
      type="button"
      class="flex w-full tracking-tight leading-none lg:w-auto items-center justify-center gap-1.5 rounded-sm border border-slate-200 bg-white px-3 h-10 text-[14px] font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
      :disabled="loading"
      @click="exportXlsx"
    >
      <Icon icon="hugeicons:csv-01" class="size-5" />
      {{ loading ? "Exporting..." : "Export .xlsx" }}
    </button>
    <span v-if="error" class="mt-1 text-[11px] text-red-500">{{ error }}</span>
  </div>
</template>