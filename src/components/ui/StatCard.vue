<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [Number, String],
    default: 0,
  },
  accent: {
    type: String,
    default: "#01D2B1",
  },
  iconBg: {
    type: String,
    default: "#E3F7F3",
  },
  badge: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div
    class="group relative cursor-pointer overflow-hidden rounded-sm border border-l-4 border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
    :style="{ borderLeftColor: accent }">
    <div class="flex items-start justify-between">
      <span
        class="hidden h-11 w-11 items-center justify-center rounded-sm transition-transform duration-200 ease-out group-hover:scale-110 sm:flex"
        :style="{ backgroundColor: iconBg, color: accent }"
        aria-hidden="true">
        <slot name="icon" />
      </span>

      <span v-if="badge" class="text-xs font-medium text-gray-500">
        {{ badge }}
      </span>
    </div>

    <p class="mt-4 text-sm font-medium tracking-wide text-gray-500 uppercase sm:mt-4">
      {{ label }}
    </p>
    <span
      class="value-text text-2xl leading-none font-bold text-gray-800 transition-colors duration-200"
      :style="{ '--accent-color': accent }">
      {{ value }}
    </span>
  </div>
</template>

<style scoped>
.group:hover .value-text {
  color: var(--accent-color);
}
</style>
