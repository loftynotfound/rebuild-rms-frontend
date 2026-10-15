<script setup>
import BadgeStatus from "@/components/paymentRequest/base/BadgeStatus.vue";
import ButtonAction from "@/components/paymentRequest/base/ButtonAction.vue";

const props = defineProps({
  rows: {
    type: Array,
    required: true,
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
  selectable: {
    type: Function,
    default: () => false,
  },
  selected: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(["action", "toggle"]);
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <div
      v-for="row in props.rows"
      :key="row.prId"
      :class="props.selected.includes(row.prId) && 'ring-1 ring-teal-400'"
      class="flex flex-col gap-3 rounded-sm border border-slate-200 bg-white p-4 shadow-xs">
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col gap-1">
          <span class="flex items-center gap-2 text-sm leading-none font-semibold text-slate-800">
            <input
              v-if="props.selectable(row)"
              type="checkbox"
              class="size-4 cursor-pointer accent-teal-500"
              :checked="props.selected.includes(row.prId)"
              @change="$emit('toggle', row)" />
            #{{ row.prId }}
            <span class="size-1 rounded-full bg-slate-800"></span>
            {{ row.prRfpNumber }}
          </span>
        </div>
        <BadgeStatus :status="props.status(row)" />
      </div>

      <dl class="text-xs">
        <div class="flex flex-row items-center justify-between border-b border-slate-200 py-3">
          <dt class="flex items-center gap-1 text-slate-400">
            <Icon icon="hugeicons:money-01" class="size-4" />
            Total Amount:
          </dt>
          <dd class="font-medium text-slate-800">
            {{ props.money(row.prRequestedAmount) }}
          </dd>
        </div>

        <div class="flex flex-row items-center justify-between border-b border-slate-200 py-3">
          <dt class="flex items-center gap-1 text-slate-400">
            <Icon icon="hugeicons:shopping-cart-01" class="size-4" />
            PO Number:
          </dt>
          <dd class="font-medium text-slate-800">
            {{ row.prPoNumber || "PO BELUM RELEASE" }}
          </dd>
        </div>

        <div class="flex flex-row items-center justify-between border-b border-slate-200 py-3">
          <dt class="flex items-center gap-1 text-slate-400">
            <Icon icon="hugeicons:customer-support" class="size-4" />
            Responsible:
          </dt>
          <dd class="font-medium text-slate-800">
            {{ row.responsibleName }}
          </dd>
        </div>

        <div class="flex flex-row items-center justify-between border-b border-slate-200 py-3">
          <dt class="flex items-center gap-1 text-slate-400">
            <Icon icon="hugeicons:user" class="size-4" />
            PIC:
          </dt>
          <dd class="font-medium text-slate-800">{{ row.adminName }}</dd>
        </div>

        <div class="flex flex-row items-center justify-between border-b border-slate-200 py-3">
          <dt class="flex items-center gap-1 text-slate-400">
            <Icon icon="hugeicons:calendar-04" class="size-4" />
            Created At:
          </dt>
          <dd class="font-medium text-slate-800">
            {{ props.date(row.prCreateDate) }}
          </dd>
        </div>
      </dl>

      <div class="flex justify-end">
        <ButtonAction
          :actions="props.getActions(row)"
          @action="(key) => $emit('action', row, key)" />
      </div>
    </div>
  </div>
</template>
