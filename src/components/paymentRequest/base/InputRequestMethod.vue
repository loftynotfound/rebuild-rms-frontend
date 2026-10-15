<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import ModalDropdown from "@/components/paymentRequest/overlay/ModalDropdown.vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  error: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue"]);

const options = [
  { value: "transfer", label: "Transfer" },
  { value: "cash", label: "Cash" },
];

const open = ref(false);
const root = ref(null);

const selectedLabel = computed(
  () => options.find((item) => item.value === props.modelValue)?.label ?? "",
);

const select = (value) => {
  emit("update:modelValue", value);
  open.value = false;
};

// Tutup dropdown kalau klik di luar komponen ini
const onOutsideClick = (event) => {
  if (root.value && !root.value.contains(event.target)) {
    open.value = false;
  }
};

onMounted(() => document.addEventListener("mousedown", onOutsideClick));
onBeforeUnmount(() => document.removeEventListener("mousedown", onOutsideClick));
</script>

<template>
  <div>
    <span class="mb-1 block text-sm font-medium text-slate-600">
      Payment Method
      <span class="text-red-500">*</span>
    </span>

    <div ref="root" class="relative w-full">
      <button
        type="button"
        class="block w-full cursor-pointer rounded-sm border border-slate-200 px-3 py-2 pr-8 text-left text-sm font-medium text-slate-600 hover:border-teal-400 focus:border-teal-400 focus:ring-0 focus:ring-offset-0 focus:outline-none"
        @click="open = !open">
        <span
          :class="
            selectedLabel ? 'tracking-tight text-slate-600' : 'tracking-normal text-slate-400'
          ">
          {{ selectedLabel || "Payment Method" }}
        </span>
      </button>
      <Icon
        icon="hugeicons:arrow-down-01"
        class="pointer-events-none absolute top-1/2 right-2.5 size-5 -translate-y-1/2 text-slate-600" />
      <ModalDropdown
        v-if="open"
        :options="options"
        :model-value="modelValue"
        width-class="w-full"
        @select="select" />
    </div>
  </div>
</template>
