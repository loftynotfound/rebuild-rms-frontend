<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { usePaymentRequest } from "@/composables/paymentRequest/usePaymentRequest";
import { useAuthStore } from "@/stores/auth";

import ButtonCreate from "@/components/paymentRequest/base/ButtonCreate.vue";
import ButtonExcel from "@/components/paymentRequest/base/ButtonExcel.vue";
import ButtonSort from "@/components/paymentRequest/base/ButtonSort.vue";
import InputSearch from "@/components/paymentRequest/base/InputSearch.vue";

import ModalExcel from "@/components/paymentRequest/overlay/ModalExcel.vue";
import ModalReject from "@/components/paymentRequest/overlay/ModalReject.vue";
import ModalCancel from "@/components/paymentRequest/overlay/ModalCancel.vue";
import ModalSignature from "@/components/paymentRequest/overlay/ModalSignature.vue";
import ModalCancelRequest from "@/components/paymentRequest/overlay/ModalCancelRequest.vue";
import ModalAssign from "@/components/paymentRequest/overlay/ModalAssign.vue";
import ModalSubmit from "@/components/paymentRequest/overlay/ModalSubmit.vue";
import ModalResult from "@/components/paymentRequest/overlay/ModalResult.vue";

import DisplayTab from "@/components/paymentRequest/panel/DisplayTab.vue";
import DisplayCard from "@/components/paymentRequest/panel/DisplayCard.vue";
import DisplayCancellation from "@/components/paymentRequest/panel/DisplayCancellation.vue";

import DateRange from "@/components/ui/DateRange.vue";
import Pagination from "@/components/ui/Pagination.vue";

defineProps({
  user: {
    type: Object,
    default: null,
  },
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const paymentRequest = usePaymentRequest();

const {
  STATUS,
  PAYMENT_STATUS,
  money,
  date,
  cardFromPR,
  requests,
  error: listError,
  fetchRequests,
  fetchByStatus,
  search,
  dateFrom,
  dateTo,
  sort,
  page,
  perPage,
  loading,
  getPayments,
  confirmPayment,
  updatePriorityDate,
  getPR,
  getMyApprovals,
  getMyDecisions,
  decide,
  bulkDecide,
  cancelPR,
  getCancelRequests,
  requestCancel,
} = paymentRequest;

const isChecker = computed(() => authStore.hasAccess("checker"));
const isDirector = computed(() => authStore.hasAccess("director"));
const isFinance = computed(() => authStore.hasAccess("finance"));

const isApprover = computed(() => isChecker.value || isDirector.value || isFinance.value);

const tabRole = computed(() => {
  if (!isApprover.value) return "requester";
  if (isFinance.value) return "finance";
  if (isDirector.value) return "director";
  return "checker";
});

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

const initialStatus =
  typeof route.query.status === "string" && tabKeys.value.includes(route.query.status)
    ? route.query.status
    : tabKeys.value[0];

const status = ref(initialStatus);

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const getStatus = (item) => item.prStatus;

const showCancelModal = ref(false);
const showExportModal = ref(false);
const showSubmit = ref(false);
const showCancelRequest = ref(false);
const showAssign = ref(false);

const cancelTarget = ref(null);
const cancelRequestTarget = ref(null);
const assignTarget = ref(null);
const submitTarget = ref(null);
const submitTargets = ref([]);

const modal = ref(null);
const activeItem = ref(null);

const paymentItems = ref([]);
const waitingItems = ref([]);
const historyItems = ref([]);

const pendingCancelCount = ref(0);
const actionError = ref("");
const dateRangeError = ref("");

const cancelLoading = ref(false);
const cancelError = ref("");

const cancelRequestLoading = ref(false);
const cancelRequestError = ref("");

const bulkResult = ref(null);

const MAX_BULK = 50;
const selectedIds = ref([]);

const NO_ACCESS = "You do not have access to this page for your role.";

const errorMessage = (error, fallback) =>
  error.response?.status === 403
    ? NO_ACCESS
    : (error.response?.data?.message ?? error.message ?? fallback);

const normalizeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const approvalOf = (item, level) =>
  (item.approvals ?? []).find((approval) => approval.approvalLevel === level);

const fetchApproverData = async () => {
  if (!isApprover.value) return;

  try {
    if (isFinance.value) {
      const approved = await fetchByStatus("approved");

      const cancelResponse = await paymentRequest.getCancelRequests({
        status: "pending",
        page: 1,
        item: 1,
      });

      pendingCancelCount.value =
        cancelResponse?.meta?.total_data ?? cancelResponse?.data?.meta?.total_data ?? 0;

      const rows = await Promise.all(
        approved.map(async (pr) => {
          const paymentResponse = await getPayments(pr.pr_id).catch(() => null);

          const payments = normalizeList(paymentResponse);

          const pendingPayment = payments.find((payment) => payment.payment_status === "pending");

          return cardFromPR(pr, {
            pendingPayment: pendingPayment ?? null,
            rfpNumber: pr.pr_rfp_no,
            description: pr.pr_description_item,
            priorityDate: pendingPayment?.payment_priority_date ?? "",
          });
        }),
      );

      paymentItems.value = rows.filter(Boolean);
    } else {
      paymentItems.value = [];
      pendingCancelCount.value = 0;
    }

    const [pendingResponse, decidedResponse] = await Promise.all([
      getMyApprovals(),
      getMyDecisions({ page: 1, item: 100 }),
    ]);

    const approvals = normalizeList(pendingResponse);
    const decisions = normalizeList(decidedResponse);

    const details = await Promise.all(
      approvals.map((approval) =>
        getPR(approval.approval_ref_pr)
          .then((response) => response.data)
          .catch(() => null),
      ),
    );

    waitingItems.value = approvals
      .map((approval, index) => {
        const detail = details[index];

        if (!detail) return null;

        return cardFromPR(detail, {
          approvalId: approval.approval_id,
          approvalLevel: approval.approval_level,
        });
      })
      .filter(Boolean);

    historyItems.value = decisions.map((decision) => ({
      prId: decision.pr_id,
      prRfpNumber: decision.rfp_no,
      prDescriptionItem: decision.pr_description_item,
      prRequestedAmount: decision.pr_requested_amount,
      responsibleName: "",
      adminName: decision.requester_name,
      prCreateDate: decision.decided_date,
      prStatus: decision.pr_status,
      decision: decision.decision,
    }));
  } catch (error) {
    actionError.value = errorMessage(error, "Failed to load approval data.");
  }
};

const source = computed(() => {
  let list;

  switch (status.value) {
    case "All":
      list = requests.value;
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
      list = [];
      break;

    default:
      list = requests.value.filter((item) => getStatus(item) === status.value);
  }

  return [...list].sort((a, b) => Number(a.prId) - Number(b.prId));
});

const paymentText = (item) =>
  (item.payments ?? [])
    .map(
      (payment) =>
        `${payment.paymentBankAccountName ?? ""} ${payment.paymentBankAccountNumber ?? ""}`,
    )
    .join(" ");

const filteredCard = computed(() => {
  const query = search.value.trim().toLowerCase();

  const result = source.value.filter((item) => {
    const matchesSearch =
      !query ||
      [
        "prId",
        "prRfpNumber",
        "prQuotationNumber",
        "prPoNumber",
        "prVendor",
        "prDescriptionItem",
        "responsibleName",
        "adminName",
        "rfpNumber",
        "description",
      ].some((key) =>
        String(item[key] ?? "")
          .toLowerCase()
          .includes(query),
      ) ||
      paymentText(item).toLowerCase().includes(query);

    const createdDay = String(item.prCreateDate ?? "").slice(0, 10);

    const matchesFrom = !dateFrom.value || createdDay >= dateFrom.value;

    const matchesTo = !dateTo.value || createdDay <= dateTo.value;

    return matchesSearch && matchesFrom && matchesTo;
  });

  return result.sort((a, b) => {
    if (sort.value === "id") {
      return Number(a.prId) - Number(b.prId);
    }

    if (sort.value === "date") {
      return String(b.prCreateDate ?? "").localeCompare(String(a.prCreateDate ?? ""));
    }

    return 0;
  });
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredCard.value.length / perPage.value)),
);

const card = computed(() =>
  filteredCard.value.slice((page.value - 1) * perPage.value, page.value * perPage.value),
);

const goToPage = (value) => {
  page.value = Math.min(Math.max(1, Number(value) || 1), totalPages.value);
};

const data = {
  search,
  dateFrom,
  dateTo,
  sort,
  page,
  perPage,
  loading,
  error: listError,
  filteredCard,
  totalPages,
  card,
  goToPage,
};

const isSelectable = (item) =>
  isApprover.value
    ? status.value === "waiting" && Boolean(item.approvalId)
    : ["draft", "revision"].includes(getStatus(item));

const selectableItems = computed(() => filteredCard.value.filter(isSelectable));

const selectedItems = computed(() =>
  source.value.filter((item) => selectedIds.value.includes(item.prId)),
);

const toggleSelect = (row) => {
  const index = selectedIds.value.indexOf(row.prId);

  if (index >= 0) {
    selectedIds.value.splice(index, 1);
    return;
  }

  if (selectedIds.value.length < MAX_BULK) {
    selectedIds.value.push(row.prId);
    return;
  }

  actionError.value = `Maximum ${MAX_BULK} requests per batch.`;
};

const selectAll = () => {
  selectedIds.value = selectableItems.value.slice(0, MAX_BULK).map((item) => item.prId);

  if (selectableItems.value.length > MAX_BULK) {
    actionError.value = `Only the first ${MAX_BULK} requests were selected.`;
  }
};

const showFailures = (title, results, labels, idKey) => {
  if (!results.some((result) => !result.success)) return;

  bulkResult.value = {
    title,
    rows: results.map((result) => ({
      label: labels[result[idKey]] ?? `#${result[idKey]}`,
      success: result.success,
      error: result.error,
    })),
  };
};

const loadRequests = () => (isApprover.value ? Promise.resolve() : fetchRequests());

const refresh = async () => {
  actionError.value = "";

  try {
    await Promise.all([loadRequests(), fetchApproverData()]);
  } catch (error) {
    actionError.value = errorMessage(error, "Failed to load data.");
  }

  selectedIds.value = [];
};

onMounted(refresh);

const isEmpty = computed(
  () => !data.loading.value && !data.error.value && data.filteredCard.value.length === 0,
);

const hasFilter = computed(() =>
  Boolean(data.search.value.trim() || data.dateFrom.value || data.dateTo.value),
);

const emptyMessage = computed(() => {
  if (hasFilter.value) {
    return "No requests match your search or date filter.";
  }

  const label = tabs.value.find((tab) => tab.key === status.value)?.label;

  if (status.value === "All") {
    return "There are no payment requests yet.";
  }

  return `There are no ${label?.toLowerCase() ?? status.value} requests yet.`;
});

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
  const counts = {};

  for (const request of requests.value) {
    const requestStatus = getStatus(request);
    counts[requestStatus] = (counts[requestStatus] ?? 0) + 1;
  }

  return counts;
});

const tabs = computed(() => {
  if (isApprover.value) {
    return approverTabs.value.map((tab) => ({
      ...tab,
      count:
        tab.key === "waiting"
          ? waitingItems.value.length
          : tab.key === "cancel-requests"
            ? pendingCancelCount.value
            : undefined,
    }));
  }

  return REQUESTER_TABS.map((item) => ({
    key: item,
    label: capitalize(item),
    count: item === "All" ? requests.value.length : (countByStatus.value[item] ?? 0),
  }));
});

const switchStatus = (value) => {
  status.value = value;
  page.value = 1;
  selectedIds.value = [];
};

const view = (item) => {
  router.push(`/payment-request/${item.prId}`);
};

const edit = (item) => {
  router.push(`/payment-request/form?id=${item.prId}`);
};

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
    submitTargets.value.map((item) => [item.prId, item.prRfpNumber]),
  );

  showSubmit.value = false;
  submitTarget.value = null;

  if (Array.isArray(results)) {
    showFailures("Bulk Submit", results, labels, "pr_id");
  }

  submitTargets.value = [];
  await refresh();
};

const runDecision = async (kind, item, notes = "") => {
  if (!item?.approvalId) return;

  actionError.value = "";

  try {
    await decide(item.approvalId, kind, { notes });

    await refresh();
  } catch (error) {
    actionError.value = error.response?.data?.message ?? "Failed to process the decision.";
  }
};

const runBulkDecision = async (decision, notes = "") => {
  const picked = selectedItems.value;

  if (!picked.length) return;

  actionError.value = "";

  try {
    const response = await bulkDecide({
      decision,
      items: picked.map((item) => ({
        approval_id: item.approvalId,
        notes,
      })),
    });

    const labels = Object.fromEntries(picked.map((item) => [item.approvalId, item.prRfpNumber]));

    showFailures(
      decision === "approved" ? "Bulk Approve" : "Bulk Reject",
      normalizeList(response),
      labels,
      "approval_id",
    );

    await refresh();
  } catch (error) {
    actionError.value = error.response?.data?.message ?? "Failed to process the decisions.";
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

const rejectAction = async (notes) => {
  if (modal.value === "bulk-reject") {
    await runBulkDecision("rejected", notes);
  } else {
    await runDecision(
      modal.value === "revise" ? "request-revision" : "reject",
      activeItem.value,
      notes,
    );
  }

  closeModal();
};

const rejectTitle = computed(() => {
  if (modal.value === "revise") return "Request Revision";

  if (modal.value === "bulk-reject") {
    return `Reject ${selectedItems.value.length} Requests`;
  }

  return "Reject Payment Request";
});

const openCancel = (item) => {
  cancelTarget.value = item;
  cancelError.value = "";
  showCancelModal.value = true;
};

const closeCancel = () => {
  cancelTarget.value = null;
  showCancelModal.value = false;
};

const confirmCancel = async (notes) => {
  if (!cancelTarget.value) return;

  cancelLoading.value = true;
  cancelError.value = "";

  try {
    await cancelPR(cancelTarget.value.prId, { notes });

    closeCancel();
    await refresh();
  } catch (error) {
    if (
      error.response?.status === 409 &&
      error.response.data?.data?.code === "cancel_request_required"
    ) {
      const item = cancelTarget.value;
      closeCancel();
      openCancelRequest(item);
      return;
    }

    cancelError.value = error.response?.data?.message ?? "Failed to cancel the request.";
  } finally {
    cancelLoading.value = false;
  }
};

const openCancelRequest = (item) => {
  cancelRequestTarget.value = item;
  cancelRequestError.value = "";
  showCancelRequest.value = true;
};

const submitCancelRequest = async ({ reason, file }) => {
  if (!cancelRequestTarget.value) return;

  const formData = new FormData();
  formData.append("reason", reason);
  formData.append("file", file);

  cancelRequestLoading.value = true;
  cancelRequestError.value = "";

  try {
    await requestCancel(cancelRequestTarget.value.prId, formData);

    showCancelRequest.value = false;
    await refresh();
  } catch (error) {
    cancelRequestError.value =
      error.response?.data?.message ?? "Failed to submit cancellation request.";
  } finally {
    cancelRequestLoading.value = false;
  }
};

const firstPendingPayment = (item) =>
  (item?.payments ?? []).find(
    (payment) =>
      payment.paymentStatus === PAYMENT_STATUS.PENDING ||
      payment.payment_status === PAYMENT_STATUS.PENDING,
  );

const payFirst = async (item) => {
  const paymentId =
    item?.pendingPayment?.payment_id ??
    firstPendingPayment(item)?.paymentId ??
    firstPendingPayment(item)?.payment_id;

  if (!paymentId) {
    actionError.value = "No pending payment was found.";
    return;
  }

  actionError.value = "";

  try {
    await confirmPayment(paymentId);
    await refresh();
  } catch (error) {
    actionError.value =
      error.response?.data?.message ?? error.message ?? "Failed to confirm the payment.";
  }
};

const openAssign = (item) => {
  assignTarget.value = item;
  showAssign.value = true;
};

const savePriorityDate = async (priorityDate) => {
  const paymentId =
    assignTarget.value?.pendingPayment?.payment_id ??
    firstPendingPayment(assignTarget.value)?.paymentId ??
    firstPendingPayment(assignTarget.value)?.payment_id;

  if (!paymentId) {
    actionError.value = "No pending payment was found.";
    return;
  }

  actionError.value = "";

  try {
    await updatePriorityDate(paymentId, priorityDate);
    showAssign.value = false;
    await refresh();
  } catch (error) {
    actionError.value =
      error.response?.data?.message ?? error.message ?? "Failed to set the priority date.";
  }
};

const VIEW = { key: "view", label: "View" };

const requesterActions = (item) => {
  const requestStatus = getStatus(item);

  const cancel = { key: "cancel", label: "Cancel" };
  const cancelRequest = {
    key: "cancel-request",
    label: "Request Cancellation",
  };
  const followUp = {
    key: "follow-up",
    label: "Create Follow-up PR",
  };

  if (requestStatus === "draft" || requestStatus === "revision") {
    return [VIEW, { key: "edit", label: "Edit" }, { key: "submit", label: "Submit" }, cancel];
  }

  if (requestStatus === "submitted") {
    return [VIEW, cancel];
  }

  if (requestStatus === "approved") {
    return [VIEW, followUp, cancelRequest];
  }

  if (requestStatus === "completed") {
    return [VIEW, followUp];
  }

  return [VIEW];
};

const approverActions = (item) => {
  switch (status.value) {
    case "waiting": {
      const level = Number(item.approvalLevel);
      const approve = { key: "approve", label: "Approve" };

      if (level === 1 && isChecker.value) {
        return [
          VIEW,
          approve,
          { key: "revise", label: "Request Revision" },
          { key: "reject", label: "Reject" },
        ];
      }

      if (level === 2 && isDirector.value) {
        return [VIEW, approve];
      }

      if (level === 3 && isFinance.value) {
        return [VIEW, approve];
      }

      return [VIEW];
    }

    case "payment":
      return isFinance.value && item.pendingPayment
        ? [
            VIEW,
            { key: "date", label: "Set Priority Date" },
            { key: "paid", label: "Mark As Paid" },
          ]
        : [VIEW];

    case "history":
    default:
      return [VIEW];
  }
};

const getActions = (item) => (isApprover.value ? approverActions(item) : requesterActions(item));

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

const confirmAction = () => {
  closeModal();
};
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold text-slate-800">Request Overview</h1>

    <div class="flex flex-col rounded-sm border border-slate-200 bg-white px-4 py-4 shadow-xs">
      <div class="pb-6">
        <DisplayTab
          :model-value="status"
          :items="tabs"
          :role="tabRole"
          @update:model-value="switchStatus" />

        <div class="mt-4">
          <p
            v-if="actionError || listError"
            class="rounded-sm border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-500">
            {{ actionError || listError }}
          </p>
        </div>
      </div>

      <div
        v-if="status !== 'cancel-requests'"
        class="flex flex-col pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <InputSearch class="w-72" v-model="data.search.value" />

          <DateRange
            class="w-50"
            v-model="dateRangeModel"
            :error="dateRangeError"
            @error="dateRangeError = $event" />

          <ButtonSort v-model="data.sort.value" />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <ButtonExcel @click="showExportModal = true" />
          <ButtonCreate />
        </div>
      </div>

      <section v-if="status !== 'cancel-requests'">
        <div
          v-if="isEmpty"
          class="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Icon icon="hugeicons:invoice-01" class="size-10 text-slate-400" />
          <p class="text-sm font-medium text-slate-800">
            {{ emptyMessage }}
          </p>
        </div>

        <template v-else>
          <div
            v-if="selectableItems.length"
            class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <div class="flex items-center gap-3 text-slate-600">
              <button
                type="button"
                class="font-medium text-teal-600 hover:text-teal-700"
                @click="selectAll">
                Select all ({{ selectableItems.length }})
              </button>

              <button
                v-if="selectedIds.length"
                type="button"
                class="font-medium hover:text-slate-800"
                @click="selectedIds = []">
                Clear
              </button>

              <span v-if="selectedIds.length"> {{ selectedIds.length }} selected </span>
            </div>

            <div v-if="selectedIds.length" class="flex gap-2">
              <button
                v-if="!isApprover"
                type="button"
                class="rounded-sm bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-600"
                @click="bulkSubmit">
                Submit Selected
              </button>

              <template v-else>
                <button
                  v-if="isChecker"
                  type="button"
                  class="rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                  @click="bulkReject">
                  Reject Selected
                </button>

                <button
                  type="button"
                  class="rounded-sm bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-600"
                  @click="bulkApprove">
                  Approve Selected
                </button>
              </template>
            </div>
          </div>

          <DisplayCard
            :selectable="isSelectable"
            :selected="selectedIds"
            :rows="data.card.value"
            :money="money"
            :date="date"
            :status="getStatus"
            :get-actions="getActions"
            @toggle="toggleSelect"
            @action="handleAction" />

          <Pagination
            class="pt-4"
            :page="data.page.value"
            :total-page="data.totalPages.value"
            :total-data="data.filteredCard.value.length"
            :per-page="data.perPage.value"
            @change="data.goToPage" />
        </template>
      </section>

      <DisplayCancellation v-else :money="money" :date="date" @changed="fetchApproverData" />
    </div>
  </div>

  <ModalExcel
    v-if="showExportModal"
    :start-date="data.dateFrom.value"
    :end-date="data.dateTo.value"
    @close="showExportModal = false" />

  <ModalCancel
    v-if="showCancelModal"
    :target="cancelTarget"
    :loading="cancelLoading"
    :error="cancelError"
    @close="closeCancel"
    @confirm="confirmCancel" />

  <ModalSignature
    v-if="modal === 'confirm'"
    title="Confirm Payment Request"
    role-label="Confirmed By"
    submit-label="Confirm"
    @close="closeModal"
    @submit="confirmAction" />

  <ModalReject
    v-if="['reject', 'revise', 'bulk-reject'].includes(modal)"
    :title="rejectTitle"
    @close="closeModal"
    @submit="rejectAction" />

  <ModalSubmit
    v-if="showSubmit"
    :target="submitTarget"
    :targets="submitTargets"
    @close="showSubmit = false"
    @done="onSubmitted" />

  <ModalResult
    v-if="bulkResult"
    :title="bulkResult.title"
    :rows="bulkResult.rows"
    @close="bulkResult = null" />

  <ModalCancelRequest
    v-if="showCancelRequest"
    :target="cancelRequestTarget"
    :loading="cancelRequestLoading"
    :error="cancelRequestError"
    @close="showCancelRequest = false"
    @submit="submitCancelRequest" />

  <ModalAssign v-model="showAssign" :item="assignTarget" @confirm="savePriorityDate" />
</template>
