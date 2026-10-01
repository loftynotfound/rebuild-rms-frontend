<script setup>
defineProps({
  target: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close", "confirm"]);
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md rounded-xl bg-white shadow-2xl">
      <div class="border-b border-slate-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-slate-800">
          Cancel Payment Request
        </h2>
      </div>

      <div class="space-y-3 px-6 py-5 text-sm text-slate-600">
        <p>Are you sure you want to cancel this payment request?</p>

        <div class="rounded-lg bg-slate-50 p-3">
          <p class="font-semibold text-slate-800">
            {{ target?.rfpNumber }}
          </p>

          <p class="mt-1 text-slate-500">
            {{ target?.description }}
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
        <button
          type="button"
          class="rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
          @click="emit('close')"
        >
          Cancel
        </button>

        <button
          type="button"
          class="rounded-sm bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          @click="emit('confirm')"
        >
          Yes, Cancel PR
        </button>
      </div>
    </div>
  </div>
</template>
