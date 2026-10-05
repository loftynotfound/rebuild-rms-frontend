<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

import api from "@/js/api";
import { usePaymentRequest } from "@/composables/paymentRequest/usePaymentRequest";

import Status from "@/components/paymentRequest/badge/Status.vue";
import Document from "@/components/paymentRequest/display/Document.vue";

const route = useRoute();
const { money, date } = usePaymentRequest();

const item = ref(null);
const approvals = ref([]);
const payments = ref([]);
const detailLoading = ref(false);
const loadError = ref("");

const dateOrDash = (value) => (value ? date(value) : "-");

const humanize = (s) =>
  (s ?? "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const sum = (list) =>
  list.reduce((total, p) => total + Number(p.payment_amount || 0), 0);

const loadDetail = async () => {
  const id = route.params.id;
  detailLoading.value = true;
  loadError.value = "";
  item.value = null;

  try {
    const pr = (await api.get(`/pr/${id}`)).data;

    const [payRes, apprRes, chainRes, respRes] = await Promise.all([
      api.get(`/pr/${id}/payments`).catch(() => null),
      api.get(`/pr/${id}/approvals`).catch(() => null),
      api.get(`/pr/${id}/payment-chain`).catch(() => null),
      api.get(`/responsibles/${pr.pr_ref_responsible}`).catch(() => null),
    ]);

    // Pembayaran: yang terbaru dan belum dibatalkan (sama seperti export RFP)
    payments.value = payRes?.data ?? [];
    const live = payments.value.filter((p) => p.payment_status !== "cancelled");
    const latest = live.at(-1) ?? payments.value.at(-1) ?? {};

    // Approval: round terakhir saja
    approvals.value = apprRes?.data ?? [];
    const round = Math.max(0, ...approvals.value.map((a) => a.approval_round));
    const approved = approvals.value
      .filter(
        (a) => a.approval_round === round && a.approval_status === "approved",
      )
      .sort((a, b) => a.approval_level - b.approval_level);
    const checked = approved[0];
    const finalApprover = approved.length > 1 ? approved.at(-1) : null;

    // Total pembayaran sebelumnya: PR sebelum PR ini pada chain (urut lama -> baru)
    const chain = chainRes?.data ?? [];
    const idx = chain.findIndex((c) => c.pr_id === pr.pr_id);
    const previous =
      idx > 0 ? chain.slice(0, idx).flatMap((c) => c.payments ?? []) : [];
    const totalPreviousPayment = sum(
      previous.filter((p) => p.payment_status === "paid"),
    );

    const marginPct = Math.trunc(Number(pr.pr_margin_percentage || 0) * 10) / 10;

    item.value = {
      prId: pr.pr_id,
      status: pr.pr_status,
      companyName: pr.responsible_name,

      rfpNumber: pr.pr_rfp_no,
      rfpType: humanize(latest.payment_stage),
      createdAt: pr.pr_create_date,
      rfpDate: pr.pr_create_date, // pr_rfp_date belum diisi oleh backend
      quotationNumber: pr.quotation_no || pr.pr_qout_no || "",
      poNumber: pr.pr_po_no || "PO BELUM RELEASE",

      paymentType: humanize(latest.payment_type),
      bankName: latest.payment_bank ?? "",
      bankAccountNumber: latest.payment_bank_account_no ?? "",
      bankAccountName: latest.payment_bank_account_name ?? "",

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
      postedBy: latest.payment_status === "paid" ? latest.admin_paid_name : "",
    };
  } catch (e) {
    loadError.value =
      e.response?.status === 404
        ? "Payment request not found."
        : (e.response?.data?.message ?? "Failed to load the payment request.");
  } finally {
    detailLoading.value = false;
  }
};

onMounted(loadDetail);
watch(() => route.params.id, loadDetail);
</script>

<template>
  <div v-if="item" class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <h1 class="text-2xl font-semibold text-slate-800">Detail</h1>
        <Status :status="item.status" />
      </div>
    </div>

    <div class="flex flex-col gap-4 px-6 py-6 bg-white border border-slate-200">
      <!-- Request information -->
      <div>
        <div class="py-2 border-y border-slate-200">
          <h2 class="text-sm text-slate-900 font-medium">
            Request For Payment Number:
            <span class="text-slate-600 font-normal">
              {{ item.rfpNumber }}
            </span>
          </h2>
        </div>

        <div class="pt-2 grid grid-cols-2 gap-4">
          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Type:</span>
              <span class="text-slate-900 font-medium">
                {{ item.rfpType || "-" }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Date:</span>
              <span class="text-slate-900 font-medium">
                {{ dateOrDash(item.createdAt || item.rfpDate) }}
              </span>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Quotation Number:</span>
              <span class="text-slate-900 font-medium">
                {{ item.quotationNumber || "-" }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Purchase Order Number:</span>
              <span class="text-slate-900 font-medium">
                {{ item.poNumber || "-" }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment method -->
      <div>
        <div>
          <h2
            class="py-2 border-y border-slate-200 text-sm font-semibold text-slate-900"
          >
            Payment Method:
            <span class="text-slate-600 font-normal">
              {{ item.paymentType || "-" }}
            </span>
          </h2>
        </div>

        <div class="pt-2 grid grid-cols-2 gap-4">
          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Bank Name:</span>
              <span class="text-slate-900 font-medium">
                {{ item.bankName || "-" }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Bank Account Number:</span>
              <span class="text-slate-900 font-medium">
                {{ item.bankAccountNumber || "-" }}
              </span>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Bank Account Name:</span>
              <span class="text-slate-900 font-medium">
                {{ item.bankAccountName || "-" }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Description & amounts -->
      <div>
        <div class="py-2 border-y border-slate-200 text-sm font-normal">
          <h2 class="text-slate-900 font-medium">Description:</h2>
          <span class="text-slate-600">
            {{ item.description || "-" }}
          </span>
        </div>

        <div class="pt-2 grid grid-cols-2 gap-4">
          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Total Amount:</span>
              <span class="text-slate-900 font-medium">
                {{ money(item.totalAmount) }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Purchase Order Amount:</span>
              <span class="text-slate-900 font-medium">
                {{ money(item.poAmount) }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">COGS Amount:</span>
              <span class="text-slate-900 font-medium">
                {{ money(item.cogs) }}
              </span>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Total Previous Payments:</span>
              <span class="text-slate-900 font-medium">
                {{ money(item.totalPreviousPayment) }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Margin (Rp):</span>
              <span class="text-slate-900 font-medium">
                {{ money(item.margin) }} ({{ item.marginPct }}%)
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-slate-600">Target Invoice Date:</span>
              <span class="text-slate-900 font-medium">
                {{ dateOrDash(item.targetInvoiceDate) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Responsible & PIC -->
      <div class="border-t border-slate-200">
        <div class="pt-2 grid grid-cols-2 gap-4">
          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Responsible & COA:</span>
              <span class="text-slate-900 font-medium">
                {{ item.responsible || "-" }} {{ item.coa }}
              </span>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex flex-col">
              <span class="text-slate-600">Person In Charge:</span>
              <span class="text-slate-900 font-medium">
                {{ item.preparedBy || "-" }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Approvals & payments -->
    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-sm border border-slate-200 bg-white px-6 py-4">
        <h2 class="mb-2 text-sm font-semibold text-slate-900">Approvals</h2>
        <p v-if="!approvals.length" class="text-sm text-slate-400">
          Not submitted yet.
        </p>
        <ul v-else class="divide-y divide-slate-200 text-sm">
          <li
            v-for="a in approvals"
            :key="a.approval_id"
            class="flex items-center justify-between gap-2 py-2"
          >
            <span class="text-slate-600">
              L{{ a.approval_level }} {{ a.approval_type }}
              <span v-if="a.admin_name" class="font-medium text-slate-900">
                · {{ a.admin_name }}
              </span>
              <span class="text-xs text-slate-400">
                (round {{ a.approval_round }})
              </span>
            </span>
            <span class="capitalize text-slate-900">
              {{ a.approval_status.replace("_", " ") }}
            </span>
          </li>
        </ul>
      </div>

      <div class="rounded-sm border border-slate-200 bg-white px-6 py-4">
        <h2 class="mb-2 text-sm font-semibold text-slate-900">Payments</h2>
        <p v-if="!payments.length" class="text-sm text-slate-400">
          No payment recorded.
        </p>
        <ul v-else class="divide-y divide-slate-200 text-sm">
          <li
            v-for="p in payments"
            :key="p.payment_id"
            class="flex items-center justify-between gap-2 py-2"
          >
            <span class="text-slate-600">
              {{ p.payment_stage.replace("_", " ") }}
              <span
                v-if="p.payment_priority_date"
                class="text-xs text-slate-400"
              >
                · priority {{ date(p.payment_priority_date) }}
              </span>
            </span>
            <span class="text-slate-900">
              {{ money(p.payment_amount) }}
              <span class="ml-1 text-xs capitalize text-slate-500">
                {{ p.payment_status }}
              </span>
            </span>
          </li>
        </ul>
      </div>
    </div>

    <Document :item="item" :money="money" :date="date" />
  </div>

  <div
    v-else-if="!detailLoading"
    class="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400"
  >
    {{ loadError || "Payment request not found." }}
  </div>
</template>