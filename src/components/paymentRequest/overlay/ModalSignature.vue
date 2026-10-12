<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import Modal from "@/components/ui/Modal.vue";

const props = defineProps({
  title: { type: String, default: "Confirm Action" },
  roleLabel: { type: String, default: "Checked By" },
  submitLabel: { type: String, default: "Confirm" },
  loading: { type: Boolean, default: false },
});
const emit = defineEmits(["close", "submit"]);
const authStore = useAuthStore();

const name = ref("");
const signature = ref("");
const error = ref("");

onMounted(() => {
  name.value = authStore.admin?.admin_name || authStore.admin?.username || "";
  signature.value =
    localStorage.getItem("rms_profile_signature") ||
    authStore.admin?.signature ||
    "";
});

const onFile = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
    error.value = "Signature must be JPG or PNG.";
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    error.value = "Maximum signature file size is 2 MB.";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    signature.value = reader.result;
    error.value = "";
  };
  reader.readAsDataURL(file);
};

const submit = () => {
  if (!name.value.trim()) {
    error.value = `${props.roleLabel} is required.`;
    return;
  }
  if (!signature.value) {
    error.value = "Upload signature is required.";
    return;
  }
  emit("submit", { name: name.value.trim(), signature: signature.value });
};
</script>

<template>
  <Modal :title="title" @close="emit('close')">
    <div class="space-y-4">
      <p class="text-sm text-slate-500">
        Complete the signer information before confirming this action.
      </p>
      <label>
        <span class="label">{{ roleLabel }} *</span>
        <input v-model="name" class="field bg-slate-50" readonly />
      </label>
      <div>
        <span class="label">Signature *</span>
        <div
          class="flex min-h-24 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <img
            v-if="signature"
            :src="signature"
            alt="Profile signature"
            class="h-16 max-w-44 object-contain"
          />
          <span v-else class="text-xs text-red-500"
            >No signature found. Please set your signature in My Profile.</span
          >
        </div>
      </div>
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
          class="rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
          :disabled="loading"
          @click="submit"
        >
          {{ loading ? "Saving..." : submitLabel }}
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
}
.field:focus {
  border-color: #2dd4bf;
  box-shadow: 0 0 0 2px rgb(45 212 191/0.12);
}
</style>
