<script setup>
import { onBeforeUnmount, onMounted, ref, computed } from "vue";
import api from "@/js/api";
import { useAuthStore } from "@/stores/auth";
import Modal from "@/components/ui/Modal.vue";

const props = defineProps({ 
  target: { type: Object, default: null},
  targets: {type: Array, default: ()=>[]}
 });
const list = computed(() => 
  props.targets.length ? props.targets : props.target ? [props.target] : [],)
const isBulk = computed(() => list.value.length > 1)
const emit = defineEmits(["close", "done"]);
const adminName = ref("");

const MAX_SIZE = 2 * 1024 * 1024;
const authStore = useAuthStore();

const loading = ref(true);
const saving = ref(false);
const error = ref("");

const signatureId = ref(null);
const checkers = ref([]);
const checker = ref("");

const mode = ref("draw"); // draw | upload
const file = ref(null);
const filePreview = ref("");
const hasInk = ref(false);

// --- data dari DB ---
const fetchSignature = async () => {
  try {
    const res = await api.get("/admins/me/signature");
    signatureId.value = res.data?.signature_id ?? res.data?.id ?? null;
  } catch (e) {
    if (e.response?.status !== 404) throw e;
    signatureId.value = null;
  }
};

onMounted(async () => {
  try {
    const me = authStore.admin?.admin_id;
    const [, res, meRes] = await Promise.all([
      fetchSignature(),
      api.get("/admins/checkers"),
      me ? api.get(`/admins/${me}`) : null,
    ]);
    adminName.value = meRes?.data?.admin_name ?? "";
    checkers.value = (res.data ?? [])
      .filter((a) => a.admin_id !== me)
      .map((a) => ({ value: a.admin_id, label: a.admin_name }));
  } catch {
    error.value = "Failed to load signature and checker data.";
  } finally {
    loading.value = false;
  }
});

// --- canvas ---
const canvas = ref(null);
let drawing = false;

const ctx2d = () => canvas.value.getContext("2d");

const point = (e) => {
  const r = canvas.value.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.value.width / r.width),
    y: (e.clientY - r.top) * (canvas.value.height / r.height),
  };
};

const start = (e) => {
  drawing = true;
  canvas.value.setPointerCapture(e.pointerId);
  const p = point(e);
  const ctx = ctx2d();
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
};

const move = (e) => {
  if (!drawing) return;
  const p = point(e);
  const ctx = ctx2d();
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#0f172a";
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  hasInk.value = true;
};

const end = () => {
  drawing = false;
};

const clearCanvas = () => {
  ctx2d().clearRect(0, 0, canvas.value.width, canvas.value.height);
  hasInk.value = false;
};

// --- upload file ---
const onFile = (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  if (!["image/png", "image/jpeg"].includes(f.type)) {
    error.value = "Signature must be a PNG or JPG image.";
    return;
  }
  if (f.size > MAX_SIZE) {
    error.value = "Maximum signature file size is 2 MB.";
    return;
  }
  if (filePreview.value) URL.revokeObjectURL(filePreview.value);
  file.value = f;
  filePreview.value = URL.createObjectURL(f);
  error.value = "";
};

onBeforeUnmount(() => {
  if (filePreview.value) URL.revokeObjectURL(filePreview.value);
});

// --- submit ---
const registerSignature = async () => {
  if (!adminName.value) throw new Error("Could not load your name. Please reload and try again.");

  let blob;
  let name = "signature.png";

  if (mode.value === "draw") {
    if (!hasInk.value) throw new Error("Draw your signature first.");
    blob = await new Promise((resolve) =>
      canvas.value.toBlob(resolve, "image/png"),
    );
  } else {
    if (!file.value) throw new Error("Choose a signature image first.");
    blob = file.value;
    name = file.value.name;
  }

  const fd = new FormData();
  fd.append("file", blob, name);
  fd.append("name_pic", adminName.value);
  const res = await api.post("/admins/me/signature", fd);

  signatureId.value = res.data?.signature_id ?? null;
  if (!signatureId.value) await fetchSignature(); // cadangan bila respons berubah
  if (!signatureId.value)
    throw new Error("Signature uploaded but could not be loaded.");
};

const submit = async () => {
  error.value = "";
  if (!checker.value) {
    error.value = "Checker required.";
    return;
  }

  saving.value = true;
  try {
    if (!signatureId.value) await registerSignature();

    if (isBulk.value){
      const res = await api.post("/pr/bulk-submit", {
        signature_id : signatureId.value,
        default_checker_id : checker.value,
        items : list.value.map((i) => ({pr_id: i.prId ?? i.pr_id}))
      });
      emit("done", res.data ?? []);
    }
    const t = list.value[0];
    await api.post(`/pr/${t.prId ?? t.pr_id}/submit`, {
      checker_id : checker.value,
      signature_id : signatureId.value,
    });
    emit("done")
  } catch (e) {
    error.value =
      e.response?.data?.message ?? e.message ?? "Failed to submit request.";
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <Modal :title="isBulk ? `submit ${list.length} payment Request` : 'Submit Payment Request'" @close="emit('close')">
    <div v-if="loading" class="py-8 text-center text-sm text-slate-400">
      Loading...
    </div>

    <div v-else class="space-y-4">
      <div v-if="!isBulk" class="rounded-sm bg-slate-50 p-3 text-sm">
        <p class="font-semibold text-slate-800">
          {{ list[0]?.prRfpNumber ?? list[0]?.pr_rfp_no }}
        </p>
        <p class="mt-1 text-slate-500">
          {{ list[0]?.prDescriptionItem ?? list[0]?.pr_description_item }}
        </p>
      </div>
      <div v-else class="rounded-sm bg-slate-50 p-3 text-sm">
        <p class="font-semibold text-slate-800">{{ list.length }} requests selected</p>
        <p class="mt-1 max-h-24 overflow-y-auto text-xs text-slate-500">
          {{ list.map((i) => i.prRfpNumber).join(", ") }}
        </p>
      </div>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-600">
          Checker <span class="text-red-500">*</span>
        </span>
        <select
          v-model="checker"
          class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
        >
          <option value="" disabled>Select checker</option>
          <option v-for="c in checkers" :key="c.value" :value="c.value">
            {{ c.label }}
          </option>
        </select>
        <span class="text-[11px] text-slate-500">
          The person who checks this request.
        </span>
      </label>

      <!-- signature sudah terdaftar -->
      <div
        v-if="signatureId"
        class="flex items-center gap-2 rounded-sm border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-teal-800"
      >
        <Icon icon="hugeicons:security-check" class="size-5 shrink-0" />
        Your signature is already registered and will be used.
      </div>

      <!-- belum terdaftar: tanda tangan dulu -->
      <div v-else class="space-y-2">
        <span class="block text-sm font-medium text-slate-600">
          Signature <span class="text-red-500">*</span>
        </span>
        <p class="text-xs text-slate-500">
          You have no signature yet. Sign below or upload an image; it will be
          saved for your next submissions.
        </p>

        <div class="flex gap-1 rounded-sm bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            class="flex-1 rounded-sm py-1.5"
            :class="mode === 'draw' ? 'bg-white text-teal-600' : 'text-slate-600'"
            @click="mode = 'draw'"
          >
            Draw
          </button>
          <button
            type="button"
            class="flex-1 rounded-sm py-1.5"
            :class="mode === 'upload' ? 'bg-white text-teal-600' : 'text-slate-600'"
            @click="mode = 'upload'"
          >
            Upload Image
          </button>
        </div>

        <div v-show="mode === 'draw'">
          <canvas
            ref="canvas"
            width="480"
            height="180"
            class="w-full touch-none rounded-sm border border-slate-200 bg-white"
            @pointerdown="start"
            @pointermove="move"
            @pointerup="end"
            @pointerleave="end"
          />
          <button
            type="button"
            class="mt-1 text-xs font-medium text-slate-500 hover:text-slate-700"
            @click="clearCanvas"
          >
            Clear
          </button>
        </div>

        <div v-show="mode === 'upload'" class="space-y-2">
          <input
            type="file"
            accept="image/png,image/jpeg"
            class="text-sm"
            @change="onFile"
          />
          <span class="block text-[11px] text-slate-500">
            PNG or JPG. Maximum file size is 2 MB.
          </span>
          <img
            v-if="filePreview"
            :src="filePreview"
            alt="Signature preview"
            class="h-20 max-w-full rounded-sm border border-slate-200 bg-white object-contain p-1"
          />
        </div>
      </div>

      <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="rounded-sm border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          :disabled="saving"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-sm bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
          :disabled="saving"
          @click="submit"
        >
          {{ saving ? "Submitting..." : "Submit" }}
        </button>
      </div>
    </div>
  </Modal>
</template>