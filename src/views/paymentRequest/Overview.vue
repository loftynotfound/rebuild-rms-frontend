<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useCard } from "@/composables/paymentRequest/useData";
import { usePRList, cardFromPR } from "@/composables/paymentRequest/usePRList";
import CancelRequestList from "@/components/paymentRequest/display/CancelRequestList.vue";
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
import BulkResult from "@/components/paymentRequest/modal/BulkResult.vue";

// Props & Router
defineProps({ user: { type: Object, default: null } });

const route = useRoute();
const router = useRouter();

// Payment Request & Store
const { money, date } = useStore();
const { requests, error: listError, fetchRequests } = usePRList();

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
  isApprover.value ? approverTabs.value.map((tab) => tab.key) : REQUESTER_TABS,
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
const pendingCancelCount = ref(0);
const historyItems = ref([]);
const actionError = ref("");
const activeItem = ref(null);

const NO_ACCESS = "You do not have access to this page for your role.";

const errorMessage = (e, fallback) =>
  e.response?.status === 403
    ? NO_ACCESS
    : (e.response?.data?.message ?? fallback);

const fetchApproverData = async () => {
  if (!isApprover.value) return;
  if (isFinance.value) {
    // GET /pr?status=... membalas { paged:false, data:[...] }
    const approvedRes = await api.get("/pr", {
      params: { status: "approved" },
    });
    const approved = approvedRes.data?.data ?? [];
    const cancelRes = await api.get("/pr/cancel-requests", {
      params: { status: "pending", page: 1, item: 1 },
    });
    pendingCancelCount.value = cancelRes.meta?.total_data ?? 0;

    const rows = await Promise.all(
      approved.map(async (pr) => {
        const payRes = await api
          .get(`/pr/${pr.pr_id}/payments`)
          .catch(() => null);
        const pending = (payRes?.data ?? []).find(
          (p) => p.payment_status === "pending",
        );
        return cardFromPR(pr, {
          pendingPayment: pending ?? null,
          rfpNumber: pr.pr_rfp_no,
          description: pr.pr_description_item,
          priorityDate: pending?.payment_priority_date ?? "",
        });
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
      responsibleName: "",
      adminName: d.requester_name,
      prCreateDate: d.decided_date,
      prStatus: d.pr_status,
      decision: d.decision,
    }));
  } catch (e) {
    actionError.value = errorMessage(e, "Failed to load approval data.");
  }
};

const payFirst = async (item) => {
  actionError.value = "";
  try {
    await api.post(`/pr/payments/${item.pendingPayment.payment_id}/confirm`);
    await Promise.all([fetchApproverData(), refresh()]);
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

const MAX_BULK = 50;
const selectedIds = ref([]);
const bulkResult = ref(null);

const isSelectable = (item) =>
  isApprover.value
    ? status.value === "waiting" && Boolean(item.approvalId)
    : ["draft", "revision"].includes(getStatus(item));

const selectableItems = computed(() =>
  data.filteredCard.value.filter(isSelectable),
);
const selectedItems = computed(() =>
  source.value.filter((i) => selectedIds.value.includes(i.prId)),
);

const toggleSelect = (row) => {
  const idx = selectedIds.value.indexOf(row.prId);
  if (idx >= 0) selectedIds.value.splice(idx, 1);
  else if (selectedIds.value.length < MAX_BULK)
    selectedIds.value.push(row.prId);
  else actionError.value = `Maximum ${MAX_BULK} requests per batch.`;
};

const selectAll = () => {
  selectedIds.value = selectableItems.value
    .slice(0, MAX_BULK)
    .map((i) => i.prId);
  if (selectableItems.value.length > MAX_BULK)
    actionError.value = `Only the first ${MAX_BULK} requests were selected.`;
};

const showFailures = (title, results, labels, idKey) => {
  if (!results.some((r) => !r.success)) return;
  bulkResult.value = {
    title,
    rows: results.map((r) => ({
      label: labels[r[idKey]] ?? `#${r[idKey]}`,
      success: r.success,
      error: r.error,
    })),
  };
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

// Requester memakai daftar PR sendiri; approver memakai my-approvals/my-decisions
const loadRequests = () =>
  isApprover.value ? Promise.resolve() : fetchRequests();

const refresh = async () => {
  actionError.value = "";
  try {
    await Promise.all([loadRequests(), fetchApproverData()]);
  } catch (e) {
    actionError.value = errorMessage(e, "Failed to load data.");
  }
  selectedIds.value = [];
};

onMounted(refresh);

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
          : t.key === "cancel-requests"
            ? pendingCancelCount.value
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
  selectedIds.value = [];
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
const submitTargets = ref([]);

const submit = (item) => {
  submitTarget.value = item;
  submitTargets.value = [];
  showSubmit.value = true;
};

const bulkSubmit = () => {
  submitTarget.value = null;
  submitTargets.value = selectedItems.value;
  showSubmit.value = true;
};

const onSubmitted = async (results) => {
  const labels = Object.fromEntries(
    submitTargets.value.map((i) => [i.prId, i.prRfpNumber]),
  );
  showSubmit.value = false;
  submitTarget.value = null;
  if (Array.isArray(results))
    showFailures("Bulk Submit", results, labels, "pr_id");
  submitTargets.value = [];
  await refresh();
};

// Approval & Rejection
const runDecision = async (kind, item, notes = "") => {
  actionError.value = "";
  try {
    await api.post(`/pr/approvals/${item.approvalId}/${kind}`, { notes });
    await Promise.all([fetchApproverData(), refresh()]);
  } catch (e) {
    actionError.value =
      e.response?.data?.message ?? "Failed to process the decision.";
  }
};

const runBulkDecision = async (decision, notes = "") => {
  const picked = selectedItems.value;
  if (!picked.length) return;
  actionError.value = "";
  try {
    const res = await api.post("/pr/approvals/bulk-decide", {
      decision,
      items: picked.map((i) => ({ approval_id: i.approvalId, notes })),
    });
    const labels = Object.fromEntries(
      picked.map((i) => [i.approvalId, i.prRfpNumber]),
    );
    showFailures(
      decision === "approved" ? "Bulk Approve" : "Bulk Reject",
      res.data ?? [],
      labels,
      "approval_id",
    );
    await refresh();
  } catch (e) {
    actionError.value =
      e.response?.data?.message ?? "Failed to process the decisions.";
  }
};

const bulkApprove = () => {
  if (window.confirm(`Approve ${selectedItems.value.length} requests?`)) {
    runBulkDecision("approved");
  }
};

const bulkReject = () => {
  modal.value = "bulk-reject";
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
  if (modal.value === "bulk-reject") await runBulkDecision("rejected", note);
  else
    await runDecision(
      modal.value === "revise" ? "request-revision" : "reject",
      activeItem.value,
      note,
    );
  closeModal();
};

const rejectTitle = computed(() => {
  if (modal.value === "revise") return "Request Revision";
  if (modal.value === "bulk-reject")
    return `Reject ${selectedItems.value.length} Requests`;
  return "Reject Payment Request";
});

// Cancellation
const openCancel = (item) => {
  cancelTarget.value = item;
  showCancelModal.value = true;
};

const closeCancel = () => {
  cancelTarget.value = null;
  showCancelModal.value = false;
};

const cancelLoading = ref(false);
const cancelError = ref("");

const confirmCancel = async (notes) => {
  cancelLoading.value = true;
  cancelError.value = "";
  try {
    await api.post(`/pr/${cancelTarget.value.prId}/cancel`, { notes });
    closeCancel();
    await refresh();
  } catch (e) {
    // checker sudah menyetujui: backend meminta request pembatalan dengan berita acara
    if (
      e.response?.status === 409 &&
      e.response.data?.data?.code === "cancel_request_required"
    ) {
      const item = cancelTarget.value;
      closeCancel();
      openCancelRequest(item);
      return;
    }
    cancelError.value =
      e.response?.data?.message ?? "Failed to cancel the request.";
  } finally {
    cancelLoading.value = false;
  }
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
    await refresh();
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
//   await refresh();
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
    return [
      VIEW,
      { key: "edit", label: "Edit" },
      { key: "submit", label: "Submit" },
      cancel,
    ];
  if (s === "submitted") return [VIEW, cancel];
  if (s === "approved") return [VIEW, followUp, cancelReq];
  if (s === "completed") return [VIEW, followUp];
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
    return item.pendingPayment
      ? [
          VIEW,
          { key: "date", label: "Set Priority Date" },
          { key: "paid", label: "Mark As Paid" },
        ]
      : [VIEW];
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

    <div
      class="flex flex-col px-4 py-4 rounded-sm border border-slate-200 bg-white shadow-xs"
    >
      <div class="pb-6">
        <Segment
          :model-value="status"
          :items="tabs"
          @update:model-value="switchStatus"
        />
        <div class="mt-4">
          <p
            v-if="actionError || listError"
            class="rounded-sm border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-500"
          >
            {{ actionError || listError }}
          </p>
        </div>
      </div>

      <div
        v-if="status !== 'cancel-requests'"
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
          <ExportExcel
            :start-date="data.dateFrom.value"
            :end-date="data.dateTo.value"
          />

          <!-- <Create v-if="!isApprover" /> -->
          <Create />
        </div>
      </div>

      <section v-if="status !== 'cancel-requests'">
        <div
          v-if="isEmpty"
          class="flex flex-col items-center justify-center gap-2 py-16 text-center"
        >
          <Icon icon="hugeicons:invoice-01" class="size-10 text-slate-400" />
          <p class="text-sm font-medium text-slate-800">{{ emptyMessage }}</p>
        </div>

        <template v-else>
          <div
            v-if="selectableItems.length"
            class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            <div class="flex items-center gap-3 text-slate-600">
              <button
                type="button"
                class="font-medium text-teal-600 hover:text-teal-700"
                @click="selectAll"
              >
                Select all ({{ selectableItems.length }})
              </button>
              <button
                v-if="selectedIds.length"
                type="button"
                class="font-medium hover:text-slate-800"
                @click="selectedIds = []"
              >
                Clear
              </button>
              <span v-if="selectedIds.length"
                >{{ selectedIds.length }} selected</span
              >
            </div>

            <div v-if="selectedIds.length" class="flex gap-2">
              <button
                v-if="!isApprover"
                type="button"
                class="rounded-sm bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-600"
                @click="bulkSubmit"
              >
                Submit Selected
              </button>
              <template v-else>
                <button
                  v-if="isChecker"
                  type="button"
                  class="rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                  @click="bulkReject"
                >
                  Reject Selected
                </button>
                <button
                  type="button"
                  class="rounded-sm bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-600"
                  @click="bulkApprove"
                >
                  Approve Selected
                </button>
              </template>
            </div>
          </div>
          <Data
            :selectable="isSelectable"
            :selected="selectedIds"
            @toggle="toggleSelect"
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
        </template>
      </section>

      <CancelRequestList
        v-else
        :money="money"
        :date="date"
        @changed="fetchApproverData"
      />
    </div>
  </div>

  <Cancel
    v-if="showCancelModal"
    :target="cancelTarget"
    :loading="cancelLoading"
    :error="cancelError"
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
    v-if="['reject', 'revise', 'bulk-reject'].includes(modal)"
    :title="rejectTitle"
    @close="closeModal"
    @submit="rejectAction"
  />

  <SubmitPR
    v-if="showSubmit"
    :target="submitTarget"
    :targets="submitTargets"
    @close="showSubmit = false"
    @done="onSubmitted"
  />

  <BulkResult
    v-if="bulkResult"
    :title="bulkResult.title"
    :rows="bulkResult.rows"
    @close="bulkResult = null"
  />

  <CancelRequest
    v-if="showCancelRequest"
    :target="cancelRequestTarget"
    :loading="cancelRequestLoading"
    :error="cancelRequestError"
    @close="showCancelRequest = false"
    @submit="submitCancelRequest"
  />

  <Assign
    v-model="showAssign"
    :item="assignTarget"
    @confirm="savePriorityDate"
  />
</template>
