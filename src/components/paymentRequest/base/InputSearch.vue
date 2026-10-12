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
      class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-600"
    />
    <input
      :value="modelValue"
      class="w-full h-10 tracking-tight text-slate-600 placeholder:text-slate-400 placeholder:tracking-normal rounded-sm border border-slate-200 hover:border-teal-400 pl-9 text-[14px] font-medium leading-none focus:border-teal-400 focus:outline-none focus:ring-0 focus:ring-offset-0"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>
