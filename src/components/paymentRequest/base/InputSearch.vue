<script setup>
defineProps({
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: "Search" },
});
defineEmits(["update:modelValue"]);
</script>

<template>
  <div class="relative lg:min-w-0 lg:flex-1">
    <Icon
      icon="hugeicons:search-01"
      class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 cursor-pointer text-slate-600" />
    <input
      :value="modelValue"
      class="h-10 w-full rounded-sm border border-slate-200 pl-9 text-[14px] leading-none font-medium tracking-tight text-slate-600 placeholder:tracking-normal placeholder:text-slate-400 hover:border-teal-400 focus:border-teal-400 focus:ring-0 focus:ring-offset-0 focus:outline-none"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)" />
  </div>
</template>
