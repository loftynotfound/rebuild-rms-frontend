<script setup>
import { computed, ref } from "vue";
import api from "@/js/api";
import { useAuthStore } from "@/stores/auth";

import Assign from "@/components/paymentRequest/modal/Assign.vue";
import RecordPayment from "@/components/paymentRequest/modal/RecordPayment.vue";
import CancelPayment from "@/components/paymentRequest/modal/CancelPayment.vue";

const props = defineProps({
  pr: { type: Object, required: true }, // { prId, rfpNumber, description, status, totalAmount }
  payments: { type: Array, default: () => [] },
  money: { type: Function, required: true },
  date: { type: Function, required: true },
});
const emit = defineEmits(["changed"]);

const STYLE = {
  draft: "bg-slate-100 text-slate-600 border border-slate-200",
  pending: "bg-amber-100 text-amber-600 border border-amber-200",
  paid: "bg-teal-100 text-teal-600 border border-teal-200",
  cancelled: "bg-red-100 text-red-600 border border-red-200",
};

const authStore = useAuthStore();
const me = computed(() => authStore.admin?.admin_id);
const can = (slug) => authStore.hasAccess(slug);

const canRecord = computed(
  () => can("create_pr_payment") && props.pr.status === "approved",
);

const recorded = computed(() =>
  props.payments
    .filter((p) => p.payment_status !== "cancelled")
    .reduce((s, p) => s + Number(p.payment_amount || 0), 0),
);

const error = ref("");

const run = async (fn, fallback) => {
  error.value = "";
  try {
    await fn();
    emit("changed");
  } catch (e) {
    error.value = e.response?.data?.message ?? fallback;
  }
};

// --- konfirmasi lunas ---
const confirmPaid = (p) => {
  if (!window.confirm(`Mark ${props.money(p.payment_amount)} as paid?`)) return;
  run(
    () => api.post(`/pr/payments/${p.payment_id}/confirm`),
    "Failed to confirm the payment.",
  );
};

// --- tanggal prioritas ---
const assignTarget = ref(null);
const showAssign = ref(false);

const openAssign = (p) => {
  assignTarget.value = {
    paymentId: p.payment_id,
    rfpNumber: props.pr.rfpNumber,
    description: props.pr.description,
    priorityDate: p.payment_priority_date ?? "",
  };
  showAssign.value = true;
};

const savePriorityDate = (priorityDate) =>
  run(
    () =>
      api.post(`/pr/payments/${assignTarget.value.paymentId}/priority-date`, {
        priority_date: priorityDate,
      }),
    "Failed to set the priority date.",
  );

// --- catat & batalkan ---
const showRecord = ref(false);
const cancelTarget = ref(null);

const onDone = () => {
  showRecord.value = false;
  cancelTarget.value = null;
  emit("changed");
};

// data bank dari pembayaran terakhir sebagai nilai awal form
const defaults = computed(() => {
  const last = [...props.payments].reverse().find((p) => p.payment_bank_account_no);
  return {
    type: last?.payment_type ?? "",
    bank: last?.payment_bank ?? "",
    bank_account_no: last?.payment_bank_account_no ?? "",
    bank_account_name: last?.payment_bank_account_name ?? "",
  };
});
</script>

<template>
  <div class="rounded-sm border border-slate-200 bg-white px-6 py-4">
    <div class="mb-2 flex items-center justify-between gap-2">
      <h2 class="text-sm font-semibold text-slate-900">Payments</h2>
      <button
        v-if="canRecord"
        type="button"
        class="rounded-sm bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-600"
        @click="showRecord = true"
      >
        Record Payment
      </button>
    </div>

    <p v-if="error" class="mb-2 text-xs text-red-500">{{ error }}</p>
    <p v-if="!payments.length" class="text-sm text-slate-400">No payment recorded.</p>

    <ul v-else class="divide-y divide-slate-200 text-sm">
      <li v-for="p in payments" :key="p.payment_id" class="space-y-1 py-3">
        <div class="flex items-center justify-between gap-2">
          <span class="capitalize text-slate-600">
            {{ p.payment_stage.replace("_", " ") }}
            <span class="text-xs text-slate-400">· {{ p.payment_type }}</span>
          </span>
          <span class="flex items-center gap-2 text-slate-900">
            {{ money(p.payment_amount) }}
            <span
              class="rounded-sm px-1.5 py-0.5 text-[11px] font-medium capitalize"
              :class="STYLE[p.payment_status] || STYLE.draft"
            >
              {{ p.payment_status }}
            </span>
          </span>
        </div>

        <p v-if="p.payment_bank_account_no" class="text-xs text-slate-500">
          {{ p.payment_bank }} · {{ p.payment_bank_account_no }} ·
          {{ p.payment_bank_account_name }}
        </p>
        <p class="text-[11px] text-slate-400">
          Recorded by {{ p.admin_input_name || "-" }} ·
          {{ date(p.payment_create_date) }}
          <template v-if="p.payment_priority_date">
            · Priority {{ date(p.payment_priority_date) }}
          </template>
          <template v-if="p.payment_status === 'paid'">
            · Paid by {{ p.admin_paid_name || "-" }}
            {{ date(p.payment_paid_date) }}
          </template>
        </p>

        <div v-if="p.payment_status === 'pending'" class="flex flex-wrap items-center gap-3 pt-1 text-xs font-medium">
          <button
            v-if="can('finance')"
            type="button"
            class="text-slate-600 hover:text-slate-800"
            @click="openAssign(p)"
          >
            Set Priority Date
          </button>

          <template v-if="can('confirm_pr_payment')">
            <span
              v-if="p.payment_ref_admin_input === me"
              class="text-slate-400"
            >
              Recorded by you, another admin must confirm.
            </span>
            <button
              v-else
              type="button"
              class="text-teal-600 hover:text-teal-700"
              @click="confirmPaid(p)"
            >
              Confirm Paid
            </button>

            <button
              type="button"
              class="text-red-500 hover:text-red-600"
              @click="cancelTarget = p"
            >
              Cancel Payment
            </button>
          </template>
        </div>
      </li>
    </ul>

    <p v-if="payments.length" class="mt-2 text-xs text-slate-500">
      Recorded {{ money(recorded) }} of {{ money(pr.totalAmount) }} requested.
    </p>

    <RecordPayment
      v-if="showRecord"
      :pr-id="pr.prId"
      :requested-amount="pr.totalAmount"
      :recorded-amount="recorded"
      :defaults="defaults"
      :money="money"
      @close="showRecord = false"
      @done="onDone"
    />

    <CancelPayment
      v-if="cancelTarget"
      :payment="cancelTarget"
      :money="money"
      @close="cancelTarget = null"
      @done="onDone"
    />

    <Assign v-model="showAssign" :item="assignTarget" @confirm="savePriorityDate" />
  </div>
</template>