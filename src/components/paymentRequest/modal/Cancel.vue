<script setup>
import { ref } from "vue";

defineProps({
  target: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits(["close", "confirm"]);

const notes = ref("");
const localError = ref("");

const confirm = () => {
  if (!notes.value.trim()) {
    localError.value = "Cancellation reason is required.";
    return;
  }
  localError.value = "";
  emit("confirm", notes.value.trim());
};
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
            {{ target?.prRfpNumber }}
          </p>
          <p class="mt-1 text-slate-500">
            {{ target?.prDescriptionItem }}
          </p>
        </div>

        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-600">
            Reason <span class="text-red-500">*</span>
          </span>
          <textarea
            v-model="notes"
            rows="3"
            class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none"
            placeholder="Why is this request cancelled?"
          />
        </label>

        <p v-if="localError || error" class="text-xs text-red-500">
          {{ localError || error }}
        </p>
      </div>

      <div class="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
        <button
          type="button"
          class="rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
          :disabled="loading"
          @click="emit('close')"
        >
          Close
        </button>

        <button
          type="button"
          class="rounded-sm bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          :disabled="loading"
          @click="confirm"
        >
          {{ loading ? "Cancelling..." : "Yes, Cancel PR" }}
        </button>
      </div>
    </div>
  </div>
</template>