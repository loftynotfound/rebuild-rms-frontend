<script setup>
import Status from "@/components/paymentRequest/badge/Status.vue";
import Action from "@/components/paymentRequest/button/Action.vue";

defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  money: {
    type: Function,
    required: true,
  },
  date: {
    type: Function,
    required: true,
  },
  status: {
    type: Function,
    required: true,
  },
  getActions: {
    type: Function,
    required: true,
  },
});

defineEmits(["action"]);
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <div
      v-for="row in rows"
      :key="row.prId"
      class="flex flex-col gap-3 rounded-sm border border-slate-200 bg-white p-4 shadow-xs"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col gap-1">
          <span
            class="flex items-center gap-2 text-sm font-semibold text-slate-800 leading-none"
          >
            #{{ row.prId }}
            <span class="size-1 rounded-full bg-slate-800"></span>
            {{ row.prRfpNumber }}
          </span>
        </div>
        <Status :status="status(row)" />
      </div>

      <dl class="text-xs">
        <div
          class="flex flex-row justify-between items-center py-3 border-b border-slate-200"
        >
          <dt class="text-slate-400 flex gap-1 items-center">
            <Icon icon="hugeicons:money-01" class="size-4" />
            Total Amount:
          </dt>
          <dd class="font-medium text-slate-800">
            {{ money(row.prRequestedAmount) }}
          </dd>
        </div>

        <div
          class="flex flex-row justify-between items-center py-3 border-b border-slate-200"
        >
          <dt class="text-slate-400 flex gap-1 items-center">
            <Icon icon="hugeicons:shopping-cart-01" class="size-4" />
            PO Number:
          </dt>
          <dd class="font-medium text-slate-800">
            {{ row.prPoNumber || "PO BELUM RELEASE" }}
          </dd>
        </div>

        <div
          class="flex flex-row justify-between items-center py-3 border-b border-slate-200"
        >
          <dt class="text-slate-400 flex gap-1 items-center">
            <Icon icon="hugeicons:customer-support" class="size-4" />
            Responsible:
          </dt>
          <dd class="font-medium text-slate-800">
            {{ row.responsibleName }}
          </dd>
        </div>

        <div
          class="flex flex-row justify-between items-center py-3 border-b border-slate-200"
        >
          <dt class="text-slate-400 flex gap-1 items-center">
            <Icon icon="hugeicons:user" class="size-4" />
            PIC:
          </dt>
          <dd class="font-medium text-slate-800">{{ row.adminName }}</dd>
        </div>

        <div
          class="flex flex-row justify-between items-center py-3 border-b border-slate-200"
        >
          <dt class="text-slate-400 flex gap-1 items-center">
            <Icon icon="hugeicons:calendar-04" class="size-4" />
            Created At:
          </dt>
          <dd class="font-medium text-slate-800">
            {{ date(row.prCreateDate) }}
          </dd>
        </div>
      </dl>

      <div class="flex justify-end">
        <Action
          :actions="getActions(row)"
          @action="(key) => $emit('action', row, key)"
        />
      </div>
    </div>
  </div>
</template>
