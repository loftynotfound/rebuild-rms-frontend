<script setup>
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <div>
    <button
      type="button"
      class="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-sm bg-teal-500 px-3 text-[14px] leading-none font-medium tracking-tight text-white hover:bg-teal-600 lg:w-auto"
      @click="router.push('/payment-request/form')">
      <Icon icon="hugeicons:file-add" class="size-5" />
      Create Payment Request
    </button>
  </div>
</template>
