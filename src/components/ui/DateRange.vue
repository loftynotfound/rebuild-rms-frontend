<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";

// Props & emits
const props = defineProps({
  modelValue: { type: Object, default: null },
  maxMonths: { type: Number, default: 2 },
  placeholder: { type: String, default: "Period" },
  error: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue", "error"]);

// State
const isOpen = ref(false);
const pickerEl = ref(null);
const triggerEl = ref(null);
const popupEl = ref(null);

const DESKTOP_WIDTH = 580;
const EDGE_GAP = 12;
const POPUP_GAP = 8;

const popupStyle = ref({});
const isDesktop = ref(true);

function getSidebarRightEdge() {
  const sidebarEl = document.querySelector("[data-app-sidebar]");
  if (!sidebarEl) return null;

  const rect = sidebarEl.getBoundingClientRect();
  if (rect.width <= 0 || rect.right <= 0) return null;

  return rect.right;
}

function computePosition() {
  if (!triggerEl.value) return;

  isDesktop.value = window.innerWidth >= 640;

  if (!isDesktop.value) {
    popupStyle.value = {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: "calc(100vw - 2rem)",
      maxHeight: "calc(100vh - 2rem)",
    };
    return;
  }

  const rect = triggerEl.value.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const sidebarRight = getSidebarRightEdge();
  const minLeft = sidebarRight != null ? sidebarRight + EDGE_GAP : EDGE_GAP;
  const maxLeft = vw - DESKTOP_WIDTH - EDGE_GAP;

  let left = rect.right - DESKTOP_WIDTH;
  left = Math.max(minLeft, Math.min(left, Math.max(maxLeft, minLeft)));

  const popupHeight = popupEl.value?.offsetHeight ?? 420;
  let top = rect.bottom + POPUP_GAP;
  if (top + popupHeight > vh - EDGE_GAP) {
    top = rect.top - popupHeight - POPUP_GAP;
    if (top < EDGE_GAP) top = EDGE_GAP;
  }

  popupStyle.value = {
    position: "fixed",
    left: `${left}px`,
    top: `${top}px`,
    width: `${DESKTOP_WIDTH}px`,
    maxWidth: `${DESKTOP_WIDTH}px`,
  };
}

function onOpen() {
  isOpen.value = true;
  nextTick(() => computePosition());
}

function onResizeOrScroll() {
  if (isOpen.value) computePosition();
}

// Display 2 months
const leftYear = ref(new Date().getFullYear());
const leftMonth = ref(new Date().getMonth());

const selecting = ref(null);
const hovered = ref(null);

const startDate = ref(props.modelValue?.start ?? null);
const endDate = ref(props.modelValue?.end ?? null);

function prevYear() {
  leftYear.value--;
}
function nextYear() {
  leftYear.value++;
}

const rightYear = computed(() =>
  leftMonth.value === 11 ? leftYear.value + 1 : leftYear.value,
);
const rightMonth = computed(() =>
  leftMonth.value === 11 ? 0 : leftMonth.value + 1,
);

function prevMonth() {
  if (leftMonth.value === 0) {
    leftMonth.value = 11;
    leftYear.value--;
  } else leftMonth.value--;
}
function nextMonth() {
  if (leftMonth.value === 11) {
    leftMonth.value = 0;
    leftYear.value++;
  } else leftMonth.value++;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toYMD(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toYMD(year, month, d));
  return cells;
}

const leftGrid = computed(() => buildGrid(leftYear.value, leftMonth.value));
const rightGrid = computed(() => buildGrid(rightYear.value, rightMonth.value));

function exceedsMax(start, end) {
  const s = new Date(start);
  const limit = new Date(s);
  limit.setMonth(limit.getMonth() + props.maxMonths);
  limit.setDate(limit.getDate() - 1);
  return new Date(end) > limit;
}

function fmtDisplay(ymd) {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

const displayLabel = computed(() => {
  if (startDate.value && endDate.value)
    return `${fmtDisplay(startDate.value)}  –  ${fmtDisplay(endDate.value)}`;
  if (startDate.value) return `${fmtDisplay(startDate.value)}  –  ...`;
  return "";
});

function cellState(ymd) {
  if (!ymd) return {};

  const rangeEnd = selecting.value ? (hovered.value ?? null) : endDate.value;
  const rangeStart = selecting.value ?? startDate.value;

  const isStart = ymd === (selecting.value ?? startDate.value);
  const isEnd = !selecting.value && ymd === endDate.value;
  const inRange = rangeStart && rangeEnd && ymd > rangeStart && ymd < rangeEnd;
  const isHoverEnd =
    selecting.value && ymd === hovered.value && ymd > selecting.value;

  const overLimit =
    selecting.value &&
    hovered.value &&
    ymd === hovered.value &&
    exceedsMax(selecting.value, hovered.value);

  return { isStart, isEnd, inRange, isHoverEnd, overLimit };
}

function selectDay(ymd) {
  if (!ymd) return;

  if (!selecting.value) {
    selecting.value = ymd;
    startDate.value = ymd;
    endDate.value = null;
    hovered.value = null;
    return;
  }

  let start = selecting.value;
  let end = ymd;

  if (end < start) [start, end] = [end, start];

  if (exceedsMax(start, end)) {
    emit("error", `Rentang filter maksimal ${props.maxMonths} bulan.`);
    return;
  }

  startDate.value = start;
  endDate.value = end;
  selecting.value = null;
  hovered.value = null;

  emit("update:modelValue", { start, end });
  emit("error", "");
  isOpen.value = false;
}

function onHover(ymd) {
  if (selecting.value) hovered.value = ymd;
}

function clear() {
  startDate.value = null;
  endDate.value = null;
  selecting.value = null;
  hovered.value = null;
  emit("update:modelValue", null);
  emit("error", "");
  document.activeElement?.blur();
}

function onOutsideClick(e) {
  const clickedTrigger = pickerEl.value && pickerEl.value.contains(e.target);
  const clickedPopup = popupEl.value && popupEl.value.contains(e.target);
  if (!clickedTrigger && !clickedPopup) {
    isOpen.value = false;
    if (selecting.value) {
      selecting.value = null;
      startDate.value = props.modelValue?.start ?? null;
      endDate.value = props.modelValue?.end ?? null;
    }
  }
}

onMounted(() => {
  document.addEventListener("mousedown", onOutsideClick);
  window.addEventListener("resize", onResizeOrScroll);
  window.addEventListener("scroll", onResizeOrScroll, true);
});
onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onOutsideClick);
  window.removeEventListener("resize", onResizeOrScroll);
  window.removeEventListener("scroll", onResizeOrScroll, true);
});

watch(
  () => props.modelValue,
  (val) => {
    startDate.value = val?.start ?? null;
    endDate.value = val?.end ?? null;
  },
);
</script>

<template>
  <div ref="pickerEl" class="relative block-w-full">
    <button
      ref="triggerEl"
      type="button"
      class="flex w-full items-center gap-1.5 rounded-sm border px-3 h-10 text-[14px] leading-none font-medium cursor-pointer tracking-tight focus:outline-none"
      :class="[
        error
          ? 'border-red-400 text-red-500 focus:border-red-400'
          : 'border-slate-200 text-slate-600 focus:border-teal-400',
        isOpen ? 'border border-teal-400' : 'border hover:border-teal-400',
      ]"
      @click="isOpen ? (isOpen = false) : onOpen()"
    >
      <Icon icon="hugeicons:calendar-04" class="size-5 shrink-0" />

      <span
        :class="
          displayLabel
            ? 'text-slate-600 tracking-tight'
            : 'text-slate-400 tracking-normal'
        "
      >
        {{ displayLabel || placeholder }}
      </span>

      <span
        v-if="startDate"
        class="ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-slate-600 hover:bg-slate-100"
        @mousedown.prevent
        @click.stop="clear"
      >
        <Icon icon="boxicons:x" class="size-5" />
      </span>
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40 sm:hidden"
        @click="isOpen = false"
      />

      <div
        v-if="isOpen"
        ref="popupEl"
        class="z-50 overflow-y-auto rounded-md border border-slate-200 bg-white p-3 shadow-xs sm:p-4 sm:overflow-visible"
        :style="popupStyle"
      >
        <div class="mb-2 flex items-center justify-between gap-1">
          <div class="flex items-center gap-0.5">
            <button
              type="button"
              class="shrink-0 rounded-sm cursor-pointer p-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Tahun sebelumnya"
              title="Tahun sebelumnya"
              @click="prevYear"
            >
              <Icon icon="hugeicons:arrow-left-double" class="size-5" />
            </button>
            <button
              type="button"
              class="shrink-0 rounded-sm cursor-pointer p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
              aria-label="Bulan sebelumnya"
              @click="prevMonth"
            >
              <Icon icon="hugeicons:arrow-left-01" class="size-5" />
            </button>
          </div>

          <div
            class="flex flex-1 justify-center gap-4 sm:gap-16 text-xs sm:text-sm font-bold text-slate-600 truncate"
          >
            <span>{{ MONTHS[leftMonth] }} {{ leftYear }}</span>
            <span class="hidden sm:inline"
              >{{ MONTHS[rightMonth] }} {{ rightYear }}</span
            >
          </div>

          <div class="flex items-center gap-0.5">
            <button
              type="button"
              class="shrink-0 rounded-sm cursor-pointer p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
              aria-label="Bulan berikutnya"
              @click="nextMonth"
            >
              <Icon icon="hugeicons:arrow-right-01" class="size-5" />
            </button>
            <button
              type="button"
              class="shrink-0 rounded-sm cursor-pointer p-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Tahun berikutnya"
              title="Tahun berikutnya"
              @click="nextYear"
            >
              <Icon icon="hugeicons:arrow-right-double" class="size-5" />
            </button>
          </div>
        </div>

        <div class="mb-4 text-center text-xs text-slate-600 sm:hidden">
          Swipe or use the arrows to view {{ MONTHS[rightMonth] }}.
        </div>

        <div class="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div class="flex-1 min-w-0">
            <div class="mb-2 grid grid-cols-7 text-center">
              <span
                v-for="d in DAYS"
                :key="d"
                class="py-1 text-[10px] font-medium uppercase tracking-wide text-slate-600"
                >{{ d }}</span
              >
            </div>
            <div class="grid grid-cols-7 gap-y-0.5">
              <template v-for="(ymd, i) in leftGrid" :key="i">
                <div
                  v-if="ymd"
                  class="relative flex aspect-square w-full max-h-9 cursor-pointer items-center justify-center text-xs transition-colors select-none"
                  :class="[
                    cellState(ymd).isStart || cellState(ymd).isEnd
                      ? 'z-10 rounded-sm bg-teal-500 font-semibold text-white'
                      : cellState(ymd).overLimit
                        ? 'rounded-sm bg-red-100 text-red-500 font-semibold'
                        : cellState(ymd).isHoverEnd
                          ? 'z-10 rounded-sm bg-teal-400 font-semibold text-white'
                          : cellState(ymd).inRange
                            ? 'bg-teal-50 text-teal-700'
                            : 'rounded-sm text-slate-700 hover:bg-slate-100',
                  ]"
                  @click="selectDay(ymd)"
                  @mouseenter="onHover(ymd)"
                  @mouseleave="hovered = null"
                >
                  {{ ymd.split("-")[2].replace(/^0/, "") }}
                </div>
                <div v-else />
              </template>
            </div>
          </div>

          <div class="hidden sm:block w-px bg-slate-100" />

          <div class="hidden sm:block flex-1 min-w-0">
            <div class="mb-2 grid grid-cols-7 text-center">
              <span
                v-for="d in DAYS"
                :key="d"
                class="py-1 text-[10px] font-medium uppercase tracking-wide text-slate-600"
                >{{ d }}</span
              >
            </div>
            <div class="grid grid-cols-7 gap-y-0.5">
              <template v-for="(ymd, i) in rightGrid" :key="i">
                <div
                  v-if="ymd"
                  class="relative flex aspect-square w-full max-h-9 cursor-pointer items-center justify-center text-xs transition-colors select-none"
                  :class="[
                    cellState(ymd).isStart || cellState(ymd).isEnd
                      ? 'z-10 rounded-sm bg-teal-500 font-semibold text-white'
                      : cellState(ymd).overLimit
                        ? 'rounded-sm bg-red-100 text-red-500 font-semibold'
                        : cellState(ymd).isHoverEnd
                          ? 'z-10 rounded-sm bg-teal-400 font-semibold text-white'
                          : cellState(ymd).inRange
                            ? 'bg-teal-50 text-teal-700'
                            : 'rounded-sm text-slate-700 hover:bg-slate-100',
                  ]"
                  @click="selectDay(ymd)"
                  @mouseenter="onHover(ymd)"
                  @mouseleave="hovered = null"
                >
                  {{ ymd.split("-")[2].replace(/^0/, "") }}
                </div>
                <div v-else />
              </template>
            </div>
          </div>
        </div>

        <div class="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <span v-if="selecting"
            >Select the end date, the maximum is {{ maxMonths }} months from the
            start date.</span
          >
          <span v-else>Click the start date to select a range.</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>
