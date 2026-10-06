<script setup>
import { ref } from "vue";
import api from "@/js/api";
import Modal from "@/components/ui/Modal.vue";

const props = defineProps({
  payment: { type: Object, required: true },
  money: { type: Function, required: true },
});
const emit = defineEmits(["close", "done"]);

const notes = ref("");
const saving = ref(false);
const error = ref("");

const submit = async () => {
  if (!notes.value.trim()) {
    error.value = "Cancellation reason is required.";
    return;
  }
  saving.value = true;
  error.value = "";
  try {
    await api.post(`/pr/payments/${props.payment.payment_id}/cancel`, {
      notes: notes.value.trim(),
    });
    emit("done");
  } catch (e) {
    error.value = e.response?.data?.message ?? "Failed to cancel the payment.";
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <Modal title="Cancel Payment" @close="emit('close')">
    <div class="space-y-4">
      <div class="rounded-sm bg-slate-50 p-3 text-sm">
        <p class="font-semibold capitalize text-slate-800">
          {{ payment.payment_stage.replace("_", " ") }}
        </p>
        <p class="text-slate-500">{{ money(payment.payment_amount) }}</p>
      </div>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-600">
          Reason <span class="text-red-500">*</span>
        </span>
        <textarea
          v-model="notes"
          rows="4"
          class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none"
          placeholder="Why is this payment cancelled?"
        />
        <span class="text-[11px] text-slate-500">
          The reason is saved as a comment on the request.
        </span>
      </label>

      <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="rounded-sm border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          :disabled="saving"
          @click="emit('close')"
        >
          Close
        </button>
        <button
          type="button"
          class="rounded-sm bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          :disabled="saving"
          @click="submit"
        >
          {{ saving ? "Saving..." : "Cancel Payment" }}
        </button>
      </div>
    </div>
  </Modal>
</template>