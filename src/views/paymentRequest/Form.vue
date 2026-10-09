<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";

import { useRoute, useRouter } from "vue-router";

import api from "@/js/api";
import { useAuthStore } from "@/stores/auth";
import { usePaymentRequest } from "@/composables/paymentRequest/usePaymentRequest";
import { useRequestLookup } from "@/composables/paymentRequest/useRequestLookup";

import Submit from "@/components/paymentRequest/button/Submit.vue";
import Draft from "@/components/paymentRequest/button/Draft.vue";

import PaymentMethod from "@/components/paymentRequest/input/PaymentMethod.vue";
import PaymentStage from "@/components/paymentRequest/input/PaymentStage.vue";
import Suggest from "@/components/paymentRequest/input/Suggest.vue";
import DateInput from "@/components/paymentRequest/input/Date.vue";

import Label from "@/components/paymentRequest/badge/Label.vue";

import Handler from "@/components/paymentRequest/modal/Handler.vue";
import Dropdown from "@/components/paymentRequest/modal/Dropdown.vue";
import SubmitPR from "@/components/paymentRequest/modal/SubmitPR.vue";

const router = useRouter();
const route = useRoute();

const { money } = usePaymentRequest();

const authStore = useAuthStore();

const {
  responsibles,
  preparedBy,
  load: loadLookups,
  addResponsible,
} = useRequestLookup();

const showSubmit = ref(false);
const submitTarget = ref(null);

const inputClass =
  "w-full rounded-sm border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 placeholder:tracking-normal tracking-tight font-medium text-slate-600 focus:outline-none focus:ring-0 focus:ring-offset-0 hover:border-teal-400 focus:border-teal-400";

const searchQuotations = async (keyword) => {
  const res = await api.get("/pr/quotations", { params: { keyword } });
  return (res.data ?? []).map((q) => ({
    key: q.quotation_id,
    value: q.quotation_no,
    title: q.quotation_no,
    subtitle: `${q.members.length} PR${q.linked_po_no ? ` · PO ${q.linked_po_no}` : ""}`,
  }));
};

const searchPOs = async (keyword) => {
  const res = await api.get("/pr/po-options", {
    params: { keyword, limit: 10 },
  });
  return (res.data ?? []).map((p) => ({
    key: p.po_id,
    value: p.po_order_num,
    title: p.po_order_num,
    subtitle: [p.po_status, p.client_name].filter(Boolean).join(" · "),
  }));
};

const COST_CONTROL_LIMIT = 50000000;
const COST_CONTROL_MAX_SIZE = 10 * 1024 * 1024;
const COST_CONTROL_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

const form = reactive({
  rfpNumber: "",
  rfpDate: new Date().toISOString().slice(0, 10),
  quotationNumber: "",
  poNumber: "",

  paymentType: "",
  paymentStage: "",
  vendor: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccount: "",

  description: "",
  totalAmount: "",
  poAmount: "",
  cogs: "",
  targetInvoiceDate: "",

  responsible: "",
  costControl: "",
});

const errors = ref({});
const saving = ref(false);
const editingId = ref(null);
const refPrevious = ref(null);
const serverError = ref("");
const linkCheck = ref(null);
const lockedQuotation = ref(false);
const lockedPo = ref(false);
const autoJoin = ref(false);
const restPayments = ref([]); // draft payment ke-2 dst, dipertahankan saat update
const firstAmount = ref(null);

const fromPo = computed(() => route.query.po ?? "");
const isFollowUp = computed(() => Boolean(refPrevious.value));

const linkLocksResponsible = computed(() =>
  Boolean(linkCheck.value?.responsible?.locked),
);
const responsibleLocked = computed(
  () => isFollowUp.value || linkLocksResponsible.value,
);
const poLocked = computed(
  () =>
    lockedPo.value ||
    ["quotation_linked", "linked_match"].includes(linkCheck.value?.code),
);

const showResponsibleModal = ref(false);

const responsibleDropdownOpen = ref(false);
const responsibleDropdown = ref(null);

const costControlInput = ref(null);
const costControlFileName = ref("");

let costControlFile = null;

const isEditing = computed(() => Boolean(editingId.value));

const isCostControlRequired = computed(
  () => Number(form.totalAmount || 0) > COST_CONTROL_LIMIT,
);

const responsibleDropdownOptions = computed(() =>
  responsibles.value.map(({ value, label }) => ({ value, label })),
);
const selectedResponsible = computed(() =>
  responsibles.value.find((r) => r.value === form.responsible),
);
const selectResponsible = (value) => {
  if (responsibleLocked.value) return;
  form.responsible = value;
  responsibleDropdownOpen.value = false;
};

const handleAddResponsible = async (payload) => {
  try {
    form.responsible = await addResponsible(payload);
  } catch (e) {
    errors.value.responsible =
      e.response?.data?.message ?? "Failed to add responsible.";
  }
};

const onOutsideClick = (event) => {
  if (
    responsibleDropdown.value &&
    !responsibleDropdown.value.contains(event.target)
  ) {
    responsibleDropdownOpen.value = false;
  }
};

const margin = computed(
  () => Number(form.poAmount || 0) - Number(form.cogs || 0),
);

const marginPct = computed(() => {
  const poAmount = Number(form.poAmount || 0);

  if (!poAmount) return "0.00";

  return ((margin.value / poAmount) * 100).toFixed(2);
});

const handleCostControl = (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

  if (!COST_CONTROL_TYPES.includes(file.type)) {
    errors.value.costControl = "File must be PDF, Word, JPG, or PNG.";
    return;
  }

  if (file.size > COST_CONTROL_MAX_SIZE) {
    errors.value.costControl = "Maximum file size is 10 MB.";
    return;
  }

  costControlFile = file;
  costControlFileName.value = file.name;
  form.costControl = file.name;
  errors.value.costControl = "";
};

const removeCostControl = () => {
  costControlFile = null;
  form.costControl = "";
  costControlFileName.value = "";

  if (costControlInput.value) {
    costControlInput.value.value = "";
  }
};

const openResponsibleModal = () => {
  showResponsibleModal.value = true;
};

let linkTimer;

const checkLink = async () => {
  const qout = form.quotationNumber.trim();
  const po = form.poNumber.trim();
  if (!qout && !po) {
    linkCheck.value = null;
    return;
  }
  try {
    const res = await api.get("/pr/link-check", {
      params: { qout_no: qout, po_no: po, exclude_pr_id: editingId.value ?? 0 },
    });
    linkCheck.value = res.data;

    const lock = res.data.responsible;
    if (lock?.locked && lock.responsible) {
      form.responsible = String(lock.responsible.responsible_id);
    }
    if (res.data.code === "quotation_linked") {
      form.poNumber = res.data.po_no_display;
    }
  } catch {
    linkCheck.value = null;
  }
};

watch(
  () => [form.quotationNumber, form.poNumber],
  () => {
    clearTimeout(linkTimer);
    linkTimer = setTimeout(checkLink, 400);
  },
);
onBeforeUnmount(() => clearTimeout(linkTimer));

const validate = (isSubmit) => {
  const next = {};

  // Wajib untuk Draft dan Submit
  if (!form.responsible) {
    next.responsible = "Responsible & COA required.";
  }

  if (!form.quotationNumber.trim()) {
    next.quotationNumber = "Quotation number required.";
  }

  if (!form.description) {
    next.description = "Description required.";
  }

  if (linkCheck.value?.level === "error") {
    next.link = linkCheck.value.message;
  }

  // Tambahan wajib hanya untuk Submit
  if (isSubmit) {
    if (!form.paymentType) {
      next.paymentType = "Payment method required.";
    }

    if (!form.vendor) {
      next.vendor = "Vendor name required.";
    }

    if (!form.totalAmount) {
      next.totalAmount = "Total amount required.";
    }

    if (!form.poAmount) {
      next.poAmount = "Purchase order amount required.";
    }

    if (!form.cogs) {
      next.cogs = "COGS amount required.";
    }

    if (isCostControlRequired.value && !form.costControl) {
      next.costControl = "Cost control file is required.";
    }

    if (!form.paymentStage) {
      next.paymentStage = "Payment stage required.";
    }
  }

  errors.value = next;

  return !Object.keys(next).length;
};

const buildPayments = () => {
  const hasFirst =
    form.paymentStage && form.paymentType && Number(form.totalAmount) > 0;
  const first = hasFirst
    ? [
        {
          stage: form.paymentStage,
          type: form.paymentType,
          amount: restPayments.value.length
            ? (firstAmount.value ?? Number(form.totalAmount))
            : Number(form.totalAmount),
          bank: form.bankName,
          bank_account_no: form.bankAccountNumber,
          bank_account_name: form.bankAccount,
        },
      ]
    : [];
  return [...first, ...restPayments.value];
};

const toPayload = () => {
  const body = {
    ref_responsible: Number(form.responsible),
    description_item: form.description,
    requested_amount: Number(form.totalAmount || 0),
    po_amount: Number(form.poAmount || 0),
    hpp: Number(form.cogs || 0),
    qout_no: form.quotationNumber,
    po_no: form.poNumber,
    target_invoice_date: form.targetInvoiceDate || "",
    ref_previous_pr: refPrevious.value,
    confirm_join_quotation: autoJoin.value,
  };
  const payments = buildPayments();
  // update: selalu kirim (mengganti draft payment); create: hanya bila ada
  if (editingId.value || payments.length) body.payments = payments;
  return body;
};

const send = (body) =>
  editingId.value
    ? api.put(`/pr/${editingId.value}`, body)
    : api.post("/pr", body);

const sendWithJoinConfirm = async (body) => {
  try {
    return await send(body);
  } catch (e) {
    const conflict = e.response?.status === 409 ? e.response.data?.data : null;
    if (!conflict?.quotation_id) throw e;

    const members = conflict.members.map((m) => m.rfp_no).join(", ");
    const ok = window.confirm(
      `Quotation ${conflict.quotation_no} sudah dipakai oleh: ${members}.\nGabung ke grup ini?`,
    );
    if (!ok) return null;
    return send({ ...body, confirm_join_quotation: true });
  }
};

const persist = async (isSubmit) => {
  if (!validate(isSubmit)) return;

  saving.value = true;
  serverError.value = "";
  try {
    const res = await sendWithJoinConfirm(toPayload());
    if (!res) return;

    const prId = editingId.value ?? res.data.pr_id;
    editingId.value = prId; // retry setelah gagal di langkah berikut = update, bukan duplikat

    if (costControlFile) {
      const fd = new FormData();
      fd.append("document_type", "cost_control");
      fd.append("file", costControlFile);
      await api.post(`/pr/${prId}/documents`, fd);
      costControlFile = null;
    }

    if (isSubmit) {
      submitTarget.value = {
        prId,
        prRfpNumber: form.rfpNumber,
        prDescriptionItem: form.description,
      };
      showSubmit.value = true;
      return;
    }
    router.push({
      name: "payment-request-overview",
      query: { status: "draft" },
    });
  } catch (e) {
    serverError.value =
      e.response?.data?.message ?? "Failed to save the payment request.";
  } finally {
    saving.value = false;
  }
};

const goOverview = () => router.replace({ name: "payment-request-overview" });

const loadFollowUp = async () => {
  try {
    const ref = route.query.ref;
    const [prRes, payRes] = await Promise.all([
      api.get(`/pr/${ref}`),
      api.get(`/pr/${ref}/payments`),
    ]);
    const prev = prRes.data;
    if (!["approved", "completed"].includes(prev.pr_status))
      return goOverview();

    const pay = (payRes.data ?? []).at(-1) ?? {};
    refPrevious.value = prev.pr_id;
    lockedQuotation.value = Boolean(prev.quotation_no || prev.pr_qout_no);
    lockedPo.value = Boolean(prev.pr_po_no);

    Object.assign(form, {
      responsible: String(prev.pr_ref_responsible),
      quotationNumber: prev.quotation_no || prev.pr_qout_no || "",
      poNumber: prev.pr_po_no || "",
      bankName: pay.payment_bank ?? "",
      bankAccountNumber: pay.payment_bank_account_no ?? "",
      bankAccount: pay.payment_bank_account_name ?? "",
    });
  } catch {
    goOverview();
  }
};

// Dibuka dari tab Quotation pada halaman PO:
//   ?po=PO-001                    -> tombol "Create PR": hanya nomor PO (soft link)
//   ?po=PO-001&quotation=Q-001    -> "Add PR" pada baris quotation: PO + quotation
const loadFromPO = () => {
  form.poNumber = String(route.query.po);
  lockedPo.value = true;

  if (route.query.quotation) {
    form.quotationNumber = String(route.query.quotation);
    lockedQuotation.value = true;
    autoJoin.value = true; // PR memang dimaksudkan bergabung ke grup ini
  }
};

const loadRequest = async () => {
  if (route.query.ref && !route.query.id) return loadFollowUp();
  if (route.query.po && !route.query.id && !route.query.ref)
    return loadFromPO();
  if (!route.query.id) return;

  try {
    const id = route.query.id;
    const [prRes, payRes, docRes] = await Promise.all([
      api.get(`/pr/${id}`),
      api.get(`/pr/${id}/payments`),
      api.get(`/pr/${id}/documents`),
    ]);
    const pr = prRes.data;
    if (!["draft", "revision"].includes(pr.pr_status)) return goOverview();

    const drafts = (payRes.data ?? []).filter(
      (p) => p.payment_status === "draft",
    );
    const [first = {}, ...rest] = drafts;

    editingId.value = pr.pr_id;
    refPrevious.value = pr.pr_ref_previous_pr ?? null;
    lockedQuotation.value = Boolean(pr.quotation_no);
    firstAmount.value = first.payment_amount ?? null;
    restPayments.value = rest.map((p) => ({
      stage: p.payment_stage,
      type: p.payment_type,
      amount: p.payment_amount,
      bank: p.payment_bank ?? "",
      bank_account_no: p.payment_bank_account_no ?? "",
      bank_account_name: p.payment_bank_account_name ?? "",
    }));

    Object.assign(form, {
      rfpNumber: pr.pr_rfp_no,
      rfpDate: (pr.pr_rfp_date || form.rfpDate).slice(0, 10),
      quotationNumber: pr.quotation_no || pr.pr_qout_no || "",
      poNumber: pr.pr_po_no || "",
      paymentStage: first.payment_stage ?? "",
      paymentType: first.payment_type ?? "",
      bankName: first.payment_bank ?? "",
      bankAccountNumber: first.payment_bank_account_no ?? "",
      bankAccount: first.payment_bank_account_name ?? "",
      description: pr.pr_description_item ?? "",
      totalAmount: pr.pr_requested_amount ?? "",
      poAmount: pr.pr_po_amount ?? "",
      cogs: pr.pr_hpp ?? "",
      targetInvoiceDate: pr.pr_target_invoice_date || null,
      responsible: String(pr.pr_ref_responsible),
    });

    if ((docRes.data ?? []).some((d) => d.document_type === "cost_control")) {
      costControlFileName.value = "Current file";
      form.costControl = "Current file";
    }
  } catch {
    goOverview();
  }
};

onMounted(() => {
  loadLookups();
  loadRequest();
  document.addEventListener("mousedown", onOutsideClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onOutsideClick);
});

watch(isCostControlRequired, (required) => {
  if (!required) errors.value.costControl = "";
});
</script>

<template>
  <div class="space-y-4">
    <!-- Title -->
    <div>
      <h1 class="text-2xl font-bold text-slate-800">
        {{
          isEditing
            ? "Modify Request Details"
            : isFollowUp
              ? "Create Follow-up Request"
              : "Create New Request"
        }}
      </h1>
      <p v-if="isFollowUp" class="mt-1 text-sm text-slate-500">
        Follow-up of request #{{ refPrevious }}. Responsible, quotation, and
        purchase order number follow the previous request.
      </p>
      <p v-if="fromPo" class="mt-1 text-sm text-slate-500">
        Creating a request for PO {{ fromPo }}.
        <span v-if="!form.quotationNumber">
          Leave the quotation number empty to only attach this PO number.
        </span>
      </p>
    </div>

    <form class="space-y-4" @submit.prevent="persist(true)">
      <section
        class="rounded-sm border border-slate-200 bg-white p-4 shadow-xs"
      >
        <div class="pb-6">
          <!-- Request Information -->
          <div
            class="mb-3 flex items-center gap-1.5 text-[15px] font-semibold text-teal-600"
          >
            <Icon icon="hugeicons:invoice-01" class="size-5" />
            <h2 class="leading-none">Request Information</h2>
          </div>

          <div class="grid gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
            <!-- Request For Payment Number -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Request For Payment Number
              </span>
              <input
                :value="form.rfpNumber || 'None'"
                readonly
                disabled
                placeholder="Generated after saving"
                class="w-full cursor-not-allowed select-none rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium tracking-tight text-slate-600 placeholder:text-slate-400 placeholder:tracking-normal selection:bg-transparent selection:text-slate-600"
              />
              <span class="text-[11px] text-slate-500">
                Generated automatically after you save it as a draft.
              </span>
            </div>

            <!-- Date -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Today's Date
              </span>
              <div class="relative">
                <Icon
                  icon="hugeicons:calendar-02"
                  class="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-600"
                />
                <input
                  v-model="form.rfpDate"
                  type="date"
                  readonly
                  disabled
                  class="w-full cursor-not-allowed rounded-sm border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 placeholder:tracking-normal tracking-tight font-medium text-slate-600"
                />
              </div>
              <span class="text-[11px] text-slate-500">
                Set today's date automatically.
              </span>
            </div>

            <!-- Quotation Number -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Quotation Number
                <span class="text-red-500">*</span>
              </span>
              <Suggest
                v-model="form.quotationNumber"
                :fetcher="searchQuotations"
                :disabled="lockedQuotation"
                placeholder="Quotation Number"
                :class="[
                  inputClass,
                  lockedQuotation && 'cursor-not-allowed bg-slate-50',
                ]"
              />

              <span
                v-if="errors.quotationNumber"
                class="mt-2 flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-100 px-2 py-1.5 text-xs text-red-500"
              >
                <Icon icon="hugeicons:alert-02" class="size-4" />
                {{ errors.quotationNumber }}
              </span>
            </div>

            <!-- Purchase Order Number -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Purchase Order Number
              </span>
              <Suggest
                v-model="form.poNumber"
                :fetcher="searchPOs"
                :disabled="poLocked"
                placeholder="Purchase Order Number"
                :class="[
                  inputClass,
                  poLocked && 'cursor-not-allowed bg-slate-50',
                ]"
              />
              <span
                v-if="linkCheck && linkCheck.code !== 'empty'"
                class="mt-1 block text-[11px]"
                :class="{
                  'text-red-500': linkCheck.level === 'error',
                  'text-amber-600': linkCheck.level === 'warning',
                  'text-teal-600': linkCheck.level === 'ok',
                  'text-slate-500': linkCheck.level === 'info',
                }"
              >
                {{ linkCheck.message }}
              </span>
            </div>
          </div>
        </div>

        <div class="py-6 border-t border-slate-200">
          <!-- Vendor Payment -->
          <div
            class="mb-3 flex items-center gap-1.5 text-[15px] font-semibold text-teal-600"
          >
            <Icon icon="hugeicons:bank" class="size-5" />
            <h2 class="leading-none">Vendor Payment</h2>
          </div>

          <div class="grid gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
            <!-- Payment Method -->
            <div>
              <PaymentMethod
                v-model="form.paymentType"
                :error="errors.paymentType"
              />
              <span
                v-if="errors.paymentType"
                class="mt-2 flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-100 px-2 py-1.5 text-xs text-red-500"
              >
                <Icon icon="hugeicons:alert-02" class="size-4" />
                {{ errors.paymentType }}
              </span>
            </div>

            <!-- Payment Stage -->
            <div>
              <PaymentStage v-model="form.paymentStage" />
              <span
                v-if="errors.paymentStage"
                class="mt-2 flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-100 px-2 py-1.5 text-xs text-red-500"
              >
                <Icon icon="hugeicons:alert-02" class="size-4" />
                {{ errors.paymentStage }}
              </span>
            </div>

            <!-- Vendor Name -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Vendor Name
                <span class="text-red-500">*</span>
              </span>
              <input
                v-model="form.vendor"
                placeholder="Vendor Name"
                class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 placeholder:tracking-normal tracking-tight font-medium text-slate-600 focus:outline-none focus:ring-0 focus:ring-offset-0 hover:border-teal-400 focus:border-teal-400"
              />
              <span
                v-if="errors.vendor"
                class="mt-2 flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-100 px-2 py-1.5 text-xs text-red-500"
              >
                <Icon icon="hugeicons:alert-02" class="size-4" />
                {{ errors.vendor }}
              </span>
            </div>

            <!-- Bank Name -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Bank Name
              </span>
              <input
                v-model="form.bankName"
                placeholder="Bank Name"
                class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 placeholder:tracking-normal tracking-tight font-medium text-slate-600 focus:outline-none focus:ring-0 focus:ring-offset-0 hover:border-teal-400 focus:border-teal-400"
              />
            </div>

            <!-- Bank Account Number -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Bank Account Number
              </span>
              <input
                v-model="form.bankAccountNumber"
                inputmode="numeric"
                placeholder="Bank Account Number"
                class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 placeholder:tracking-normal tracking-tight font-medium text-slate-600 focus:outline-none focus:ring-0 focus:ring-offset-0 hover:border-teal-400 focus:border-teal-400"
              />
            </div>

            <!-- Bank Account Name -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Bank Account Name
              </span>
              <input
                v-model="form.bankAccount"
                placeholder="Bank Account Name"
                class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 placeholder:tracking-normal tracking-tight font-medium text-slate-600 focus:outline-none focus:ring-0 focus:ring-offset-0 hover:border-teal-400 focus:border-teal-400"
              />
            </div>
          </div>
        </div>

        <div class="py-6 border-t border-slate-200">
          <!-- Payment Details -->
          <div
            class="mb-3 flex items-center gap-1.5 text-[15px] font-semibold text-teal-600"
          >
            <Icon icon="hugeicons:calculator-01" class="size-5" />
            <h2 class="leading-none">Payment Details</h2>
          </div>

          <div class="grid gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
            <!-- Description -->
            <div class="sm:col-span-2 xl:col-span-4">
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Description
                <span class="text-red-500">*</span>
              </span>
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="Description"
                class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 placeholder:tracking-normal tracking-tight font-medium text-slate-600 focus:outline-none focus:ring-0 focus:ring-offset-0 hover:border-teal-400 focus:border-teal-400"
              />
              <span
                v-if="errors.description"
                class="mt-2 flex items-center gap-2 rounded-sm border border-red-200 bg-red-100 px-2 py-1.5 text-xs text-red-500"
              >
                <Icon icon="hugeicons:alert-02" class="size-4" />
                {{ errors.description }}
              </span>
            </div>

            <!-- Total Amount -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Total Amount
                <span class="text-red-500">*</span>
              </span>
              <input
                v-model="form.totalAmount"
                type="number"
                min="0"
                placeholder="0"
                class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 placeholder:tracking-normal tracking-tight font-medium text-slate-600 focus:outline-none focus:ring-0 focus:ring-offset-0 hover:border-teal-400 focus:border-teal-400"
              />
              <span
                v-if="errors.totalAmount"
                class="mt-2 flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-100 px-2 py-1.5 text-xs text-red-500"
              >
                <Icon icon="hugeicons:alert-02" class="size-4" />
                {{ errors.totalAmount }}
              </span>
            </div>

            <!-- Purchase Order Amount -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Purchase Order Amount
                <span class="text-red-500">*</span>
              </span>
              <input
                v-model="form.poAmount"
                type="number"
                min="0"
                placeholder="0"
                class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 placeholder:tracking-normal tracking-tight font-medium text-slate-600 focus:outline-none focus:ring-0 focus:ring-offset-0 hover:border-teal-400 focus:border-teal-400"
              />
              <span
                v-if="errors.poAmount"
                class="mt-2 flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-100 px-2 py-1.5 text-xs text-red-500"
              >
                <Icon icon="hugeicons:alert-02" class="size-4" />
                {{ errors.poAmount }}
              </span>
            </div>

            <!-- COGS Amount -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                COGS Amount
                <span class="text-red-500">*</span>
              </span>
              <input
                v-model="form.cogs"
                type="number"
                min="0"
                placeholder="0"
                class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 placeholder:tracking-normal tracking-tight font-medium text-slate-600 focus:outline-none focus:ring-0 focus:ring-offset-0 hover:border-teal-400 focus:border-teal-400"
              />
              <span
                v-if="errors.cogs"
                class="mt-2 flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-100 px-2 py-1.5 text-xs text-red-500"
              >
                <Icon icon="hugeicons:alert-02" class="size-4" />
                {{ errors.cogs }}
              </span>
            </div>

            <!-- Target Invoice Date -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Target Invoice Date
              </span>
              <DateInput
                v-model="form.targetInvoiceDate"
                placeholder="Target Invoice Date"
              />
            </div>

            <!-- Margin (Money) -->
            <div
              class="rounded-sm flex flex-col justify-center items-start border border-teal-100 bg-teal-50 px-3 py-1"
            >
              <span class="mb-1 text-[14px] font-medium text-teal-800"
                >Margin (Rp)</span
              >
              <span class="font-semibold text-teal-800">
                {{ money(margin) }}
              </span>
            </div>

            <!-- Margin (Percentage) -->
            <div
              class="rounded-sm flex flex-col justify-center items-start border border-teal-100 bg-teal-50 px-3 py-1"
            >
              <span class="mb-1 text-[14px] font-medium text-teal-800"
                >Margin (%)</span
              >
              <span class="font-semibold text-teal-800">{{ marginPct }}%</span>
            </div>
          </div>
        </div>

        <div class="py-6 border-t border-slate-200">
          <!-- Approval Details -->
          <div
            class="mb-3 flex items-center gap-1.5 text-[15px] font-semibold text-teal-600"
          >
            <Icon icon="hugeicons:security-check" class="size-5" />
            <h2 class="leading-none">Approval Details</h2>
          </div>

          <div class="grid gap-x-4 sm:grid-cols-2 xl:grid-cols-4">
            <!-- Responsible & COA -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Responsible & COA
                <span class="text-red-500">*</span>
              </span>
              <div class="flex gap-2">
                <div ref="responsibleDropdown" class="relative w-full">
                  <button
                    type="button"
                    :disabled="responsibleLocked"
                    :class="
                      responsibleLocked && 'cursor-not-allowed bg-slate-50'
                    "
                    class="block w-full cursor-pointer rounded-sm border font-medium border-slate-200 px-3 py-2 pr-8 text-left text-sm text-slate-600 focus:outline-none focus:ring-0 focus:ring-offset-0 hover:border-teal-400 focus:border-teal-400"
                    @click="responsibleDropdownOpen = !responsibleDropdownOpen"
                  >
                    <span
                      :class="
                        selectedResponsible
                          ? 'text-slate-600 tracking-tight'
                          : 'text-slate-400 tracking-normal'
                      "
                    >
                      {{
                        selectedResponsible
                          ? selectedResponsible.label
                          : "Responsible & COA"
                      }}
                    </span>
                  </button>
                  <Icon
                    icon="hugeicons:arrow-down-01"
                    class="pointer-events-none absolute right-2.5 top-1/2 size-5 -translate-y-1/2 text-slate-600"
                  />
                  <Dropdown
                    v-if="responsibleDropdownOpen"
                    :options="responsibleDropdownOptions"
                    :model-value="form.responsible"
                    width-class="w-full"
                    placement="up"
                    max-height-class="max-h-30"
                    @select="selectResponsible"
                  />
                </div>

                <Label
                  v-if="
                    !responsibleLocked &&
                    authStore.hasAccess('create_responsible')
                  "
                  label="Add Responsible & COA"
                >
                  <button
                    type="button"
                    class="flex py-2 w-9 shrink-0 cursor-pointer items-center justify-center rounded-sm bg-teal-500 text-lg font-medium text-white hover:bg-teal-600"
                    @click="openResponsibleModal"
                  >
                    <Icon icon="hugeicons:add-01" class="size-5" />
                  </button>
                </Label>
              </div>
              <span
                v-if="errors.responsible"
                class="mt-2 flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-100 px-2 py-1.5 text-xs text-red-500"
              >
                <Icon icon="hugeicons:alert-02" class="size-4" />
                {{ errors.responsible }}
              </span>
            </div>

            <!-- Cost Control -->
            <div>
              <span
                class="mb-1 flex items-center gap-1 text-sm font-medium text-slate-600"
              >
                Cost Control
                <span v-if="isCostControlRequired" class="text-red-500">*</span>
              </span>
              <div class="relative">
                <input
                  id="costControlInput"
                  ref="costControlInput"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  class="peer sr-only"
                  @change="handleCostControl"
                />

                <label
                  for="costControlInput"
                  class="cursor-pointer flex w-full items-center rounded-sm border border-slate-200 px-3 py-2 pr-9 text-sm font-medium hover:border-teal-400 peer-focus:border-teal-400"
                >
                  <span
                    :class="
                      costControlFileName
                        ? 'text-slate-600 tracking-tight'
                        : 'text-slate-400 tracking-normal'
                    "
                  >
                    {{ costControlFileName || "Choose A File" }}
                  </span>
                </label>

                <button
                  v-if="form.costControl"
                  type="button"
                  class="absolute right-2.5 top-1/2 flex h-4 w-4 -translate-y-1/2 shrink-0 cursor-pointer items-center justify-center rounded-sm text-slate-600 hover:bg-slate-100"
                  @click.prevent="removeCostControl"
                >
                  <Icon icon="boxicons:x" class="size-5" />
                </button>
              </div>

              <span class="text-[11px] text-slate-500">
                PDF, Word, JPG or PNG. Maximum file size is 10 MB.
              </span>
              <span
                v-if="errors.costControl"
                class="mt-1 flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-100 px-2 py-1.5 text-xs text-red-500"
              >
                <Icon icon="hugeicons:alert-02" class="size-4" />
                {{ errors.costControl }}
              </span>
            </div>

            <!-- Prepared By -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Prepared By
              </span>
              <input
                :value="preparedBy || 'None'"
                readonly
                disabled
                class="w-full cursor-not-allowed select-none rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium tracking-tight text-slate-600 outline-none selection:bg-transparent selection:text-slate-600"
              />
            </div>
          </div>
        </div>

        <p
          v-if="serverError"
          class="mb-2 rounded-sm border border-red-200 bg-red-100 px-2 py-1.5 text-xs text-red-500"
        >
          {{ serverError }}
        </p>
        <p
          v-if="errors.link"
          class="mb-2 rounded-sm border border-red-200 bg-red-100 px-2 py-1.5 text-xs text-red-500"
        >
          {{ errors.link }}
        </p>

        <!-- Components -->
        <div class="flex flex-col gap-2">
          <Draft :saving="saving" @click="persist(false)" />
          <Submit :saving="saving" />
        </div>
      </section>
    </form>

    <Handler
      v-model="showResponsibleModal"
      :responsible-options="
        responsibles.map((r) => ({ responsible: r.name, coa: r.coa }))
      "
      @add="handleAddResponsible"
    />
    <SubmitPR
      v-if="showSubmit"
      :target="submitTarget"
      @close="showSubmit = false"
      @done="router.push(`/payment-request/${submitTarget.prId}`)"
    />
  </div>
</template>
