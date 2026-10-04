import { ref } from "vue";

const isClient = typeof window !== "undefined";

// Status utama yang digunakan oleh Payment Request.
// Nilainya mengikuti status dari backend /api/pr.
export const STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  REVISION: "revision",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const PAYMENT_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  PAID: "paid",
  CANCELLED: "cancelled",
};

export const APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  REVISION_REQUESTED: "revision_requested",
};

const RESPONSIBLE_KEY = "ResponsibleOptionsVersionOne";

const defaultResponsibleOptions = [
  { responsible: "RUAS", coa: "5-200" },
  { responsible: "DUTA", coa: "5-100" },
];

const loadResponsibleOptions = () => {
  if (!isClient) return defaultResponsibleOptions;

  try {
    const raw = localStorage.getItem(RESPONSIBLE_KEY);

    if (raw) return JSON.parse(raw);
  } catch {}

  localStorage.setItem(
    RESPONSIBLE_KEY,
    JSON.stringify(defaultResponsibleOptions),
  );

  return defaultResponsibleOptions;
};

export const requests = ref([]);

export const detailLoading = ref(false);
export const detailError = ref(null);

export const responsibleOptions = ref(loadResponsibleOptions());

export const addResponsible = ({ responsible, coa }) => {
  responsibleOptions.value.push({ responsible, coa });

  if (!isClient) return;

  localStorage.setItem(
    RESPONSIBLE_KEY,
    JSON.stringify(responsibleOptions.value),
  );
};

// Response API menggunakan snake_case, sedangkan frontend menggunakan camelCase.
// Mapping ini menjadi satu titik untuk menyesuaikan data backend dengan kebutuhan UI.
export const mapPR = (pr) => ({
  prId: pr.pr_id,
  prRfpNumber: pr.pr_rfp_no,
  prStatus: pr.pr_status,
  prDescriptionItem: pr.pr_description_item ?? "",
  prRequestedAmount: pr.pr_requested_amount ?? 0,
  prQoutNumber: pr.pr_qout_no ?? "",
  prPoNumber: pr.pr_po_no ?? "",
  prPoNumberDisplay: pr.pr_po_no_display ?? "",
  prPoAmount: pr.pr_po_amount ?? 0,
  prCogs: pr.pr_hpp ?? 0,
  prTargetInvoiceDate: (pr.pr_target_invoice_date ?? "").slice(0, 10),
  prPriority: pr.pr_priority ?? "",
  prCreateDate: pr.pr_create_date,
  responsibleName: pr.responsible_name ?? "",
  adminName: pr.admin_name ?? "",
  prRefResponsible: pr.pr_ref_responsible,
  prRefPreviousPr: pr.pr_ref_previous_pr ?? null,
  prPreviousRfpNumber: pr.previous_rfp_no ?? "",
  prMargin: pr.pr_margin ?? 0,
  prMarginPercentage: pr.pr_margin_percentage ?? 0,
  prModifyDate: pr.pr_modify_date,
  prVendor: pr.pr_subclient ?? "",
  approvals: [],
  payments: [],
  costControl: "",
});

export const mapPRDetail = (pr) => ({
  prId: pr.pr_id,
  rfpNumber: pr.pr_rfp_no,
  rfpDate: pr.pr_rfp_date || pr.pr_create_date,
  rfpType: pr.pr_priority ?? "",
  status: pr.pr_status,
  description: pr.pr_description_item ?? "",
  totalAmount: pr.pr_requested_amount ?? 0,
  quotationNumber: pr.quotation_no ?? pr.pr_qout_no ?? "",
  poNumber: pr.pr_po_no_display || pr.pr_po_no || "",
  poAmount: pr.pr_po_amount ?? 0,
  cogs: pr.pr_hpp ?? 0,
  margin: pr.pr_margin ?? 0,
  marginPct: pr.pr_margin_percentage ?? 0,
  targetInvoiceDate: (pr.pr_target_invoice_date ?? "").slice(0, 10),
  createdAt: pr.pr_create_date,
  responsible: pr.responsible_name ?? "",
  preparedBy: pr.admin_name ?? "",
  vendor: pr.pr_subclient ?? "",
});

export const persist = () => {};

export const today = () => new Date().toISOString().slice(0, 10);

export const getRequest = (id) =>
  requests.value.find((item) => item.prId === Number(id));

export const nextId = () =>
  Math.max(0, ...requests.value.map((item) => item.prId)) + 1;

export const generateRfpNumber = () =>
  `1301-${String(nextId()).padStart(3, "0")}${new Date().getFullYear()}`;

export const money = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const date = (value) => {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

export function useStore() {
  return {
    requests,
    responsibleOptions,
    addResponsible,
    persist,
    getRequest,
    nextId,
    generateRfpNumber,
    money,
    date,
    today,
    detailLoading,
    detailError,
  };
}
