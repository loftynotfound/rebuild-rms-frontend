<script setup>
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <div>
    <button
      type="button"
      class="flex w-full leading-none lg:w-auto items-center justify-center gap-1.5 rounded-sm bg-teal-500 px-3 h-10 text-[14px] tracking-tight font-medium text-white hover:bg-teal-600 cursor-pointer"
      @click="router.push('/payment-request/form')"
    >
      <Icon icon="hugeicons:file-add" class="size-5" />
      Create Payment Request
    </button>
  </div>
</template>
