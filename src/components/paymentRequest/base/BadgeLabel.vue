<script setup>
defineProps({
  label: { type: String, required: true },
  disabled: { type: Boolean, default: false },
});
</script>

<template>
  <div class="group/label relative inline-flex">
    <slot />
    <span
      v-if="!disabled"
      class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity duration-150 group-hover/label:opacity-100"
    >
      {{ label }}
    </span>
  </div>
</template>
