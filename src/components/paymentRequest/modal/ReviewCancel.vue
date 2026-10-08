<script setup>
import { computed, ref } from "vue";
import Modal from "@/components/ui/Modal.vue";

const props = defineProps({
  target: { type: Object, required: true },
  mode: { type: String, required: true }, // approve | reject
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});
const emit = defineEmits(["close", "confirm"]);

const MAX_NOTES = 500;
const notes = ref("");
const localError = ref("");
const isReject = computed(() => props.mode === "reject");

const submit = () => {
  if (isReject.value && !notes.value.trim()) {
    localError.value = "Rejection reason is required.";
    return;
  }
  localError.value = "";
  emit("confirm", notes.value.trim());
};
</script>

<template>
  <Modal
    :title="
      isReject ? 'Reject Cancellation Request' : 'Approve Cancellation Request'
    "
    @close="emit('close')"
  >
    <div class="space-y-4">
      <div class="rounded-sm bg-slate-50 p-3 text-sm">
        <p class="font-semibold text-slate-800">{{ target.rfp_no }}</p>
        <p class="mt-1 text-slate-500">{{ target.pr_description_item }}</p>
      </div>

      <p v-if="!isReject" class="text-sm text-slate-500">
        Approving will cancel this payment request. This cannot be undone.
      </p>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-600">
          Notes
          <span v-if="isReject" class="text-red-500">*</span>
          <span v-else class="text-slate-400">(optional)</span>
        </span>
        <textarea
          v-model="notes"
          rows="4"
          :maxlength="MAX_NOTES"
          class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none"
          :placeholder="
            isReject
              ? 'Why is this request rejected?'
              : 'Add a note for the requester'
          "
        />
        <span class="text-[11px] text-slate-500"
          >{{ notes.length }}/{{ MAX_NOTES }}</span
        >
      </label>

      <p v-if="localError || error" class="text-xs text-red-500">
        {{ localError || error }}
      </p>

      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="rounded-sm border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          :disabled="loading"
          @click="emit('close')"
        >
          Close
        </button>
        <button
          type="button"
          class="rounded-sm px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          :class="
            isReject
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-teal-500 hover:bg-teal-600'
          "
          :disabled="loading"
          @click="submit"
        >
          {{ loading ? "Saving..." : isReject ? "Reject" : "Approve" }}
        </button>
      </div>
    </div>
  </Modal>
</template>
