<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";

const props = defineProps({
  modelValue: { type: String, required: true },
  items: { type: Array, required: true },
  role: { type: String, default: "requester" },
});
defineEmits(["update:modelValue"]);

const iconMap = {
  All: "hugeicons:layers-01",
  draft: "hugeicons:edit-02",
  submitted: "hugeicons:sent",
  approved: "hugeicons:checkmark-circle-02",
  rejected: "hugeicons:cancel-circle",
  revision: "hugeicons:refresh",
  completed: "hugeicons:task-done-01",
  cancelled: "hugeicons:blocked",
  waiting: "hugeicons:clock-01",
  payment: "hugeicons:wallet-01",
  "cancel-requests": "hugeicons:alert-02",
  history: "hugeicons:checkmark-badge-01",
};

const LABELS = {
  checker: { waiting: "To Review", history: "Reviewed" },
  director: { waiting: "To Approve", history: "Decision History" },
  finance: {
    waiting: "To Approve",
    payment: "Payment Queue",
    "cancel-requests": "Cancellation Requests",
    history: "Decision History",
  },
};

const labelOf = (item) => LABELS[props.role]?.[item.key] ?? item.label;

const scrollerRef = ref(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function updateScrollState() {
  const el = scrollerRef.value;
  if (!el) return;
  canScrollLeft.value = el.scrollLeft > 4;
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
}

function scrollByAmount(amount) {
  scrollerRef.value?.scrollBy({ left: amount, behavior: "smooth" });
}

let resizeObserver;

onMounted(() => {
  nextTick(updateScrollState);
  scrollerRef.value?.addEventListener("scroll", updateScrollState, {
    passive: true,
  });
  resizeObserver = new ResizeObserver(updateScrollState);
  if (scrollerRef.value) resizeObserver.observe(scrollerRef.value);
});

onBeforeUnmount(() => {
  scrollerRef.value?.removeEventListener("scroll", updateScrollState);
  resizeObserver?.disconnect();
});
</script>

<template>
  <div class="relative flex items-center border-b border-slate-200">
    <button
      v-show="canScrollLeft"
      type="button"
      class="absolute left-0 z-10 flex size-8 cursor-pointer items-center justify-center rounded-sm border border-slate-200 bg-white transition-all duration-200 hover:bg-slate-50"
      @click="scrollByAmount(-160)">
      <Icon icon="hugeicons:arrow-left-01" class="size-4 text-slate-600" />
    </button>

    <div
      v-show="canScrollLeft"
      class="pointer-events-none absolute top-0 bottom-0 left-0 z-6 w-10 bg-linear-to-r from-white to-transparent duration-200" />

    <div
      ref="scrollerRef"
      class="scrollbarnone flex items-center overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden">
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        class="-mb-px inline-flex h-14 cursor-pointer items-center border-b-2 px-2 whitespace-nowrap transition-colors"
        :class="
          modelValue === item.key
            ? 'border-teal-500 text-teal-600'
            : 'border-transparent text-slate-600'
        "
        @click="$emit('update:modelValue', item.key)">
        <span
          class="inline-flex items-center gap-2 rounded-sm px-2 py-2 text-sm font-medium tracking-tight transition-colors"
          :class="modelValue !== item.key ? 'hover:bg-slate-100' : ''">
          <Icon
            v-if="iconMap[item.key]"
            :icon="iconMap[item.key]"
            class="size-4 shrink-0"
            aria-hidden="true" />

          {{ labelOf(item) }}

          <span
            v-if="item.count !== undefined"
            class="inline-flex h-5 min-w-5 items-center justify-center rounded-sm border px-1 text-[10px] font-medium"
            :class="
              modelValue === item.key
                ? 'border-teal-200 bg-teal-100 text-teal-600'
                : 'border-slate-200 bg-slate-100 text-slate-600'
            ">
            {{ item.count }}
          </span>
        </span>
      </button>
    </div>

    <div
      v-show="canScrollRight"
      class="pointer-events-none absolute top-0 right-0 bottom-0 z-5 w-10 bg-linear-to-l from-white to-transparent duration-200" />

    <button
      v-show="canScrollRight"
      type="button"
      class="absolute right-0 z-10 flex size-8 cursor-pointer items-center justify-center rounded-sm border border-slate-200 bg-white transition-all duration-200 hover:bg-slate-50"
      @click="scrollByAmount(160)">
      <Icon icon="hugeicons:arrow-right-01" class="size-4 text-slate-600" />
    </button>
  </div>
</template>
