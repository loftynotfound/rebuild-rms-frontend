<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";

defineProps({
  modelValue: { type: String, required: true },
  items: { type: Array, required: true },
});
defineEmits(["update:modelValue"]);

const iconMap = {
  All: "hugeicons:files-01",
  draft: "hugeicons:file-edit",
  submitted: "hugeicons:file-clock",
  approved: "hugeicons:file-upload",
  rejected: "hugeicons:file-remove",
  revision: "hugeicons:file-input",
  completed: "hugeicons:file-validation",
  cancelled: "hugeicons:file-block",
};

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
      class="absolute left-0 z-10 flex items-center justify-center size-8 rounded-sm bg-white border border-slate-200 cursor-pointer transition-all duration-200 hover:bg-slate-50"
      @click="scrollByAmount(-160)"
    >
      <Icon icon="hugeicons:arrow-left-01" class="size-4 text-slate-600" />
    </button>

    <div
      v-show="canScrollLeft"
      class="pointer-events-none absolute left-0 top-0 bottom-0 w-10 z-6 bg-linear-to-r from-white to-transparent duration-200"
    />

    <div
      ref="scrollerRef"
      class="flex items-center overflow-x-auto scrollbarnone [&::-webkit-scrollbar]:hidden scroll-smooth"
    >
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        class="inline-flex items-center whitespace-nowrap h-14 px-2 border-b-2 -mb-px cursor-pointer transition-colors"
        :class="
          modelValue === item.key
            ? 'text-teal-600 border-teal-500'
            : 'text-slate-600 border-transparent'
        "
        @click="$emit('update:modelValue', item.key)"
      >
        <span
          class="inline-flex items-center gap-2 px-2 py-2 rounded-sm text-sm font-medium tracking-tight transition-colors"
          :class="modelValue !== item.key ? 'hover:bg-slate-100' : ''"
        >
          <Icon
            v-if="iconMap[item.key]"
            :icon="iconMap[item.key]"
            class="size-4 shrink-0"
            aria-hidden="true"
          />

          {{ item.label }}

          <span
            v-if="item.count !== undefined"
            class="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-sm text-[10px] font-medium border"
            :class="
              modelValue === item.key
                ? 'bg-teal-100 text-teal-600 border-teal-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            "
          >
            {{ item.count }}
          </span>
        </span>
      </button>
    </div>

    <div
      v-show="canScrollRight"
      class="pointer-events-none absolute right-0 top-0 bottom-0 w-10 z-5 bg-linear-to-l from-white to-transparent duration-200"
    />

    <button
      v-show="canScrollRight"
      type="button"
      class="absolute right-0 z-10 flex items-center justify-center size-8 rounded-sm bg-white border border-slate-200 cursor-pointer transition-all duration-200 hover:bg-slate-50"
      @click="scrollByAmount(160)"
    >
      <Icon icon="hugeicons:arrow-right-01" class="size-4 text-slate-600" />
    </button>
  </div>
</template>
