<script setup>
defineProps({ status: { type: String, required: true } });

const styles = {
  draft: "bg-slate-100 text-slate-600 border border-slate-200",
  submitted: "bg-blue-100 text-blue-600 border border-blue-200",
  approved: "bg-blue-100 text-blue-600 border border-blue-200",
  revision: "bg-amber-100 text-amber-600 border border-amber-200",
  rejected: "bg-red-100 text-red-600 border border-red-200",
  cancelled: "bg-red-100 text-red-600 border border-red-200",
  completed: "bg-teal-100 text-teal-600 border border-teal-200",
};

const iconMap = {
  draft: "hugeicons:file-edit",
  submitted: "hugeicons:file-clock",
  revision: "hugeicons:file-input",
  approved: "hugeicons:file-upload",
  rejected: "hugeicons:file-remove",
  cancelled: "hugeicons:file-block",
  completed: "hugeicons:file-validation",
};
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-sm px-1 py-1 text-xs font-medium capitalize"
    :class="styles[status] || 'bg-slate-100 text-slate-600'"
  >
    <Icon
      v-if="iconMap[status]"
      :icon="iconMap[status]"
      class="size-3.5 shrink-0"
      aria-hidden="true"
    />
    {{ status || "-" }}
  </span>
</template>
