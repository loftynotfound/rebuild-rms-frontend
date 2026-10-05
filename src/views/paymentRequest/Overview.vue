<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { usePaymentRequest } from "@/composables/paymentRequest/usePaymentRequest";
import {
  useStore,
  STATUS,
  PAYMENT_STATUS,
} from "@/composables/paymentRequest/useStore";

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

import { useAuthStore } from "@/stores/auth";
import api from "@/js/api";
import CancelRequest from "@/components/paymentRequest/modal/CancelRequest.vue";
import Assign from "@/components/paymentRequest/modal/Assign.vue";
import SubmitPR from "@/components/paymentRequest/modal/SubmitPR.vue";

// Props & Router
defineProps({ user: { type: Object, default: null } });

const route = useRoute();
const router = useRouter();

// Payment Request & Store
const { requests, money, date } = useStore();

const {
  cancelRequest,
  useCard,
  confirmPayment,
} = usePaymentRequest();

// Modal state
const showCancelModal = ref(false);
const cancelTarget = ref(null);

const modal = ref(null);
// const activeId = ref(null);
const paymentItems = ref([]);

const dateRangeError = ref("");

// Status
const getStatus = (item) => item.prStatus;

const authStore = useAuthStore();
const isChecker = computed(() => authStore.hasAccess("checker"));
const isDirector = computed(() => authStore.hasAccess("director"));
const isFinance = computed(() => authStore.hasAccess("finance"));
const isApprover = computed(
  () => isChecker.value || isDirector.value || isFinance.value,
);

const REQUESTER_TABS = ["All", ...Object.values(STATUS)];
const approverTabs = computed(() => [
  { key: "waiting", label: "Waiting My Decision" },
  ...(isFinance.value
    ? [
      { key: "payment", label: "Payment" },
      { key: "cancel-requests", label: "Cancel Requests" },
    ]
    : []),
  { key: "history", label: "My Decisions" },
]);
const tabKeys = computed(() =>
  isApprover.value
    ? approverTabs.value.map((tab) => tab.key)
    : REQUESTER_TABS,
);

const status = ref(
  tabKeys.value.includes(route.query.status)
    ? route.query.status
    : tabKeys.value[0],
);

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const approvalOf = (item, level) =>
  (item.approvals ?? []).find((a) => a.approvalLevel === level);

// level approval terendah yang masih pending (urutan approval berjenjang)
const waitingItems = ref([]);
const historyItems = ref([]);
const actionError = ref("");
const activeItem = ref(null);

// Samakan shape API dengan shape kartu yang dipakai Data.vue
const cardFromPR = (pr, extra = {}) => ({
  prId: pr.pr_id,
  prRfpNumber: pr.pr_rfp_no,
  prDescriptionItem: pr.pr_description_item,
  prRequestedAmount: pr.pr_requested_amount,
  prVendor: "", // vendor tidak ada di backend
  responsibleName: pr.responsible_name,
  adminName: pr.admin_name,
  prCreateDate: pr.pr_create_date,
  prStatus: pr.pr_status,
  ...extra,
});

const fetchApproverData = async () => {
  if (!isApprover.value) return;
  if (isFinance.value) {
     // GET /pr?status=... membalas { paged:false, data:[...] }
     const approvedRes = await api.get("/pr", { params: { status: "approved" } });
     const approved = approvedRes.data?.data ?? [];
     
     const rows = await Promise.all(
       approved.map(async (pr) => {
         const payRes = await api.get(`/pr/${pr.pr_id}/payments`).catch(() => null);
         const pending = (payRes?.data ?? []).find(
           (p) => p.payment_status === "pending",
         );
         return pending
           ? cardFromPR(pr, {
               pendingPayment: pending,
               // nama field yang dibaca Assign.vue
               rfpNumber: pr.pr_rfp_no,
               description: pr.pr_description_item,
               priorityDate: pending.payment_priority_date ?? "",
             })
           : null;
       }),
     );
     paymentItems.value = rows.filter(Boolean);
   }
  try {
    const [pendingRes, decidedRes] = await Promise.all([
      api.get("/pr/my-approvals"),
      api.get("/pr/my-decisions", { params: { page: 1, item: 100 } }),
    ]);

    // my-approvals hanya membawa data approval, detail PR diambil terpisah
    const approvals = pendingRes.data ?? [];
    const details = await Promise.all(
      approvals.map((a) =>
        api
          .get(`/pr/${a.approval_ref_pr}`)
          .then((r) => r.data)
          .catch(() => null),
      ),
    );
    waitingItems.value = approvals
      .map((a, i) =>
        details[i]
          ? cardFromPR(details[i], {
              approvalId: a.approval_id,
              approvalLevel: a.approval_level,
            })
          : null,
      )
      .filter(Boolean);

    historyItems.value = (decidedRes.data ?? []).map((d) => ({
      prId: d.pr_id,
      prRfpNumber: d.rfp_no,
      prDescriptionItem: d.pr_description_item,
      prRequestedAmount: d.pr_requested_amount,
      prVendor: "",
      responsibleName: "",
      adminName: d.requester_name,
      prCreateDate: d.decided_date,
      prStatus: d.pr_status,
      decision: d.decision,
    }));
  } catch (e) {
    actionError.value =
      e.response?.data?.message ?? "Failed to load approval data.";
  }
};

// direct = checker belum memutuskan, wait = menunggu director, request = menunggu finance/approved
const cancelPhase = (item) =>
  approvalOf(item, 1)?.approvalStatus === "approved" ? "request" : "direct";

const payFirst = async (item) => {
  actionError.value = "";
  try {
    await api.post(`/pr/payments/${item.pendingPayment.payment_id}/confirm`);
    await Promise.all([fetchApproverData(), data.fetchCards()]);
  } catch (e) {
    actionError.value =
      e.response?.data?.message ?? "Failed to confirm the payment.";
  }
};

const savePriorityDate = async (date) => {
  actionError.value = "";
  try {
    await api.post(
      `/pr/payments/${assignTarget.value.pendingPayment.payment_id}/priority-date`,
      { priority_date: date },
    );
    await fetchApproverData();
  } catch (e) {
    actionError.value =
      e.response?.data?.message ?? "Failed to set the priority date.";
  }
};

const source = computed(() => {
  const all = requests.value;
  let list;
  switch (status.value) {
    case "All":
      list = all;
      break;
    case "waiting":
      list = waitingItems.value;
      break;
    case "history":
      list = historyItems.value;
      break;
    case "payment":
      list = paymentItems.value;
      break;
    case "cancel-requests":
      list = []; // data dari GET /pr/cancel-requests, lihat catatan di bawah
      break;
    default:
      list = all.filter((item) => getStatus(item) === status.value);
  }
  return [...list].sort((a, b) => a.prId - b.prId);
});

const data = useCard(source);

onMounted(() => {
  data.fetchCards();
  fetchApproverData();
});

// State kosong: tampil saat tidak ada data (dan tidak sedang loading / error)
const isEmpty = computed(
  () =>
    !data.loading.value &&
    !data.error.value &&
    data.filteredCard.value.length === 0,
);

// Kalau user sedang mencari / memfilter tanggal, pesannya beda dengan "memang belum ada data"
const hasFilter = computed(() =>
  Boolean(data.search.value.trim() || data.dateFrom.value || data.dateTo.value),
);

const emptyMessage = computed(() => {
  if (hasFilter.value) return "No requests match your search or date filter.";
  const label = tabs.value.find((t) => t.key === status.value)?.label;
  if (status.value === "All") return "There are no payment requests yet.";
  return `There are no ${label?.toLowerCase() ?? status.value} requests yet.`;
});

// DateRange menggunakan satu object untuk menghubungkan start dan end
// dengan state dateFrom dan dateTo yang digunakan oleh composable.
// Setter juga menangani kondisi ketika nilai date range dikosongkan.
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

// Tab Status
const countByStatus = computed(() => {
  const map = {};

  for (const request of requests.value) {
    const s = getStatus(request);
    map[s] = (map[s] ?? 0) + 1;
  }

  return map;
});

const tabs = computed(() => {
  if (isApprover.value) {
    return approverTabs.value.map((t) => ({
      ...t,
      count:
        t.key === "waiting"
          ? waitingItems.value.length
          : undefined,
    }));
  }
  return REQUESTER_TABS.map((item) => ({
    key: item,
    label: capitalize(item),
    count:
      item === "All" ? requests.value.length : (countByStatus.value[item] ?? 0),
  }));
});

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

// Submission
// Submission
const showSubmit = ref(false);
const submitTarget = ref(null);

const submit = (item) => {
  submitTarget.value = item;
  showSubmit.value = true;
};

const onSubmitted = async () => {
  showSubmit.value = false;
  submitTarget.value = null;
  await data.fetchCards();
};

// Approval & Rejection
const runDecision = async (kind, item, notes = "") => {
  actionError.value = "";
  try {
    await api.post(`/pr/approvals/${item.approvalId}/${kind}`, { notes });
    await Promise.all([fetchApproverData(), data.fetchCards()]);
  } catch (e) {
    actionError.value =
      e.response?.data?.message ?? "Failed to process the decision.";
  }
};

const openConfirm = (item) => {
  if (window.confirm(`Approve ${item.prRfpNumber}?`)) {
    runDecision("approve", item);
  }
};

const openReject = (item) => {
  activeItem.value = item;
  modal.value = "reject";
};

const openRevise = (item) => {
  activeItem.value = item;
  modal.value = "revise";
};

const closeModal = () => {
  modal.value = null;
  activeItem.value = null;
};

const rejectAction = async (note) => {
  await runDecision(
    modal.value === "revise" ? "request-revision" : "reject",
    activeItem.value,
    note,
  );
  closeModal();
};

// Cancellation
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


// Request cancellation (berita acara)
const showCancelRequest = ref(false);
const cancelRequestTarget = ref(null);
const cancelRequestLoading = ref(false);
const cancelRequestError = ref("");

const openCancelRequest = (item) => {
  cancelRequestTarget.value = item;
  cancelRequestError.value = "";
  showCancelRequest.value = true;
};

const submitCancelRequest = async ({ reason, file }) => {
  const fd = new FormData();
  fd.append("reason", reason);
  fd.append("file", file);
  cancelRequestLoading.value = true;
  try {
    await api.post(`/pr/${cancelRequestTarget.value.prId}/cancel-request`, fd);
    showCancelRequest.value = false;
    await data.fetchCards();
  } catch (e) {
    cancelRequestError.value =
      e.response?.data?.message ?? "Failed to submit cancellation request.";
  } finally {
    cancelRequestLoading.value = false;
  }
};

// Priority date (finance)
const showAssign = ref(false);
const assignTarget = ref(null);

const openAssign = (item) => {
  assignTarget.value = item;
  showAssign.value = true;
};

// const savePriorityDate = async (date) => {
//   const payment = firstPendingPayment(assignTarget.value);
//   if (!payment) return;
//   await api.post(`/pr/payments/${payment.paymentId}/priority-date`, {
//     priority_date: date,
//   });
//   await data.fetchCards();
// };

// Actions berdasarkan status menentukan action apa yang tersedia pada setiap data.
// Mapping ini memisahkan aturan action dari component Data sehingga template tetap sederhana.
// Status yang belum memiliki aturan khusus hanya mendapatkan action default.
const VIEW = { key: "view", label: "View" };

const requesterActions = (item) => {
  const s = getStatus(item);
  const cancel = { key: "cancel", label: "Cancel" };
  const cancelReq = { key: "cancel-request", label: "Request Cancellation" };
  const followUp = { key: "follow-up", label: "Create Follow-up PR" };

  if (s === "draft" || s === "revision")
    return [VIEW, { key: "edit", label: "Edit" }, { key: "submit", label: "Submit" }, cancel];
  if (s === "submitted")
    return [VIEW, cancelPhase(item) === "direct" ? cancel : cancelReq];
  if (s === "approved")
    return [VIEW, followUp, cancelReq];
  if (s === "completed")
    return [VIEW, followUp];
  return [VIEW];
};

const approverActions = (item) => {
  if (status.value === "waiting") {
    const lvl = item.approvalLevel;
    const approve = { key: "approve", label: "Approve" };
    if (lvl === 1 && isChecker.value)
      return [
        VIEW,
        approve,
        { key: "revise", label: "Request Revision" },
        { key: "reject", label: "Reject" },
      ];
    if (lvl === 2 && isDirector.value) return [VIEW, approve];
    if (lvl === 3 && isFinance.value) return [VIEW, approve];
  }
  if (status.value === "payment" && isFinance.value)
    return [
      VIEW,
      { key: "date", label: "Set Priority Date" },
      { key: "paid", label: "Mark As Paid" },
    ];
  return [VIEW];
};

const getActions = (item) =>
  isApprover.value ? approverActions(item) : requesterActions(item);

const handleAction = (item, key) => {
  switch (key) {
    case "view":
      return view(item);

    case "edit":
      return edit(item);

    case "submit":
      return submit(item);

    case "approve":
      return openConfirm(item);

    case "reject":
      return openReject(item);

    case "revise":
      return openRevise(item);

    case "cancel":
      return openCancel(item);

    case "paid":
      return payFirst(item);

    case "date":
      return openAssign(item);

    case "cancel-request":
      return openCancelRequest(item);

    case "follow-up":
      return router.push({
        name: "payment-request-form",
        query: { ref: item.prId },
      });
  }
};
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-slate-800">Request Overview</h1>

    <div class="flex flex-col px-4 py-4 rounded-sm border border-slate-200 bg-white shadow-xs">
      <div class="pb-6">
        <Segment :model-value="status" :items="tabs" @update:model-value="switchStatus" />
        <p
          v-if="actionError"
          class="mb-4 rounded-sm border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-500"
        >
          {{ actionError }}
        </p>
      </div>

      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-6">
        <div class="flex flex-wrap items-center gap-2">
          <Search class="w-72" v-model="data.search.value" />

          <DateRange class="w-50" v-model="dateRangeModel" :error="dateRangeError" @error="dateRangeError = $event" />

          <Sort v-model="data.sort.value" />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <ExportExcel :export-rows="data.filteredCard.value" />

          <!-- <Create v-if="!isApprover" /> -->
          <Create />
        </div>
      </div>

      <section>
        <div v-if="isEmpty" class="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Icon icon="hugeicons:invoice-01" class="size-10 text-slate-400" />
          <p class="text-sm font-medium text-slate-800">{{ emptyMessage }}</p>
        </div>

        <template v-else>
          <Data :rows="data.card.value" :money="money" :date="date" :status="getStatus" :get-actions="getActions"
            @action="handleAction" />

          <div>
            <Pagination class="pt-4" :page="data.page.value" :total-page="data.totalPages.value"
              :total-data="data.filteredCard.value.length" :per-page="data.perPage.value" @change="data.goToPage" />
          </div>
        </template>
      </section>
    </div>
  </div>

  <Cancel v-if="showCancelModal" :target="cancelTarget" @close="closeCancel" @confirm="confirmCancel" />

  <Signature v-if="modal === 'confirm'" title="Confirm Payment Request" role-label="Confirmed By" submit-label="Confirm"
    @close="closeModal" @submit="confirmAction" />

  <Reject v-if="modal === 'reject' || modal === 'revise'"
    :title="modal === 'revise' ? 'Request Revision' : 'Reject Payment Request'" @close="closeModal"
    @submit="rejectAction" />

  <SubmitPR
    v-if="showSubmit"
    :target="submitTarget"
    @close="showSubmit = false"
    @done="onSubmitted"
  />

  <CancelRequest v-if="showCancelRequest" :target="cancelRequestTarget" :loading="cancelRequestLoading"
    :error="cancelRequestError" @close="showCancelRequest = false" @submit="submitCancelRequest" />

  <Assign v-model="showAssign" :item="assignTarget" @confirm="savePriorityDate" />
</template>
