<script setup>
import { reactive, ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  responsibleOptions: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(["update:modelValue", "add"]);
const newResponsible = reactive({ responsible: "", coa: "" });
const responsibleError = ref("");
const resetForm = () => {
  newResponsible.responsible = "";
  newResponsible.coa = "";
  responsibleError.value = "";
};
const close = () => {
  emit("update:modelValue", false);
};
const save = () => {
  const responsible = newResponsible.responsible.trim();
  const coa = newResponsible.coa.trim();

  if (!responsible) {
    responsibleError.value = "Responsible required.";
    return;
  }
  if (!coa) {
    responsibleError.value = "COA required.";
    return;
  }

  const exists = props.responsibleOptions.some(
    (item) =>
      item.responsible.toLowerCase() === responsible.toLowerCase() &&
      item.coa === coa,
  );

  if (exists) {
    responsibleError.value = "This responsible and COA already exist.";
    return;
  }

  emit("add", { responsible, coa });
  close();
};

watch(
  () => props.modelValue,
  (value) => {
    if (value) resetForm();
  },
);
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
  >
    <div class="w-full max-w-md rounded-sm bg-white p-6">
      <div class="flex flex-col pb-4 border-b border-slate-200">
        <span class="text-base font-semibold text-slate-800">
          Responsible & COA
        </span>
        <span class="text-sm text-slate-500"
          >Add new responsible and COA for payment request.</span
        >
      </div>

      <div class="mt-4 space-y-4">
        <div>
          <span class="block mb-2 text-sm font-medium text-slate-700"
            >Responsible</span
          >
          <input
            v-model="newResponsible.responsible"
            placeholder="Responsible Name"
            class="w-full cursor-pointer rounded-sm border border-slate-200 px-3 py-2.5 text-sm text-slate-600 outline-none transition-[border-color,box-shadow] duration-150 hover:ring-2 hover:ring-teal-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <span class="block mb-2 text-sm font-medium text-slate-700">COA</span>
          <input
            v-model="newResponsible.coa"
            placeholder="COA Name"
            class="w-full cursor-pointer rounded-sm border border-slate-200 px-3 py-2.5 text-sm text-slate-600 outline-none transition-[border-color,box-shadow] duration-150 hover:ring-2 hover:ring-teal-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <p
          v-if="responsibleError"
          class="p-2 bg-red-100 flex items-center gap-2 mt-2 text-xs text-red-500 rounded-sm border border-red-500"
        >
          <Icon icon="hugeicons:information-diamond" class="size-4" />
          {{ responsibleError }}
        </p>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-sm w-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          @click="close"
        >
          Cancel
        </button>

        <button
          type="button"
          class="rounded-sm w-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 cursor-pointer"
          @click="save"
        >
          Add
        </button>
      </div>
    </div>
  </div>
</template>
