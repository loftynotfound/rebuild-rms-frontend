<script setup>
defineProps({
  saving: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <button
    type="submit"
    class="w-full cursor-pointer rounded-sm bg-teal-500 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
    :disabled="saving">
    {{ saving ? "Saving..." : "Submit New Request" }}
  </button>
</template>
