<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import { usePaymentRequest } from "@/composables/paymentRequest/usePaymentRequest";
import { STATUS, PAYMENT_STATUS } from "@/composables/paymentRequest/useStore";

import Create from "@/components/paymentRequest/button/Create.vue";
import ExportExcel from "@/components/paymentRequest/button/ExportExcel.vue";
import Sort from "@/components/paymentRequest/button/Sort.vue";

import Reject from "@/components/paymentRequest/modal/Reject.vue";
import Cancel from "@/components/paymentRequest/modal/Cancel.vue";
import Signature from "@/components/paymentRequest/modal/Signature.vue";

import Segment from "@/components/paymentRequest/tab/Segment.vue";
import Search from "@/components/paymentRequest/input/Search.vue";
import Data from "@/components/paymentRequest/display/Data.vue";

import DateRange from "@/components/ui/DateRange.vue";
import Pagination from "@/components/ui/Pagination.vue";

defineProps({ user: { type: Object, default: null } });

const router = useRouter();

const {
  requests,
  money,
  date,
  cancelRequest,
  createCard,
  submitMany,
  approve,
  reject,
  revise,
  confirmPayment,
} = usePaymentRequest();

const status = ref("All");

const showCancelModal = ref(false);
const cancelTarget = ref(null);

const modal = ref(null);
const activeId = ref(null);

const dateRangeError = ref("");

// Status
const getStatus = (item) => item.prStatus;

const statusOptions = ["All", ...Object.values(STATUS)];

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const source = computed(() => {
  const list =
    status.value === "All"
      ? requests.value
      : requests.value.filter((item) => getStatus(item) === status.value);

  return [...list].sort((a, b) => a.prId - b.prId);
});

const data = createCard(source);

const dateRangeModel = computed({
  get: () =>
    data.dateFrom.value || data.dateTo.value
      ? {
          start: data.dateFrom.value,
          end: data.dateTo.value,
        }
      : null,

  set: (value) => {
    data.dateFrom.value = value?.start ?? "";
    data.dateTo.value = value?.end ?? "";
  },
});

const countByStatus = computed(() => {
  const map = {};

  for (const request of requests.value) {
    const s = getStatus(request);
    map[s] = (map[s] ?? 0) + 1;
  }

  return map;
});

const tabs = computed(() =>
  statusOptions.map((item) => ({
    key: item,
    label: capitalize(item),
    count:
      item === "All" ? requests.value.length : (countByStatus.value[item] ?? 0),
  })),
);

// Tab
const switchStatus = (value) => {
  status.value = value;
  data.page.value = 1;
};

// Navigation
const view = (item) => {
  router.push(`/payment-request/${item.prId}`);
};

const edit = (item) => {
  router.push(`/payment-request/form?id=${item.prId}`);
};

const submit = (id) => {
  submitMany([id]);
};

const openConfirm = (id) => {
  activeId.value = id;
  modal.value = "confirm";
};

const openReject = (item) => {
  activeId.value = item.prId;
  modal.value = "reject";
};

const openRevise = (item) => {
  activeId.value = item.prId;
  modal.value = "revise";
};

const confirmAction = () => {
  approve(activeId.value);
  closeModal();
};

const closeModal = () => {
  modal.value = null;
  activeId.value = null;
};

const rejectAction = (note) => {
  if (modal.value === "revise") revise(activeId.value, note);
  else reject(activeId.value, note);
  closeModal();
};

// Cancel
const openCancel = (item) => {
  cancelTarget.value = item;
  showCancelModal.value = true;
};

const closeCancel = () => {
  cancelTarget.value = null;
  showCancelModal.value = false;
};

const confirmCancel = () => {
  cancelRequest(cancelTarget.value.prId);
  closeCancel();
};

// Payment
const firstPendingPayment = (item) =>
  item.payments.find((p) => p.paymentStatus === PAYMENT_STATUS.PENDING);

const payFirst = (item) => {
  const payment = firstPendingPayment(item);
  if (payment) confirmPayment(item.prId, payment.paymentId);
};

// Actions by status
const ACTIONS_BY_STATUS = {
  draft: [
    { key: "view", label: "View" },
    { key: "edit", label: "Edit" },
    { key: "submit", label: "Submit" },
    { key: "cancel", label: "Cancel" },
  ],
  submitted: [
    { key: "view", label: "View" },
    { key: "approve", label: "Mark As Approved" },
    { key: "revise", label: "Request Revision" },
    { key: "reject", label: "Reject" },
    { key: "cancel", label: "Cancel" },
  ],
  revision: [
    { key: "view", label: "View" },
    { key: "edit", label: "Edit" },
    { key: "submit", label: "Submit" },
    { key: "cancel", label: "Cancel" },
  ],
  approved: [
    { key: "view", label: "View" },
    { key: "pay", label: "Confirm Payment" },
  ],
};

const DEFAULT_ACTIONS = [{ key: "view", label: "View" }];

const getActions = (item) =>
  ACTIONS_BY_STATUS[getStatus(item)] ?? DEFAULT_ACTIONS;

const handleAction = (item, key) => {
  switch (key) {
    case "view":
      return view(item);
    case "edit":
      return edit(item);
    case "submit":
      return submit(item.prId);
    case "approve":
      return openConfirm(item.prId);
    case "reject":
      return openReject(item);
    case "revise":
      return openRevise(item);
    case "cancel":
      return openCancel(item);
    case "pay":
      return payFirst(item);
  }
};
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-slate-800">Request Overview</h1>

    <div
      class="flex flex-col px-4 py-4 rounded-sm border border-slate-200 bg-white shadow-xs"
    >
      <div class="pb-6">
        <Segment
          :model-value="status"
          :items="tabs"
          @update:model-value="switchStatus"
        />
      </div>

      <div
        class="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-6"
      >
        <div class="flex flex-wrap items-center gap-2">
          <Search class="w-72" v-model="data.search.value" />

          <DateRange
            class="w-50"
            v-model="dateRangeModel"
            :error="dateRangeError"
            @error="dateRangeError = $event"
          />

          <Sort v-model="data.sort.value" />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <ExportExcel :export-rows="data.filteredCard.value" />

          <Create />
        </div>
      </div>

      <section>
        <Data
          :rows="data.card.value"
          :money="money"
          :date="date"
          :status="getStatus"
          :get-actions="getActions"
          @action="handleAction"
        />

        <div>
          <Pagination
            class="pt-4"
            :page="data.page.value"
            :total-page="data.totalPages.value"
            :total-data="data.filteredCard.value.length"
            :per-page="data.perPage.value"
            @change="data.goToPage"
          />
        </div>
      </section>
    </div>
  </div>

  <Cancel
    v-if="showCancelModal"
    :target="cancelTarget"
    @close="closeCancel"
    @confirm="confirmCancel"
  />

  <Signature
    v-if="modal === 'confirm'"
    title="Confirm Payment Request"
    role-label="Confirmed By"
    submit-label="Confirm"
    @close="closeModal"
    @submit="confirmAction"
  />

  <Reject
    v-if="modal === 'reject' || modal === 'revise'"
    :title="modal === 'revise' ? 'Request Revision' : 'Reject Payment Request'"
    @close="closeModal"
    @submit="rejectAction"
  />
</template>
