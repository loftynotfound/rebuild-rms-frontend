<script setup>
import { computed } from "vue";

const props = defineProps({
  page: { type: Number, required: true },
  totalPage: { type: Number, required: true },
  totalData: { type: Number, required: true },
  perPage: { type: Number, required: true },
});

const emit = defineEmits(["change"]);

// Data range
const startData = computed(() => {
  if (props.totalData === 0) return 0;
  return (props.page - 1) * props.perPage + 1;
});

const endData = computed(() => {
  return Math.min(props.page * props.perPage, props.totalData);
});

// List of pages that are shown
const visiblePages = computed(() => {
  const total = props.totalPage;
  const current = props.page;
  const maxVisible = 3;

  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  let start = Math.max(1, current - 1);
  let end = start + maxVisible - 1;

  if (end > total) {
    end = total;
    start = end - maxVisible + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

function goTo(newPage) {
  if (newPage < 1 || newPage > props.totalPage || newPage === props.page)
    return;
  emit("change", newPage);
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="text-sm flex items-center gap-1.5 font-medium text-slate-600">
      <span>Showing</span>
      <span
        class="text-slate-600 h-8 min-w-8 px-2 flex items-center justify-center rounded-sm border border-slate-200"
        >{{ startData }}</span
      >
      <span>to</span>
      <span
        class="text-slate-600 h-8 min-w-8 px-2 flex items-center justify-center rounded-sm border border-slate-200"
        >{{ endData }}</span
      >
      <span>of</span>
      <span
        class="text-slate-600 h-8 min-w-8 px-2 flex items-center justify-center rounded-sm border border-slate-200"
        >{{ totalData }}</span
      >
      <span>entries</span>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-sm text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-100 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        :disabled="page === 1"
        aria-label="Previous page"
        @click="goTo(page - 1)"
      >
        <Icon icon="hugeicons:arrow-left-01" class="size-5" />
      </button>

      <button
        v-for="p in visiblePages"
        :key="p"
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-sm text-sm font-medium cursor-pointer transition-colors"
        :class="
          p === page
            ? 'bg-teal-500 text-white'
            : 'text-slate-600 hover:bg-slate-100'
        "
        @click="goTo(p)"
      >
        {{ p }}
      </button>

      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-sm text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-100 disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        :disabled="page === totalPage"
        aria-label="Next page"
        @click="goTo(page + 1)"
      >
        <Icon icon="hugeicons:arrow-right-01" class="size-5" />
      </button>
    </div>
  </div>
</template>
