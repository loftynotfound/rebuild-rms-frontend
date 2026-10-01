<script setup>
import { useExport } from "@/composables/paymentRequest/useExport";
const { exportWord } = useExport();

defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const { exportWord } = useExportWord();
</script>

<template>
  <button
    type="button"
    class="flex w-full lg:w-auto items-center justify-center gap-2 rounded-sm border border-slate-200 bg-white px-3 h-10 text-sm font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
    @click="exportWord(item)"
  >
    <Icon icon="hugeicons:arrow-down-03" class="h-5 w-5" />
    Export .doc
  </button>
</template>
