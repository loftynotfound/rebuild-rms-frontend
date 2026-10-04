<script setup>
import { ref } from "vue";
import { usePaymentRequest } from "@/composables/paymentRequest/usePaymentRequest";

const { exportWord } = usePaymentRequest();

const props = defineProps({
  item: { type: Object, required: true },
});

const loading = ref(false);

const handleExport = async () => {
  loading.value = true;

  try {
    await exportWord(props.item);
  } catch (err) {
    alert(err.message);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <button
    type="button"
    :disabled="loading"
    @click="handleExport"
    class="flex w-full lg:w-auto items-center justify-center gap-2 rounded-sm border border-slate-200 bg-white px-3 h-10 text-sm font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
  >
    <Icon icon="hugeicons:arrow-down-03" class="h-5 w-5" />
    {{ loading ? "Exporting..." : "Export .docx" }}
  </button>
</template>
