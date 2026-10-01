<script setup>
defineProps({
  title: { type: String, default: "" },
});

const emit = defineEmits(["close"]);
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-xl rounded-md bg-white shadow-lg">
      <div
        class="flex items-center justify-between border-b border-slate-200 px-6 py-4"
      >
        <h2 class="text-lg font-semibold text-slate-800">{{ title }}</h2>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600"
          aria-label="Tutup modal"
          @click="emit('close')"
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="px-6 py-5">
        <slot />
      </div>
    </div>
  </div>
</template>
