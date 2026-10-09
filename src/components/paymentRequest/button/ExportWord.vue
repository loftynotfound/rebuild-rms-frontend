<script setup>
import { ref } from "vue";
import { downloadFile } from "@/composables/paymentRequest/useDownload";

const props = defineProps({
  item: { type: Object, required: true },
});

const loading = ref(false);
const error = ref("");

// sama dengan sanitizeFilename di backend
const sanitize = (s) => (s || "PR").replace(/[\\/]/g, "-").replace(/ /g, "_");

const exportWord = async () => {
  error.value = "";
  loading.value = true;
  try {
    await downloadFile(
      `/pr/${props.item.prId}/export`,
      `RFP_${sanitize(props.item.rfpNumber)}.docx`,
    );
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col items-end">
    <button
      type="button"
      class="flex w-full lg:w-auto items-center justify-center gap-2 rounded-sm border border-slate-200 bg-white px-3 h-10 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
      :disabled="loading"
      @click="exportWord"
    >
      <Icon icon="hugeicons:arrow-down-03" class="h-5 w-5" />
      {{ loading ? "Exporting..." : "Export .docx" }}
    </button>
    <span v-if="error" class="mt-1 text-[11px] text-red-500">{{ error }}</span>
  </div>
</template>
