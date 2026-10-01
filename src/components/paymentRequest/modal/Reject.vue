<script setup>
import { ref } from "vue";
import Modal from "@/components/ui/Modal.vue";

const props = defineProps({
  title: { type: String, default: "Reject Payment Request" },
  loading: { type: Boolean, default: false },
});
const emit = defineEmits(["close", "submit"]);
const note = ref("");
const error = ref("");
const submit = () => {
  if (!note.value.trim()) {
    error.value = "Notes are required.";
    return;
  }
  emit("submit", note.value.trim());
};
</script>

<template>
  <Modal :title="title" @close="emit('close')">
    <div class="space-y-4">
      <p class="text-sm text-slate-500">
        Add a note explaining why this payment request is rejected. The
        requester can use this note when resubmitting.
      </p>
      <label>
        <span class="label">Notes *</span>
        <textarea
          v-model="note"
          rows="5"
          class="field"
          placeholder="Write rejection notes..."
        ></textarea>
      </label>
      <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          :disabled="loading"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          :disabled="loading"
          @click="submit"
        >
          {{ loading ? "Saving..." : "Reject PR" }}
        </button>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.label {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}
.field {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.62rem 0.75rem;
  font-size: 0.875rem;
  color: #334155;
  outline: none;
  resize: vertical;
}
.field:focus {
  border-color: #f87171;
  box-shadow: 0 0 0 2px rgb(248 113 113/0.12);
}
</style>
