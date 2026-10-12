<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  item: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "confirm"]);

const priorityDate = ref("");
const priorityError = ref("");

watch(
  () => props.item,
  (val) => {
    priorityDate.value = val?.priorityDate || "";
    priorityError.value = "";
  },
  { immediate: true },
);

const close = () => {
  priorityError.value = "";
  emit("update:modelValue", false);
};

const confirm = () => {
  if (!priorityDate.value) {
    priorityError.value = "Tanggal prioritas wajib diisi.";
    return;
  }

  emit("confirm", priorityDate.value);
  close();
};
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
    @click.self="close"
  >
    <div class="w-full max-w-md rounded-xl bg-white shadow-2xl">
      <div
        class="flex items-center justify-between border-b border-slate-200 px-6 py-4"
      >
        <div>
          <p
            class="text-xs font-semibold uppercase tracking-wide text-teal-600"
          >
            Priority Payment
          </p>

          <h2 class="text-lg font-semibold text-slate-800">
            Set Priority Date
          </h2>
        </div>

        <button
          type="button"
          class="text-slate-400 hover:text-slate-600"
          aria-label="Close"
          @click="close"
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-4 px-6 py-5">
        <div class="rounded-lg bg-slate-50 p-4 text-sm">
          <p class="font-semibold text-slate-800">
            {{ item?.rfpNumber }}
          </p>

          <p class="mt-1 text-slate-500">
            {{ item?.description }}
          </p>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">
            Date Priority <span class="text-rose-500">*</span>
          </label>

          <input
            v-model="priorityDate"
            type="date"
            class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />

          <p class="mt-1.5 text-xs text-slate-500">
            Tanggal kapan PR ini akan diprioritaskan untuk dibayar, bukan
            tanggal pembayarannya.
          </p>

          <p v-if="priorityError" class="mt-1.5 text-xs text-rose-600">
            {{ priorityError }}
          </p>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            @click="close"
          >
            Cancel
          </button>

          <button
            type="button"
            class="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            @click="confirm"
          >
            Save Priority
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
