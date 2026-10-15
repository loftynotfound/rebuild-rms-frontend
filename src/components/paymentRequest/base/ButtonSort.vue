<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import ModalDropdown from "@/components/paymentRequest/overlay/ModalDropdown.vue";

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
onBeforeUnmount(() => document.removeEventListener("mousedown", onOutsideClick));
</script>

<template>
  <div ref="el" class="relative inline-flex">
    <button
      type="button"
      class="flex h-10 cursor-pointer items-center justify-center gap-1 rounded-sm border border-slate-200 px-3 text-[14px] leading-none font-medium tracking-tight text-slate-600 transition-colors duration-150 hover:bg-slate-100"
      @click="isOpen = !isOpen">
      <Icon icon="hugeicons:arrow-up-down" class="size-5 shrink-0" />
      {{ selectedLabel }}
    </button>

    <ModalDropdown
      v-if="isOpen"
      :options="sortOptions"
      :model-value="modelValue"
      width-class="w-36"
      max-height-class="max-h-60"
      @select="select" />
  </div>
</template>
