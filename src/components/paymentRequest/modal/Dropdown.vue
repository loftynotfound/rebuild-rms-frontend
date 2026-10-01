<script setup>
defineProps({
  options: { type: Array, required: true },
  modelValue: { type: String, default: "" },
  widthClass: { type: String, default: "w-36" },
  maxHeightClass: { type: String, default: "max-h-60" },
  placement: { type: String, default: "down" },
});
defineEmits(["select"]);
</script>

<template>
  <div
    class="absolute right-0 z-50 mt-2 overflow-y-auto rounded-sm border tracking-tight font-medium border-slate-200 bg-white p-1 shadow-xs flex flex-col gap-1"
    :class="[
      widthClass,
      maxHeightClass,
      placement === 'up' ? 'bottom-full mb-2' : 'top-full mt-2',
    ]"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="flex w-full items-center rounded-sm px-3 py-2 text-left text-sm cursor-pointer"
      :class="
        opt.value === modelValue
          ? 'bg-teal-500 text-white'
          : 'text-slate-600 hover:bg-slate-100'
      "
      @click="$emit('select', opt.value)"
    >
      <Icon v-if="opt.icon" :icon="opt.icon" class="mr-2 size-4 shrink-0" />
      {{ opt.label }}
    </button>
  </div>
</template>
