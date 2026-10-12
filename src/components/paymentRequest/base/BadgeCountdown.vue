<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
  value: { type: String, default: "" }, // YYYY-MM-DD
});

const DAY = 86_400_000;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const parse = (ymd) => {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

const now = ref(new Date());
let timer;

onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 60_000);
});
onBeforeUnmount(() => clearInterval(timer));

const days = computed(() => {
  if (!props.value) return null;
  const target = parse(props.value);
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((target - startOfDay(now.value)) / DAY);
});

const label = computed(() => {
  const n = days.value;
  if (n === null) return "";
  if (n === 0) return "Due today";
  if (n === 1) return "Due tomorrow";
  if (n > 1) return `${n} days left`;
  if (n === -1) return "Overdue by 1 day";
  return `Overdue by ${Math.abs(n)} days`;
});

const tone = computed(() => {
  const n = days.value;
  if (n === null) return "";
  if (n < 0) return "bg-red-100 text-red-600 border-red-200";
  if (n <= 1) return "bg-amber-100 text-amber-600 border-amber-200";
  return "bg-teal-100 text-teal-600 border-teal-200";
});
</script>

<template>
  <span
    v-if="days !== null"
    class="inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium"
    :class="tone"
  >
    <Icon icon="hugeicons:clock-01" class="size-3.5 shrink-0" />
    {{ label }}
  </span>
</template>
