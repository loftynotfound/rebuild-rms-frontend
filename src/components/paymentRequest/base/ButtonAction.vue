<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import BadgeLabel from "@/components/paymentRequest/base/BadgeLabel.vue";
import ModalDropdown from "@/components/paymentRequest/overlay/ModalDropdown.vue";

const props = defineProps({
  label: { type: String, default: "Action" },
  actions: { type: Array, default: () => [] },
});

const emit = defineEmits(["action"]);

const ACTION_ICONS = {
  view: "hugeicons:file-view",
  edit: "hugeicons:file-edit",
  submit: "hugeicons:file-input",
  approve: "hugeicons:file-security",
  revise: "hugeicons:file-exclamation-point",
  reject: "hugeicons:file-remove",
  cancel: "hugeicons:file-block",
  "cancel-request": "hugeicons:file-block",
  "follow-up": "hugeicons:file-add",
  complete: "hugeicons:file-validation",
  paid: "hugeicons:file-dollar",
  date: "hugeicons:file-management",
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
    <BadgeLabel :label="label" :disabled="open">
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
    </BadgeLabel>

    <ModalDropdown
      v-if="open"
      :options="options"
      placement="up"
      width-class="w-48"
      @select="onSelect"
    />
  </div>
</template>
