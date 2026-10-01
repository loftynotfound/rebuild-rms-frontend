<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Dropdown from "@/components/paymentRequest/modal/Dropdown.vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);
const sortOptions = [
  { value: "new", label: "Newest" },
  { value: "old", label: "Oldest" },
];
const isOpen = ref(false);
const el = ref(null);

const selectedLabel = computed(() => {
  const found = sortOptions.find((opt) => opt.value === props.modelValue);
  return found ? found.label : "Sort";
});
function select(value) {
  emit("update:modelValue", value);
  isOpen.value = false;
}
function onOutsideClick(e) {
  if (el.value && !el.value.contains(e.target)) {
    isOpen.value = false;
  }
}

onMounted(() => document.addEventListener("mousedown", onOutsideClick));
onBeforeUnmount(() =>
  document.removeEventListener("mousedown", onOutsideClick),
);
</script>

<template>
  <div ref="el" class="relative inline-flex">
    <button
      type="button"
      class="flex h-10 px-3 text-[14px] leading-none tracking-tight font-medium gap-1 items-center justify-center rounded-sm border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors duration-150 cursor-pointer"
      @click="isOpen = !isOpen"
    >
      <Icon icon="hugeicons:arrow-up-down" class="size-5 shrink-0" />
      {{ selectedLabel }}
    </button>

    <Dropdown
      v-if="isOpen"
      :options="sortOptions"
      :model-value="modelValue"
      width-class="w-36"
      max-height-class="max-h-60"
      @select="select"
    />
  </div>
</template>
