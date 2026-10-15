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
    class="flex w-full cursor-pointer items-center justify-center rounded-sm border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
    :disabled="saving"
    @click="$emit('click')">
    Save As Draft
  </button>
</template>
