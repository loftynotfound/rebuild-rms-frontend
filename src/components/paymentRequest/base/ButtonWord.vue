<script setup>
import { ref } from "vue";
import { usePaymentRequest } from "@/composables/paymentRequest/usePaymentRequest";

const { exportWord } = usePaymentRequest();

const props = defineProps({
  item: { type: Object, required: true },
});

const loading = ref(false);
const error = ref("");

const handleExport = async () => {
  error.value = "";
  loading.value = true;

  try {
    await exportWord(props.item);
  } catch (e) {
    error.value = e?.message || "Gagal mengekspor dokumen.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col items-end">
    <button
      type="button"
      class="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 lg:w-auto"
      :disabled="loading"
      @click="handleExport">
      <Icon icon="hugeicons:arrow-down-03" class="h-5 w-5" />
      {{ loading ? "Exporting..." : "Export .docx" }}
    </button>

    <span v-if="error" class="mt-1 text-[11px] text-red-500">
      {{ error }}
    </span>
  </div>
</template>
