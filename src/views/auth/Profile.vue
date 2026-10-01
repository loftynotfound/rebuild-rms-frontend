<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useAdminProfile } from "@/composables/auth/useProfile";

const {
  form,
  loading,
  saving,
  sendingReset,
  error,
  roleOptions,
  regionOptions,
  isPic,
  isPicClient,
  saveProfile,
  sendPasswordReset,
  goBack,
} = useAdminProfile();

const canvas = ref(null);
const drawing = ref(false);
const hasDrawing = ref(false);
let ctx;
function resizeCanvas() {
  if (!canvas.value) return;
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.value.getBoundingClientRect();
  canvas.value.width = rect.width * ratio;
  canvas.value.height = 180 * ratio;
  ctx = canvas.value.getContext("2d");
  ctx.scale(ratio, ratio);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#1f2937";
}
function position(e) {
  const r = canvas.value.getBoundingClientRect();
  const p = e.touches?.[0] || e;
  return { x: p.clientX - r.left, y: p.clientY - r.top };
}
function startDraw(e) {
  drawing.value = true;
  const p = position(e);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
}
function draw(e) {
  if (!drawing.value) return;
  const p = position(e);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  hasDrawing.value = true;
}
function stopDraw() {
  drawing.value = false;
  ctx?.closePath();
}
function clearDraw() {
  if (!ctx) return;
  const r = canvas.value.getBoundingClientRect();
  ctx.clearRect(0, 0, r.width, r.height);
  hasDrawing.value = false;
  form.signature = "";
}
function useDrawnSignature() {
  if (!hasDrawing.value) return;
  form.signature = canvas.value.toDataURL("image/png");
}
function useUploadSignature(e) {
  handleSignature(e);
  hasDrawing.value = false;
}
onMounted(() => {
  window.addEventListener("resize", resizeCanvas);
  setTimeout(resizeCanvas, 0);
});
onBeforeUnmount(() => window.removeEventListener("resize", resizeCanvas));

async function handleSave() {
  const ok = await saveProfile();
  if (ok) {
    // TODO: swap for toast notification component once available
    alert("Profile updated successfully");
  }
}

const handleSignature = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
    alert("Signature must be JPG or PNG.");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    alert("Maximum signature file size is 2 MB.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    form.signature = reader.result;
  };
  reader.readAsDataURL(file);
};

async function handlePasswordReset() {
  const ok = await sendPasswordReset();
  if (ok) {
    alert("Password reset email has been sent");
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-4 sm:mb-6 flex items-center gap-3">
      <button
        type="button"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-slate-200 text-slate-500 hover:bg-slate-50"
        aria-label="Back to dashboard"
        @click="goBack"
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <h1 class="text-lg sm:text-xl font-semibold text-slate-800">
        My Profile
      </h1>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="rounded-md border border-slate-200 bg-white p-12 text-center text-sm text-slate-400"
    >
      Loading...
    </div>

    <!-- Error State (no data loaded at all) -->
    <div
      v-else-if="error && !form.email"
      class="rounded-md border border-slate-200 bg-white p-12 text-center text-sm text-red-500"
    >
      {{ error }}
    </div>

    <!-- Form -->
    <form
      v-else
      class="rounded-md border border-slate-200 bg-white shadow-sm"
      @submit.prevent="handleSave"
    >
      <div
        class="grid grid-cols-1 gap-x-6 gap-y-5 px-4 sm:px-6 py-4 sm:py-6 sm:grid-cols-2"
      >
        <!-- Email -->
        <div>
          <label
            class="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500"
            for="email"
          >
            Email *
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <!-- Username -->
        <div>
          <label
            class="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500"
            for="username"
          >
            Username *
          </label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            required
            class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <!-- Admin Role -->
        <div>
          <label
            class="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500"
            for="role"
          >
            Admin Role *
          </label>
          <select
            id="role"
            v-model="form.role_id"
            required
            class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option :value="null" disabled>Select role</option>
            <option
              v-for="role in roleOptions"
              :key="role.role_id"
              :value="role.role_id"
            >
              {{ role.role_title }}
            </option>
          </select>
        </div>

        <!-- Region -->
        <div>
          <label
            class="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500"
            for="region"
          >
            Region *
          </label>
          <select
            id="region"
            v-model="form.region_id"
            required
            class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option :value="null" disabled>Select region</option>
            <option
              v-for="region in regionOptions"
              :key="region.region_id"
              :value="region.region_id"
            >
              {{ region.region_title }}
            </option>
          </select>
        </div>

        <!-- Account Signature -->
        <div class="sm:col-span-2">
          <label
            class="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500"
            >Signature</label
          >
          <div
            class="rounded-sm border border-slate-200 bg-slate-50 p-4 space-y-4"
          >
            <div
              class="flex min-h-24 items-center justify-center rounded-sm border border-slate-200 bg-white p-3"
            >
              <img
                v-if="form.signature"
                :src="form.signature"
                alt="Account signature"
                class="max-h-20 max-w-full object-contain"
              />
              <span v-else class="text-xs text-slate-400"
                >No signature saved</span
              >
            </div>
            <div>
              <p class="mb-2 text-sm font-semibold text-slate-700">
                Draw your signature
              </p>
              <div
                class="overflow-hidden rounded-sm border border-dashed border-slate-300 bg-white"
              >
                <canvas
                  ref="canvas"
                  class="block h-[180px] w-full touch-none cursor-crosshair"
                  @mousedown="startDraw"
                  @mousemove="draw"
                  @mouseup="stopDraw"
                  @mouseleave="stopDraw"
                  @touchstart.prevent="startDraw"
                  @touchmove.prevent="draw"
                  @touchend.prevent="stopDraw"
                  @vue:mounted="resizeCanvas"
                />
              </div>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  @click="clearDraw"
                >
                  Clear
                </button>
                <button
                  type="button"
                  class="rounded-sm bg-teal-500 px-3 py-2 text-sm font-medium text-white hover:bg-teal-600"
                  @click="useDrawnSignature"
                >
                  Use Drawn Signature
                </button>
                <label
                  class="cursor-pointer rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >Upload Signature<input
                    type="file"
                    accept="image/png,image/jpeg"
                    class="hidden"
                    @change="useUploadSignature"
                /></label>
              </div>
            </div>
          </div>
          <p class="mt-1 text-xs text-slate-400">
            One account uses one saved signature. Draw directly or upload an
            image, then Save Changes.
          </p>
        </div>

        <!-- Active PIC RMS -->
        <div class="flex items-center gap-3 sm:col-span-2">
          <input
            id="pic"
            v-model="isPic"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-300 text-teal-500 focus:ring-teal-500"
          />
          <label class="text-sm text-slate-700" for="pic"
            >Active PIC RMS *</label
          >
        </div>

        <!-- Admin Client -->
        <div class="flex items-center gap-3 sm:col-span-2">
          <input
            id="picClient"
            v-model="isPicClient"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-300 text-teal-500 focus:ring-teal-500"
          />
          <label class="text-sm text-slate-700" for="picClient"
            >Admin Client *</label
          >
        </div>
      </div>

      <!-- Inline error (e.g. save failed but data still shown) -->
      <p v-if="error && form.email" class="px-4 sm:px-6 text-sm text-red-500">
        {{ error }}
      </p>

      <!-- Actions -->
      <div
        class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 px-4 sm:px-6 py-4"
      >
        <button
          type="button"
          class="flex w-full sm:w-auto items-center justify-center gap-2 rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="sendingReset"
          @click="handlePasswordReset"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          {{ sendingReset ? "Sending..." : "Change Password" }}
        </button>

        <button
          type="submit"
          class="flex w-full sm:w-auto items-center justify-center gap-2 rounded-sm bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="saving"
        >
          {{ saving ? "Saving..." : "Save Changes" }}
        </button>
      </div>
    </form>
  </div>
</template>
