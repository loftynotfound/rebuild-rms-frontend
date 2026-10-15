<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

import { useAuthStore } from "@/stores/auth";
import { usePaymentRequest } from "@/composables/paymentRequest/usePaymentRequest";

import ModalAmounts from "@/components/paymentRequest/overlay/ModalAmounts.vue";

import BadgeStatus from "@/components/paymentRequest/base/BadgeStatus.vue";
import ButtonWord from "@/components/paymentRequest/base/ButtonWord.vue";

import DisplayDocument from "@/components/paymentRequest/panel/DisplayDocument.vue";
import DisplayAttachment from "@/components/paymentRequest/panel/DisplayAttachment.vue";
import DisplayComment from "@/components/paymentRequest/panel/DisplayComment.vue";
import DisplayHistory from "@/components/paymentRequest/panel/DisplayHistory.vue";
import DisplayPayment from "@/components/paymentRequest/panel/DisplayPayment.vue";

const authStore = useAuthStore();
const route = useRoute();
const {
  money,
  date,
  getPR,
  getPayments,
  getApprovals,
  getPaymentChain,
  getResponsible,
  getPrCancelRequests,
} = usePaymentRequest();

const item = ref(null);
const approvals = ref([]);
const payments = ref([]);
const detailLoading = ref(false);
const loadError = ref("");

const showEditAmounts = ref(false);
const canEditAmounts = computed(
  () =>
    authStore.hasAccess("update_pr_amounts") &&
    ["submitted", "approved", "completed"].includes(item.value?.status),
);

const dateOrDash = (value) => (value ? date(value) : "-");

const humanize = (value) =>
  (value ?? "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const sum = (list) =>
  list.reduce((total, payment) => total + Number(payment.payment_amount || 0), 0);

const cancelRequests = ref([]);
const docError = ref("");

const viewCancelDoc = async (cancelRequest) => {
  docError.value = "";

  try {
    await openCancelDocument(cancelRequest.cancel_id, cancelRequest.cancel_document_name);
  } catch (error) {
    docError.value = error.message;
  }
};

const loadDetail = async (silent = false) => {
  const id = route.params.id;

  detailLoading.value = true;
  loadError.value = "";
  cancelRequests.value = [];

  if (!silent) item.value = null;

  try {
    const pr = (await getPR(id)).data;

    const [payRes, apprRes, chainRes, respRes, cancelRes] = await Promise.all([
      getPayments(id).catch(() => null),
      getApprovals(id).catch(() => null),
      getPaymentChain(id).catch(() => null),
      getResponsible(pr.pr_ref_responsible).catch(() => null),
      getPrCancelRequests(id).catch(() => null),
    ]);

    cancelRequests.value = cancelRes?.data ?? [];

    payments.value = payRes?.data ?? [];

    const livePayments = payments.value.filter((payment) => payment.payment_status !== "cancelled");

    const latestPayment = livePayments.at(-1) ?? payments.value.at(-1) ?? {};

    approvals.value = apprRes?.data ?? [];

    const latestRound = Math.max(0, ...approvals.value.map((approval) => approval.approval_round));

    const approved = approvals.value
      .filter(
        (approval) =>
          approval.approval_round === latestRound && approval.approval_status === "approved",
      )
      .sort((a, b) => a.approval_level - b.approval_level);

    const checked = approved[0];
    const finalApprover = approved.length > 1 ? approved.at(-1) : null;

    const chain = chainRes?.data ?? [];
    const chainIndex = chain.findIndex((entry) => entry.pr_id === pr.pr_id);

    const previousPayments =
      chainIndex > 0 ? chain.slice(0, chainIndex).flatMap((entry) => entry.payments ?? []) : [];

    const totalPreviousPayment = sum(
      previousPayments.filter((payment) => payment.payment_status === "paid"),
    );

    const marginPct = Math.trunc(Number(pr.pr_margin_percentage || 0) * 10) / 10;

    item.value = {
      prId: pr.pr_id,
      status: pr.pr_status,
      ownerId: pr.pr_ref_admin,
      companyName: pr.responsible_name,

      rfpNumber: pr.pr_rfp_no,
      rfpType: humanize(latestPayment.payment_stage),
      createdAt: pr.pr_create_date,
      rfpDate: pr.pr_create_date,
      quotationNumber: pr.quotation_no || pr.pr_qout_no || "",
      poNumber: pr.pr_po_no || "PO BELUM RELEASE",
      poNoRaw: pr.pr_po_no || "",

      paymentType: humanize(latestPayment.payment_type),
      bankName: latestPayment.payment_bank ?? "",
      bankAccountNumber: latestPayment.payment_bank_account_no ?? "",
      bankAccountName: latestPayment.payment_bank_account_name ?? "",

      description: pr.pr_description_item,
      totalAmount: pr.pr_requested_amount,
      poAmount: pr.pr_po_amount,
      cogs: pr.pr_hpp,
      margin: pr.pr_margin,
      marginPct: marginPct.toFixed(1),
      totalPreviousPayment,
      targetInvoiceDate: pr.pr_target_invoice_date || null,

      responsible: pr.responsible_name,
      coa: respRes?.data?.responsible_coa_code ?? "",
      preparedBy: pr.admin_name,
      reviewedBy: checked?.admin_name ?? "",
      approvedBy: finalApprover?.admin_name ?? "",
      postedBy: latestPayment.payment_status === "paid" ? latestPayment.admin_paid_name : "",
    };
  } catch (error) {
    loadError.value =
      error.response?.status === 404
        ? "Payment request not found."
        : (error.response?.data?.message ?? "Failed to load the payment request.");
  } finally {
    detailLoading.value = false;
  }
};

onMounted(() => loadDetail());

watch(
  () => route.params.id,
  () => loadDetail(),
);
</script>

<template>
  <div v-if="item" class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <h1 class="text-2xl font-semibold text-slate-800">Detail</h1>
        <BadgeStatus :status="item.status" />
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="canEditAmounts"
          type="button"
          class="flex h-10 items-center rounded-sm border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
          @click="showEditAmounts = true">
          Edit Amounts
        </button>

        <ButtonWord v-if="authStore.hasAccess('export_pr')" :item="item" />
      </div>
    </div>

    <div class="flex flex-col gap-4 border border-slate-200 bg-white px-6 py-6">
      <div>
        <div class="border-y border-slate-200 py-2">
          <h2 class="text-sm font-medium text-slate-900">
            Request For Payment Number:
            <span class="font-normal text-slate-600">
              {{ item.rfpNumber }}
            </span>
          </h2>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-2">
          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Type:</span>
              <span class="font-medium text-slate-900">
                {{ item.rfpType || "-" }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Date:</span>
              <span class="font-medium text-slate-900">
                {{ dateOrDash(item.createdAt || item.rfpDate) }}
              </span>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Quotation Number:</span>
              <span class="font-medium text-slate-900">
                {{ item.quotationNumber || "-" }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Purchase Order Number:</span>
              <span class="font-medium text-slate-900">
                {{ item.poNumber || "-" }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 class="border-y border-slate-200 py-2 text-sm font-semibold text-slate-900">
          Payment Method:
          <span class="font-normal text-slate-600">
            {{ item.paymentType || "-" }}
          </span>
        </h2>

        <div class="grid grid-cols-2 gap-4 pt-2">
          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Bank Name:</span>
              <span class="font-medium text-slate-900">
                {{ item.bankName || "-" }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Bank Account Number:</span>
              <span class="font-medium text-slate-900">
                {{ item.bankAccountNumber || "-" }}
              </span>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Bank Account Name:</span>
              <span class="font-medium text-slate-900">
                {{ item.bankAccountName || "-" }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="border-y border-slate-200 py-2 text-sm">
          <h2 class="font-medium text-slate-900">Description:</h2>
          <span class="text-slate-600">
            {{ item.description || "-" }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-2">
          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Total Amount:</span>
              <span class="font-medium text-slate-900">
                {{ money(item.totalAmount) }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Purchase Order Amount:</span>
              <span class="font-medium text-slate-900">
                {{ money(item.poAmount) }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">COGS Amount:</span>
              <span class="font-medium text-slate-900">
                {{ money(item.cogs) }}
              </span>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Total Previous Payments:</span>
              <span class="font-medium text-slate-900">
                {{ money(item.totalPreviousPayment) }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Margin (Rp):</span>
              <span class="font-medium text-slate-900">
                {{ money(item.margin) }} ({{ item.marginPct }}%)
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Target Invoice Date:</span>
              <span class="font-medium text-slate-900">
                {{ dateOrDash(item.targetInvoiceDate) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-slate-200">
        <div class="grid grid-cols-2 gap-4 pt-2">
          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Responsible & COA:</span>
              <span class="font-medium text-slate-900">
                {{ item.responsible || "-" }} {{ item.coa }}
              </span>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Person In Charge:</span>
              <span class="font-medium text-slate-900">
                {{ item.preparedBy || "-" }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-sm border border-slate-200 bg-white px-6 py-4">
        <h2 class="mb-2 text-sm font-semibold text-slate-900">Approvals</h2>

        <p v-if="!approvals.length" class="text-sm text-slate-400">Not submitted yet.</p>

        <ul v-else class="divide-y divide-slate-200 text-sm">
          <li v-for="approval in approvals" :key="approval.approval_id" class="space-y-1 py-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-slate-600">
                L{{ approval.approval_level }} {{ approval.approval_type }}

                <span v-if="approval.admin_name" class="font-medium text-slate-900">
                  · {{ approval.admin_name }}
                </span>

                <span class="text-xs text-slate-400"> (round {{ approval.approval_round }}) </span>
              </span>

              <span class="text-slate-900 capitalize">
                {{ approval.approval_status.replace("_", " ") }}
              </span>
            </div>

            <p v-if="approval.approval_notes" class="text-xs whitespace-pre-line text-slate-500">
              {{ approval.approval_notes }}
            </p>

            <p v-if="approval.approval_decided_date" class="text-[11px] text-slate-400">
              {{ date(approval.approval_decided_date) }}
            </p>
          </li>
        </ul>
      </div>

      <DisplayPayment
        :pr="{
          prId: item.prId,
          rfpNumber: item.rfpNumber,
          description: item.description,
          status: item.status,
          totalAmount: item.totalAmount,
        }"
        :payments="payments"
        :money="money"
        :date="date"
        @changed="loadDetail(true)" />
    </div>

    <div v-if="cancelRequests.length" class="rounded-sm border border-slate-200 bg-white px-6 py-4">
      <h2 class="mb-2 text-sm font-semibold text-slate-900">Cancellation Requests</h2>

      <p v-if="docError" class="mb-2 text-xs text-red-500">
        {{ docError }}
      </p>

      <ul class="divide-y divide-slate-200 text-sm">
        <li
          v-for="cancelRequest in cancelRequests"
          :key="cancelRequest.cancel_id"
          class="space-y-1 py-3">
          <div class="flex items-center justify-between gap-2">
            <span class="text-slate-600">
              {{ date(cancelRequest.cancel_create_date) }}

              <span v-if="cancelRequest.requester_name" class="text-slate-900">
                · {{ cancelRequest.requester_name }}
              </span>
            </span>

            <span class="font-medium text-slate-900 capitalize">
              {{ cancelRequest.cancel_status }}
            </span>
          </div>

          <p class="whitespace-pre-line text-slate-600">
            {{ cancelRequest.cancel_reason }}
          </p>

          <p v-if="cancelRequest.cancel_review_notes" class="text-xs text-slate-500">
            Finance ({{ cancelRequest.reviewer_name || "-" }}):
            {{ cancelRequest.cancel_review_notes }}
          </p>

          <button
            type="button"
            class="text-xs font-medium text-teal-600 hover:text-teal-700"
            @click="viewCancelDoc(cancelRequest)">
            {{ cancelRequest.cancel_document_name || "View document" }}
          </button>
        </li>
      </ul>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <DisplayAttachment
        :pr-id="item.prId"
        :owner-id="item.ownerId"
        :status="item.status"
        :date="date" />

      <DisplayHistory :pr-id="item.prId" :date="date" />
    </div>

    <DisplayComment :pr-id="item.prId" :date="date" />

    <DisplayDocument :item="item" :money="money" :date="date" />

    <ModalAmounts
      v-if="showEditAmounts"
      :target="{
        prId: item.prId,
        poAmount: item.poAmount,
        cogs: item.cogs,
        poNoRaw: item.poNoRaw,
      }"
      @close="showEditAmounts = false"
      @done="
        showEditAmounts = false;
        loadDetail(true);
      " />
  </div>

  <div
    v-else-if="!detailLoading"
    class="rounded-sm border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
    {{ loadError || "Payment request not found." }}
  </div>
</template>
