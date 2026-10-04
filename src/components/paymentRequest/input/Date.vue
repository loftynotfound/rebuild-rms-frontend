<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";

const props = defineProps({
  modelValue: { type: String, default: null },
  placeholder: { type: String, default: "Select date" },
  error: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue", "error"]);

const isOpen = ref(false);
const pickerEl = ref(null);
const triggerEl = ref(null);
const popupEl = ref(null);

const DESKTOP_WIDTH = 300;
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

  let left = rect.left;
  left = Math.max(minLeft, Math.min(left, Math.max(maxLeft, minLeft)));

  const popupHeight = popupEl.value?.offsetHeight ?? 340;
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

function ymdParts(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m: m - 1, d };
}

const initial = props.modelValue ? ymdParts(props.modelValue) : null;
const viewYear = ref(initial ? initial.y : new Date().getFullYear());
const viewMonth = ref(initial ? initial.m : new Date().getMonth());

const selectedDate = ref(props.modelValue ?? null);

function prevYear() {
  viewYear.value--;
}
function nextYear() {
  viewYear.value++;
}
function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11;
    viewYear.value--;
  } else viewMonth.value--;
}
function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0;
    viewYear.value++;
  } else viewMonth.value++;
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

const grid = computed(() => buildGrid(viewYear.value, viewMonth.value));

function fmtDisplay(ymd) {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

const displayLabel = computed(() => fmtDisplay(selectedDate.value));

function isToday(ymd) {
  const today = new Date();
  return ymd === toYMD(today.getFullYear(), today.getMonth(), today.getDate());
}

function selectDay(ymd) {
  if (!ymd) return;
  selectedDate.value = ymd;
  emit("update:modelValue", ymd);
  emit("error", "");
  isOpen.value = false;
}

function clear() {
  selectedDate.value = null;
  emit("update:modelValue", null);
  emit("error", "");
  document.activeElement?.blur();
}

function onOutsideClick(e) {
  const clickedTrigger = pickerEl.value && pickerEl.value.contains(e.target);
  const clickedPopup = popupEl.value && popupEl.value.contains(e.target);
  if (!clickedTrigger && !clickedPopup) {
    isOpen.value = false;
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
    selectedDate.value = val ?? null;
    if (val) {
      const p = ymdParts(val);
      viewYear.value = p.y;
      viewMonth.value = p.m;
    }
  },
);
</script>

<template>
  <div ref="pickerEl" class="relative block w-full">
    <button
      ref="triggerEl"
      type="button"
      class="flex w-full items-center gap-1.5 rounded-sm border pl-3 pr-3 py-2 text-sm cursor-pointer font-medium focus:outline-none focus:ring-0 focus:ring-offset-0"
      :class="[
        error
          ? 'border-red-400 text-red-500 focus:border-red-400'
          : 'border-slate-200 text-slate-600 focus:border-teal-400',
        isOpen
          ? 'border border-teal-400'
          : 'hover:border hover:border-teal-400',
      ]"
      @click="isOpen ? (isOpen = false) : onOpen()"
    >
      <Icon
        icon="hugeicons:calendar-02"
        class="size-5 text-slate-600 shrink-0"
      />

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
        v-if="selectedDate"
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
        class="z-50 overflow-y-auto rounded-md border border-slate-200 bg-white p-3 shadow-xs sm:overflow-visible"
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
            class="flex flex-1 justify-center text-xs sm:text-sm font-bold text-slate-600 truncate"
          >
            <span>{{ MONTHS[viewMonth] }} {{ viewYear }}</span>
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

        <div class="min-w-0">
          <div class="mb-2 grid grid-cols-7 text-center">
            <span
              v-for="d in DAYS"
              :key="d"
              class="py-1 text-[10px] font-medium uppercase tracking-wide text-slate-600"
              >{{ d }}</span
            >
          </div>
          <div class="grid grid-cols-7 gap-y-0.5">
            <template v-for="(ymd, i) in grid" :key="i">
              <div
                v-if="ymd"
                class="relative flex aspect-square w-full max-h-9 cursor-pointer items-center justify-center text-xs transition-colors select-none"
                :class="[
                  ymd === selectedDate
                    ? 'z-10 rounded-sm bg-teal-500 font-semibold text-white'
                    : isToday(ymd)
                      ? 'rounded-sm text-teal-600 font-semibold bg-teal-50 hover:bg-slate-100'
                      : 'rounded-sm text-slate-700 hover:bg-slate-100',
                ]"
                @click="selectDay(ymd)"
              >
                {{ ymd.split("-")[2].replace(/^0/, "") }}
              </div>
              <div v-else />
            </template>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
