<script setup>
import { computed, reactive, ref } from "vue";
import api from "@/js/api";
import Modal from "@/components/ui/Modal.vue";

const props = defineProps({
  prId: { type: Number, required: true },
  requestedAmount: { type: Number, default: 0 },
  recordedAmount: { type: Number, default: 0 },
  defaults: { type: Object, default: () => ({}) },
  money: { type: Function, required: true },
});
const emit = defineEmits(["close", "done"]);

const STAGES = [
  { value: "down_payment", label: "Down Payment" },
  { value: "full_payment", label: "Full Payment" },
  { value: "final_payment", label: "Final Payment" },
];
const TYPES = [
  { value: "transfer", label: "Transfer" },
  { value: "cash", label: "Cash" },
];

const form = reactive({
  stage: "",
  type: props.defaults.type ?? "",
  amount: "",
  bank: props.defaults.bank ?? "",
  bank_account_no: props.defaults.bank_account_no ?? "",
  bank_account_name: props.defaults.bank_account_name ?? "",
  priority_date: "",
});

const remaining = computed(() =>
  Math.max(0, props.requestedAmount - props.recordedAmount),
);

const saving = ref(false);
const error = ref("");

const submit = async () => {
  error.value = "";
  if (!form.stage) return (error.value = "Payment stage required.");
  if (!form.type) return (error.value = "Payment method required.");
  if (!(Number(form.amount) > 0)) return (error.value = "Amount must be greater than 0.");

  saving.value = true;
  try {
    await api.post(`/pr/${props.prId}/payments`, {
      stage: form.stage,
      type: form.type,
      amount: Number(form.amount),
      bank: form.bank,
      bank_account_no: form.bank_account_no,
      bank_account_name: form.bank_account_name,
      priority_date: form.priority_date,
    });
    emit("done");
  } catch (e) {
    error.value = e.response?.data?.message ?? "Failed to record the payment.";
  } finally {
    saving.value = false;
  }
};

const field =
  "w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:border-teal-400 focus:outline-none";
</script>

<template>
  <Modal title="Record Payment" @close="emit('close')">
    <div class="space-y-3">
      <p class="rounded-sm bg-slate-50 p-3 text-xs text-slate-500">
        Requested {{ money(requestedAmount) }} · Recorded {{ money(recordedAmount) }} ·
        Remaining {{ money(remaining) }}
      </p>

      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-600">
            Stage <span class="text-red-500">*</span>
          </span>
          <select v-model="form.stage" :class="field">
            <option value="" disabled>Select stage</option>
            <option v-for="s in STAGES" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-600">
            Method <span class="text-red-500">*</span>
          </span>
          <select v-model="form.type" :class="field">
            <option value="" disabled>Select method</option>
            <option v-for="t in TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </label>
      </div>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-600">
          Amount <span class="text-red-500">*</span>
        </span>
        <input v-model="form.amount" type="number" min="0" placeholder="0" :class="field" />
      </label>

      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-600">Bank</span>
          <input v-model="form.bank" placeholder="Bank Name" :class="field" />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-600">Account No.</span>
          <input v-model="form.bank_account_no" inputmode="numeric" placeholder="Bank Account Number" :class="field" />
        </label>
      </div>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-600">Account Name</span>
        <input v-model="form.bank_account_name" placeholder="Bank Account Name" :class="field" />
      </label>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-600">
          Priority Date <span class="text-slate-400">(optional)</span>
        </span>
        <input v-model="form.priority_date" type="date" :class="field" />
      </label>

      <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="rounded-sm border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          :disabled="saving"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-sm bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
          :disabled="saving"
          @click="submit"
        >
          {{ saving ? "Saving..." : "Record" }}
        </button>
      </div>
    </div>
  </Modal>
</template>