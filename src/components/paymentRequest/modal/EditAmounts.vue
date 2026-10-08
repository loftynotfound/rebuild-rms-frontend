<script setup>
import { computed, reactive, ref } from "vue";
import api from "@/js/api";
import Modal from "@/components/ui/Modal.vue";

const props = defineProps({
  target: { type: Object, required: true }, // { prId, poAmount, cogs, poNoRaw }
});
const emit = defineEmits(["close", "done"]);

const form = reactive({
  poAmount: props.target.poAmount ?? 0,
  hpp: props.target.cogs ?? 0,
  poNo: props.target.poNoRaw ?? "",
});

const margin = computed(
  () => Number(form.poAmount || 0) - Number(form.hpp || 0),
);
const marginPct = computed(() => {
  const po = Number(form.poAmount || 0);
  return po ? ((margin.value / po) * 100).toFixed(1) : "0.0";
});

const saving = ref(false);
const error = ref("");

const submit = async () => {
  error.value = "";
  if (Number(form.poAmount) < 0 || Number(form.hpp) < 0) {
    error.value = "Amounts cannot be negative.";
    return;
  }
  saving.value = true;
  try {
    await api.post(`/pr/${props.target.prId}/amounts`, {
      po_amount: Number(form.poAmount || 0),
      hpp: Number(form.hpp || 0),
      po_no: form.poNo.trim(),
    });
    emit("done");
  } catch (e) {
    error.value = e.response?.data?.message ?? "Failed to update the amounts.";
  } finally {
    saving.value = false;
  }
};

const field =
  "w-full rounded-sm border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:border-teal-400 focus:outline-none";
</script>

<template>
  <Modal title="Edit Amounts" @close="emit('close')">
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-600"
            >PO Amount</span
          >
          <input v-model="form.poAmount" type="number" min="0" :class="field" />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-600"
            >HPP (COGS)</span
          >
          <input v-model="form.hpp" type="number" min="0" :class="field" />
        </label>
      </div>

      <p
        class="rounded-sm border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-teal-800"
      >
        Margin: <strong>{{ margin.toLocaleString("id-ID") }}</strong> ({{
          marginPct
        }}%)
      </p>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-600"
          >PO Number</span
        >
        <input
          v-model="form.poNo"
          placeholder="PO BELUM RELEASE"
          :class="field"
        />
        <span class="text-[11px] text-slate-500">
          Must be an existing PO with status prepared, progress, or complete.
        </span>
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
          {{ saving ? "Saving..." : "Save" }}
        </button>
      </div>
    </div>
  </Modal>
</template>
