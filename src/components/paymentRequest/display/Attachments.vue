<script setup>
import { computed, onMounted, ref, watch } from "vue";
import api from "@/js/api";
import { useAuthStore } from "@/stores/auth";
import { openDocument } from "@/composables/paymentRequest/useDownload";

const props = defineProps({
  prId: { type: Number, required: true },
  ownerId: { type: String, default: "" },
  status: { type: String, default: "" },
  date: { type: Function, required: true },
});

const MAX_SIZE = 10 * 1024 * 1024;
const TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];
const DOC_TYPES = [
  { value: "cost_control", label: "Cost Control" },
  { value: "quotation", label: "Quotation" },
  { value: "invoice", label: "Invoice" },
  { value: "contract", label: "Contract" },
  { value: "other", label: "Other" },
];
const label = (v) => DOC_TYPES.find((t) => t.value === v)?.label ?? v;

const authStore = useAuthStore();
const me = computed(() => authStore.admin?.admin_id);
const isOwner = computed(() => Boolean(me.value) && me.value === props.ownerId);

const docs = ref([]);
const loading = ref(false);
const uploading = ref(false);
const error = ref("");

const docType = ref("other");
const file = ref(null);
const fileInput = ref(null);

const fetchDocs = async () => {
  loading.value = true;
  try {
    docs.value = (await api.get(`/pr/${props.prId}/documents`)).data ?? [];
  } catch (e) {
    error.value = e.response?.data?.message ?? "Failed to load attachments.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchDocs);
watch(() => props.prId, fetchDocs);

const onFile = (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  if (!TYPES.includes(f.type)) {
    error.value = "File must be PDF, Word, JPG, or PNG.";
    return;
  }
  if (f.size > MAX_SIZE) {
    error.value = "Maximum file size is 10 MB.";
    return;
  }
  file.value = f;
  error.value = "";
};

const upload = async () => {
  if (!file.value) {
    error.value = "Choose a file first.";
    return;
  }
  uploading.value = true;
  error.value = "";
  try {
    const fd = new FormData();
    fd.append("document_type", docType.value);
    fd.append("file", file.value);
    await api.post(`/pr/${props.prId}/documents`, fd);

    file.value = null;
    if (fileInput.value) fileInput.value.value = "";
    await fetchDocs();
  } catch (e) {
    error.value = e.response?.data?.message ?? "Failed to upload the file.";
  } finally {
    uploading.value = false;
  }
};

const view = async (doc) => {
  error.value = "";
  try {
    await openDocument(
      `/pr/${props.prId}/documents/${doc.document_id}/preview`,
      doc.document_file_name,
    );
  } catch (e) {
    error.value = e.message;
  }
};

const canDelete = (doc) =>
  doc.document_ref_admin === me.value &&
  (doc.document_type !== "cost_control" ||
    ["draft", "revision"].includes(props.status));

const remove = async (doc) => {
  if (!window.confirm(`Delete ${doc.document_file_name}?`)) return;
  error.value = "";
  try {
    await api.delete(`/pr/${props.prId}/documents/${doc.document_id}`);
    await fetchDocs();
  } catch (e) {
    error.value = e.response?.data?.message ?? "Failed to delete the file.";
  }
};
</script>

<template>
  <div class="rounded-sm border border-slate-200 bg-white px-6 py-4">
    <h2 class="mb-2 text-sm font-semibold text-slate-900">Attachments</h2>

    <p v-if="error" class="mb-2 text-xs text-red-500">{{ error }}</p>
    <p v-if="loading" class="text-sm text-slate-400">Loading...</p>
    <p v-else-if="!docs.length" class="text-sm text-slate-400">
      No attachments.
    </p>

    <ul v-else class="divide-y divide-slate-200 text-sm">
      <li
        v-for="d in docs"
        :key="d.document_id"
        class="flex items-center justify-between gap-2 py-2"
      >
        <div class="min-w-0">
          <button
            type="button"
            class="block max-w-full truncate text-left font-medium text-teal-600 hover:text-teal-700"
            @click="view(d)"
          >
            {{ d.document_file_name }}
          </button>
          <p class="text-xs text-slate-400">
            {{ label(d.document_type) }}
            <span v-if="d.admin_name">· {{ d.admin_name }}</span>
            · {{ date(d.document_create_date) }}
          </p>
        </div>
        <button
          v-if="canDelete(d)"
          type="button"
          class="shrink-0 text-xs font-medium text-red-500 hover:text-red-600"
          @click="remove(d)"
        >
          Delete
        </button>
      </li>
    </ul>

    <div v-if="isOwner" class="mt-3 space-y-2 border-t border-slate-200 pt-3">
      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="docType"
          class="rounded-sm border border-slate-200 px-2 py-1.5 text-sm text-slate-600"
        >
          <option v-for="t in DOC_TYPES" :key="t.value" :value="t.value">
            {{ t.label }}
          </option>
        </select>
        <input
          ref="fileInput"
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          class="text-sm"
          @change="onFile"
        />
        <button
          type="button"
          class="rounded-sm bg-teal-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
          :disabled="uploading"
          @click="upload"
        >
          {{ uploading ? "Uploading..." : "Upload" }}
        </button>
      </div>
      <p class="text-[11px] text-slate-500">
        PDF, Word, JPG or PNG. Maximum file size is 10 MB.
      </p>
    </div>
  </div>
</template>
