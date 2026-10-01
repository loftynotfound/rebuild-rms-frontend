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
    class="group relative overflow-hidden rounded-md bg-white p-5 shadow-sm border-l-4 transition-all duration-200 ease-out cursor-pointer hover:-translate-y-1 hover:shadow-lg"
    :style="{ borderLeftColor: accent }"
  >
    <div class="flex items-start justify-between">
      <span
        class="hidden sm:flex items-center justify-center w-11 h-11 rounded-lg transition-transform duration-200 ease-out group-hover:scale-110"
        :style="{ backgroundColor: iconBg, color: accent }"
        aria-hidden="true"
      >
        <slot name="icon" />
      </span>

      <span v-if="badge" class="text-xs font-medium text-gray-500">
        {{ badge }}
      </span>
    </div>

    <p
      class="mt-4 sm:mt-4 text-sm font-medium tracking-wide text-gray-500 uppercase"
    >
      {{ label }}
    </p>
    <span
      class="value-text text-2xl font-bold text-gray-800 leading-none transition-colors duration-200"
      :style="{ '--accent-color': accent }"
    >
      {{ value }}
    </span>
  </div>
</template>

<style scoped>
.group:hover .value-text {
  color: var(--accent-color);
}
</style>
