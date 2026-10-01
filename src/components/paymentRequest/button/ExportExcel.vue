<script setup>
import { useExport } from "@/composables/paymentRequest/useExport";

const { exportExcel } = useExport();

const props = defineProps({
  exportRows: { type: Array, required: true },
});
</script>

<template>
  <div>
    <button
      type="button"
      class="flex w-full tracking-tight leading-none lg:w-auto items-center justify-center gap-1.5 rounded-sm border border-slate-200 bg-white px-3 h-10 text-[14px] font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
      @click="exportExcel(props.exportRows)"
    >
      <Icon icon="hugeicons:csv-01" class="size-5" />
      Export .csv
    </button>
  </div>
</template>
