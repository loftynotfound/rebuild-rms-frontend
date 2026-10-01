<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import Label from "@/components/paymentRequest/badge/Label.vue";
import Dropdown from "@/components/paymentRequest/modal/Dropdown.vue";

const props = defineProps({
  label: { type: String, default: "Action" },
  actions: { type: Array, default: () => [] },
});

const emit = defineEmits(["action"]);

const ACTION_ICONS = {
  view: "hugeicons:file-view",
  submit: "hugeicons:file-input",
  resubmit: "hugeicons:file-upload",
  edit: "hugeicons:file-edit",
  review: "hugeicons:file-verified",
  approve: "hugeicons:file-security",
  date: "hugeicons:file-management",
  paid: "hugeicons:file-dollar",
  complete: "hugeicons:file-validation",
  reject: "hugeicons:file-remove",
  cancel: "hugeicons:file-block",
  delete: "hugeicons:file-shredder",
};

const open = ref(false);
const root = ref(null);

const options = computed(() =>
  props.actions.map((a) => ({
    value: a.key,
    label: a.label,
    icon: ACTION_ICONS[a.key],
  })),
);

function onSelect(value) {
  open.value = false;
  emit("action", value);
}

function onClickOutside(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false;
}

onMounted(() => document.addEventListener("click", onClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", onClickOutside));
</script>

<template>
  <div ref="root" class="relative inline-flex">
    <Label :label="label" :disabled="open">
      <button
        type="button"
        class="group flex cursor-pointer items-center justify-center border border-slate-200 h-8 w-8 rounded-sm text-slate-600 hover:bg-slate-100"
        :aria-label="label"
        :aria-expanded="open"
        aria-haspopup="menu"
        @click="open = !open"
      >
        <Icon icon="hugeicons:more-vertical" class="size-5" />
      </button>
    </Label>

    <Dropdown
      v-if="open"
      :options="options"
      placement="up"
      width-class="w-48"
      @select="onSelect"
    />
  </div>
</template>
