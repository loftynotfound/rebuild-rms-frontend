<script setup>
import { ref } from "vue";
import Modal from "@/components/ui/Modal.vue";

defineProps({
  target: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});
const emit = defineEmits(["close", "submit"]);

const MAX_REASON = 1200;
const MAX_SIZE = 10 * 1024 * 1024;
const TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

const reason = ref("");
const file = ref(null);
const localError = ref("");

const onFile = (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  if (!TYPES.includes(f.type)) {
    localError.value = "File must be PDF, Word, JPG, or PNG.";
    return;
  }
  if (f.size > MAX_SIZE) {
    localError.value = "Maximum file size is 10 MB.";
    return;
  }
  file.value = f;
  localError.value = "";
};

const submit = () => {
  if (!reason.value.trim()) {
    localError.value = "Reason summary is required.";
    return;
  }
  if (!file.value) {
    localError.value = "Official report (berita acara) is required.";
    return;
  }
  emit("submit", { reason: reason.value.trim(), file: file.value });
};
</script>

<template>
  <Modal title="Request Cancellation" @close="emit('close')">
    <div class="space-y-4">
      <p class="text-sm text-slate-500">
        This request will be reviewed by finance. Attach the official report
        (berita acara) as the basis for the cancellation.
      </p>
      <div class="rounded-sm bg-slate-50 p-3 text-sm">
        <p class="font-semibold text-slate-800">{{ target?.prRfpNumber }}</p>
        <p class="mt-1 text-slate-500">{{ target?.prDescriptionItem }}</p>
      </div>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-600"
          >Reason *</span
        >
        <textarea
          v-model="reason"
          rows="4"
          :maxlength="MAX_REASON"
          class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none"
          placeholder="Summarize why this request should be cancelled"
        />
        <span class="text-[11px] text-slate-500"
          >{{ reason.length }}/{{ MAX_REASON }}</span
        >
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-600"
          >Official Report *</span
        >
        <input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          class="text-sm"
          @change="onFile"
        />
        <span class="block text-[11px] text-slate-500"
          >PDF, Word, JPG or PNG. Max 10 MB.</span
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
          class="rounded-sm bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          :disabled="loading"
          @click="submit"
        >
          {{ loading ? "Sending..." : "Send Request" }}
        </button>
      </div>
    </div>
  </Modal>
</template>
