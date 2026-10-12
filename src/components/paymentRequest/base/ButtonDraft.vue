<script setup>
defineProps({
  saving: {
    type: Boolean,
    default: false,
  },
});
defineEmits(["click"]);
</script>

<template>
  <button
    type="button"
    class="rounded-sm border border-slate-200 bg-white flex items-center justify-center py-2 w-full text-sm font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
    :disabled="saving"
    @click="$emit('click')"
  >
    Save As Draft
  </button>
</template>
