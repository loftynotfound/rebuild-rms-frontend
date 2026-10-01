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

import { useAuthStore } from "@/stores/auth";
import { usePaymentRequest } from "@/composables/paymentRequest/usePaymentRequest";

import Submit from "@/components/paymentRequest/button/Submit.vue";
import Draft from "@/components/paymentRequest/button/Draft.vue";

import PaymentMethod from "@/components/paymentRequest/input/PaymentMethod.vue";
import PaymentStage from "@/components/paymentRequest/input/PaymentStage.vue";
import DateInput from "@/components/paymentRequest/input/Date.vue";

import Label from "@/components/paymentRequest/badge/Label.vue";

import Handler from "@/components/paymentRequest/modal/Handler.vue";
import Dropdown from "@/components/paymentRequest/modal/Dropdown.vue";

const router = useRouter();
const route = useRoute();

const {
  save,
  submit,
  requests,
  getRequest,
  money,
  responsibleOptions,
  addResponsible,
} = usePaymentRequest();

const authStore = useAuthStore();

const COST_CONTROL_LIMIT = 50000000;
const COST_CONTROL_MAX_SIZE = 10 * 1024 * 1024;
const COST_CONTROL_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

const checkerList = [
  { value: "ADM-001", label: "Budi" },
  { value: "ADM-002", label: "Sari" },
  { value: "ADM-003", label: "Hendra" },
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
  coa: "",
  costControl: "",
  checker: "",

  preparedBy: "",
  signature: "",
});

const errors = ref({});
const saving = ref(false);
const editingId = ref(null);

const showResponsibleModal = ref(false);

const responsibleDropdownOpen = ref(false);
const responsibleDropdown = ref(null);

const checkerDropdownOpen = ref(false);
const checkerDropdown = ref(null);

const costControlInput = ref(null);
const costControlFileName = ref("");

let costControlFile = null;

const isEditing = computed(() => Boolean(editingId.value));

const isCostControlRequired = computed(
  () => Number(form.totalAmount || 0) >= COST_CONTROL_LIMIT,
);

const responsibleDropdownOptions = computed(() =>
  responsibleOptions.value.map((item) => ({
    value: item.responsible,
    label: `${item.responsible} ${item.coa}`,
  })),
);

const checkerDropdownOptions = computed(() =>
  checkerList.filter((item) => item.label !== form.preparedBy),
);

const selectedChecker = computed(() =>
  checkerList.find((item) => item.value === form.checker),
);

const selectResponsible = (value) => {
  form.responsible = value;
  responsibleDropdownOpen.value = false;
};

const selectChecker = (value) => {
  form.checker = value;
  checkerDropdownOpen.value = false;
};

const onOutsideClick = (event) => {
  if (
    responsibleDropdown.value &&
    !responsibleDropdown.value.contains(event.target)
  ) {
    responsibleDropdownOpen.value = false;
  }

  if (checkerDropdown.value && !checkerDropdown.value.contains(event.target)) {
    checkerDropdownOpen.value = false;
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

const loadProfileSignature = () => {
  if (isEditing.value) return;

  form.signature =
    localStorage.getItem("rms_profile_signature") ||
    authStore.admin?.signature ||
    "";

  form.preparedBy =
    authStore.admin?.admin_name || authStore.admin?.username || "";
};

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

const handleAddResponsible = ({ responsible, coa }) => {
  addResponsible({ responsible, coa });

  form.responsible = responsible;
  form.coa = coa;
};

const validate = (isSubmit) => {
  const next = {};

  // Wajib untuk Draft dan Submit
  if (!form.responsible) {
    next.responsible = "Responsible & COA required.";
  }

  if (!form.description) {
    next.description = "Description required.";
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
      next.costControl =
        "Cost control file is required.";
    }

    if (!form.checker) {
      next.checker = "Checker required.";
    }

    if (!form.signature) {
      next.signature = "Set your signature first in your profile.";
    }
  }

  errors.value = next;

  return !Object.keys(next).length;
};

const nextPaymentId = () =>
  Math.max(
    0,
    ...requests.value.flatMap((r) => r.payments.map((p) => p.paymentId)),
  ) + 1;

const hasPaymentData = () =>
  Boolean(form.paymentType) && Number(form.totalAmount) > 0;

const buildPayments = (existingPayments = []) => {
  if (!hasPaymentData()) return existingPayments;

  const [first = {}, ...rest] = existingPayments;

  return [
    {
      ...first,
      paymentId: first.paymentId ?? nextPaymentId(),
      paymentStage: form.paymentStage,
      paymentAmount: rest.length
        ? first.paymentAmount
        : Number(form.totalAmount || 0),
      paymentType: form.paymentType,
      paymentBank: form.bankName,
      paymentBankAccountNumber: form.bankAccountNumber,
      paymentBankAccountName: form.bankAccount,
      paymentStatus: first.paymentStatus || "draft",
    },
    ...rest,
  ];
};

const buildApprovers = () => [
  { adminName: selectedChecker.value?.label ?? "", approvalLevel: 1 },
  { adminName: "Director", approvalLevel: 2 },
  { adminName: "Finance", approvalLevel: 3 },
];

const toPayload = () => ({
  prRfpNumber: form.rfpNumber,
  prQoutNumber: form.quotationNumber,
  prPoNumber: form.poNumber,
  prVendor: form.vendor,
  prDescriptionItem: form.description,
  prRequestedAmount: Number(form.totalAmount || 0),
  prPoAmount: Number(form.poAmount || 0),
  prCogs: Number(form.cogs || 0),
  prTargetInvoiceDate: form.targetInvoiceDate,
  responsibleName: form.responsible,
  adminName: form.preparedBy,
  costControl: form.costControl,
  payments: buildPayments(getRequest(editingId.value)?.payments),
});

const fillForm = (item) => {
  const payment = item.payments?.[0] ?? {};

  Object.assign(form, {
    rfpNumber: item.prRfpNumber,
    quotationNumber: item.prQoutNumber ?? "",
    poNumber: item.prPoNumber ?? "",
    paymentType: capitalize(payment.paymentType),
    paymentType: payment.paymentType ?? "",
    vendor: item.prVendor ?? "",
    bankName: payment.paymentBank ?? "",
    bankAccountNumber: payment.paymentBankAccountNumber ?? "",
    bankAccount: payment.paymentBankAccountName ?? "",
    description: item.prDescriptionItem ?? "",
    totalAmount: item.prRequestedAmount ?? "",
    poAmount: item.prPoAmount ?? "",
    cogs: item.prCogs ?? "",
    targetInvoiceDate: item.prTargetInvoiceDate ?? "",
    responsible: item.responsibleName ?? "",
    costControl: item.costControl ?? "",
    preparedBy:
      item.adminName ||
      authStore.admin?.admin_name ||
      authStore.admin?.username ||
      "",
    signature:
      localStorage.getItem("rms_profile_signature") ||
      authStore.admin?.signature ||
      "",
  });
};

const persist = (isSubmit) => {
  if (!validate(isSubmit)) return;

  saving.value = true;

  const item = save(toPayload(), editingId.value);

  if (isSubmit) submit(item.prId, buildApprovers());

  saving.value = false;

  if (!isSubmit) {
    router.push({
      name: "payment-request-overview",
      query: { status: "draft" },
    });
    return;
  }

  router.push(`/payment-request/${item.prId}`);
};

const loadRequest = () => {
  if (!route.query.id) return;

  const item = getRequest(route.query.id);

  if (!item) {
    router.replace({ name: "payment-request-overview" });
    return;
  }

  editingId.value = item.prId;
  fillForm(item);

  costControlFileName.value = item.costControl ? "Current file" : "";
};

onMounted(() => {
  loadProfileSignature();
  loadRequest();

  document.addEventListener("mousedown", onOutsideClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onOutsideClick);
});

watch(isCostControlRequired, (required) => {
  if (!required) errors.value.costControl = "";
});

watch(
  () => form.responsible,
  (value) => {
    const selected = responsibleOptions.value.find(
      (item) => item.responsible === value,
    );

    if (selected) {
      form.coa = selected.coa;
    }
  },
);
</script>

<template>
  <div class="space-y-4">
    <!-- Title -->
    <div>
      <h1 class="text-2xl font-bold text-slate-800">
        {{ isEditing ? "Modify Request Details" : "Create New Request" }}
      </h1>
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
              </span>
              <input
                v-model="form.quotationNumber"
                placeholder="Quotation Number"
                class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 placeholder:tracking-normal tracking-tight font-medium text-slate-600 focus:outline-none focus:ring-0 focus:ring-offset-0 hover:border-teal-400 focus:border-teal-400"
              />
            </div>

            <!-- Purchase Order Number -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Purchase Order Number
              </span>
              <input
                v-model="form.poNumber"
                placeholder="Purchase Order Number"
                class="w-full rounded-sm border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 placeholder:tracking-normal tracking-tight font-medium text-slate-600 focus:outline-none focus:ring-0 focus:ring-offset-0 hover:border-teal-400 focus:border-teal-400"
              />
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
                    class="block w-full cursor-pointer rounded-sm border font-medium border-slate-200 px-3 py-2 pr-8 text-left text-sm text-slate-600 focus:outline-none focus:ring-0 focus:ring-offset-0 hover:border-teal-400 focus:border-teal-400"
                    @click="responsibleDropdownOpen = !responsibleDropdownOpen"
                  >
                    <span
                      :class="
                        form.responsible
                          ? 'text-slate-600 tracking-tight'
                          : 'text-slate-400 tracking-normal'
                      "
                    >
                      {{
                        form.responsible
                          ? `${form.responsible} ${form.coa}`
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

                <Label label="Add Responsible & COA">
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

            <!-- Checker -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Checker
                <span class="text-red-500">*</span>
              </span>
              <div ref="checkerDropdown" class="relative w-full">
                <button
                  type="button"
                  class="block w-full cursor-pointer rounded-sm border font-medium border-slate-200 px-3 py-2 pr-8 text-left text-sm text-slate-600 focus:outline-none focus:ring-0 focus:ring-offset-0 hover:border-teal-400 focus:border-teal-400"
                  @click="checkerDropdownOpen = !checkerDropdownOpen"
                >
                  <span
                    :class="
                      selectedChecker
                        ? 'text-slate-600 tracking-tight'
                        : 'text-slate-400 tracking-normal'
                    "
                  >
                    {{ selectedChecker ? selectedChecker.label : "Checker" }}
                  </span>
                </button>
                <Icon
                  icon="hugeicons:arrow-down-01"
                  class="pointer-events-none absolute right-2.5 top-1/2 size-5 -translate-y-1/2 text-slate-600"
                />
                <Dropdown
                  v-if="checkerDropdownOpen"
                  :options="checkerDropdownOptions"
                  :model-value="form.checker"
                  width-class="w-full"
                  placement="up"
                  max-height-class="max-h-30"
                  @select="selectChecker"
                />
              </div>
              <span class="text-[11px] text-slate-500">
                The person who checks this request.
              </span>
              <span
                v-if="errors.checker"
                class="mt-1 flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-100 px-2 py-1.5 text-xs text-red-500"
              >
                <Icon icon="hugeicons:alert-02" class="size-4" />
                {{ errors.checker }}
              </span>
            </div>

            <!-- Prepared By -->
            <div>
              <span class="mb-1 block text-sm font-medium text-slate-600">
                Prepared By
              </span>
              <input
                :value="form.signature ? form.preparedBy : 'None'"
                readonly
                disabled
                class="w-full cursor-not-allowed select-none rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium tracking-tight text-slate-600 outline-none selection:bg-transparent selection:text-slate-600"
              />
              <span class="text-[11px] text-slate-500">
                Set your signature in your profile so your name appeared
              </span>
              <span
                v-if="errors.signature"
                class="mt-1 flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-100 px-2 py-1.5 text-xs text-red-500"
              >
                <Icon icon="hugeicons:alert-02" class="size-4" />
                {{ errors.signature }}
              </span>
            </div>
          </div>
        </div>

        <!-- Components -->
        <div class="flex flex-col gap-2">
          <Draft :saving="saving" @click="persist(false)" />
          <Submit :saving="saving" />
        </div>
      </section>
    </form>

    <Handler
      v-model="showResponsibleModal"
      :responsible-options="responsibleOptions"
      @add="handleAddResponsible"
    />
  </div>
</template>
