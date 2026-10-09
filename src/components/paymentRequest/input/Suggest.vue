<script>
export default { inheritAttrs: false };
</script>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  // async (keyword) => [{ key, value, title, subtitle }]
  fetcher: { type: Function, required: true },
  minChars: { type: Number, default: 2 },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue", "select"]);

const options = ref([]);
const open = ref(false);
const loading = ref(false);
const root = ref(null);

let timer;
let seq = 0; // abaikan respons yang sudah usang

const search = (keyword) => {
  clearTimeout(timer);
  if (keyword.trim().length < props.minChars) {
    options.value = [];
    open.value = false;
    return;
  }
  timer = setTimeout(async () => {
    const mine = ++seq;
    loading.value = true;
    try {
      const result = await props.fetcher(keyword.trim());
      if (mine !== seq) return;
      options.value = result;
      open.value = result.length > 0;
    } catch {
      if (mine === seq) options.value = [];
    } finally {
      if (mine === seq) loading.value = false;
    }
  }, 300);
};

const onInput = (e) => {
  emit("update:modelValue", e.target.value);
  search(e.target.value);
};

const pick = (opt) => {
  emit("update:modelValue", opt.value);
  emit("select", opt);
  open.value = false;
};

const onOutside = (e) => {
  if (root.value && !root.value.contains(e.target)) open.value = false;
};

onMounted(() => document.addEventListener("mousedown", onOutside));
onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onOutside);
  clearTimeout(timer);
});
</script>

<template>
  <div ref="root" class="relative">
    <input
      v-bind="$attrs"
      :value="modelValue"
      :disabled="disabled"
      autocomplete="off"
      @input="onInput"
      @keydown.esc="open = false"
    />

    <div
      v-if="open && !disabled"
      class="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-sm border border-slate-200 bg-white p-1 shadow-xs"
    >
      <button
        v-for="opt in options"
        :key="opt.key"
        type="button"
        class="flex w-full flex-col rounded-sm px-3 py-2 text-left hover:bg-slate-100"
        @click="pick(opt)"
      >
        <span class="text-sm font-medium text-slate-700">{{ opt.title }}</span>
        <span v-if="opt.subtitle" class="text-[11px] text-slate-400">{{
          opt.subtitle
        }}</span>
      </button>
    </div>
    <p v-else-if="loading" class="mt-1 text-[11px] text-slate-400">
      Searching...
    </p>
  </div>
</template>
