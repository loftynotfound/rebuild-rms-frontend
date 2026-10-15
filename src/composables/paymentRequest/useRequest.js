import { computed, ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/js/api";

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

const DEFAULT_SEARCH_FIELDS = [
  "prId",
  "prRfpNumber",
  "prQuotationNumber",
  "prPoNumber",
  "prVendor",
  "prDescriptionItem",
  "responsibleName",
  "adminName",
];

const DEFAULT_PER_PAGE = 12;

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

export const cardFromPR = (pr, extra = {}) => ({
  prId: pr.pr_id,
  prRfpNumber: pr.pr_rfp_no,
  prDescriptionItem: pr.pr_description_item,
  prRequestedAmount: pr.pr_requested_amount,
  prPoNumber: pr.pr_po_no || "",
  prQuotationNumber: pr.quotation_no || pr.pr_qout_no || "",
  prVendor: pr.pr_subclient ?? "",
  responsibleName: pr.responsible_name,
  adminName: pr.admin_name,
  prCreateDate: pr.pr_create_date,
  prStatus: pr.pr_status,
  ...extra,
});

export const mapPRDetail = (pr) => ({
  prId: pr.pr_id,
  rfpNumber: pr.pr_rfp_no,
  rfpDate: pr.pr_rfp_date || pr.pr_create_date,
  priority: pr.pr_priority ?? "",
  status: pr.pr_status,
  description: pr.pr_description_item ?? "",
  requestedAmount: pr.pr_requested_amount ?? 0,
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

const pickList = (response) => {
  const body = response?.data;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

const asList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

export function useRequest(source = null, searchFields = DEFAULT_SEARCH_FIELDS) {
  const authStore = useAuthStore();

  const requests = ref([]);
  const listLoading = ref(false);
  const listError = ref("");

  const search = ref("");
  const dateFrom = ref("");
  const dateTo = ref("");
  const sort = ref("");
  const page = ref(1);
  const perPage = ref(DEFAULT_PER_PAGE);

  const items = computed(() => source?.value ?? requests.value);

  const fetchByStatus = async (status) => pickList(await api.get("/pr", { params: { status } }));

  const fetchRequests = async () => {
    listLoading.value = true;
    listError.value = "";

    try {
      const results = await Promise.all(
        Object.values(STATUS).map((status) => fetchByStatus(status)),
      );

      requests.value = results.flat().map((pr) => cardFromPR(pr));
    } catch (error) {
      listError.value =
        error.response?.status === 403
          ? "Anda tidak punya akses untuk halaman ini."
          : (error.response?.data?.message ?? error.message ?? "Gagal memuat payment request.");
    } finally {
      listLoading.value = false;
    }
  };

  const paymentText = (item) =>
    (item.payments ?? [])
      .map(
        (payment) =>
          `${payment.paymentBankAccountName ?? ""} ${payment.paymentBankAccountNumber ?? ""}`,
      )
      .join(" ");

  const filteredCard = computed(() => {
    const query = search.value.trim().toLowerCase();

    const result = items.value.filter((item) => {
      const matchesSearch =
        !query ||
        searchFields.some((key) =>
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

    return [...result].sort((a, b) => {
      if (sort.value === "id") return Number(a.prId) - Number(b.prId);

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
    page.value = Math.min(Math.max(1, value), totalPages.value);
  };

  watch([search, dateFrom, dateTo, sort, perPage], () => {
    page.value = 1;
  });

  const detailLoading = ref(false);
  const detailError = ref(null);

  const getPR = (id) => api.get(`/pr/${id}`);

  const fetchDetail = async (id) => {
    detailLoading.value = true;
    detailError.value = null;

    try {
      const response = await getPR(id);
      return mapPRDetail(response.data);
    } catch (err) {
      detailError.value = err.response?.data?.message ?? err.message;
      console.error("Gagal mengambil detail Payment Request:", err);
      return null;
    } finally {
      detailLoading.value = false;
    }
  };

  const getQuotations = (keyword) => api.get("/pr/quotations", { params: { keyword } });

  const getPoOptions = (keyword, limit = 10) =>
    api.get("/pr/po-options", { params: { keyword, limit } });

  const checkLink = (params) => api.get("/pr/link-check", { params });

  const createPR = (body) => api.post("/pr", body);

  const updatePR = (prId, body) => api.put(`/pr/${prId}`, body);

  const responsibles = ref([]);
  const preparedBy = ref("");
  const lookupLoading = ref(false);

  const responsibleOptions = computed(() =>
    responsibles.value.map((item) => ({
      responsible: item.name,
      coa: item.coa,
    })),
  );

  const mapResponsible = (item) => ({
    id: item.responsible_id,
    value: String(item.responsible_id),
    name: item.responsible_name,
    coa: item.responsible_coa_code,
    label: `${item.responsible_name} ${item.responsible_coa_code}`,
  });

  const getResponsible = (id) => api.get(`/responsibles/${id}`);

  const loadResponsibles = async () => {
    const response = await api.get("/responsibles/select");
    responsibles.value = asList(response).map(mapResponsible);
  };

  const loadLookups = async () => {
    lookupLoading.value = true;

    try {
      const adminId = authStore.admin?.admin_id;

      const [, adminResponse] = await Promise.all([
        loadResponsibles(),
        adminId ? api.get(`/admins/${adminId}`) : Promise.resolve(null),
      ]);

      preparedBy.value = adminResponse?.data?.admin_name ?? "";
    } finally {
      lookupLoading.value = false;
    }
  };

  const addResponsible = async ({ responsible, coa }) => {
    await api.post("/responsibles", {
      name: responsible,
      coa_code: coa,
    });

    await loadResponsibles();

    return (
      responsibles.value.find(
        (item) =>
          item.name.toLowerCase() === responsible.toLowerCase() &&
          item.coa.toLowerCase() === coa.toLowerCase(),
      )?.value ?? ""
    );
  };

  return {
    requests,
    listLoading,
    listError,
    loading: listLoading,
    error: listError,
    fetchRequests,
    fetchCards: fetchRequests,
    fetchByStatus,
    search,
    dateFrom,
    dateTo,
    sort,
    page,
    perPage,
    filteredCard,
    card,
    totalPages,
    goToPage,
    fetchDetail,
    getPR,
    detailLoading,
    detailError,
    getQuotations,
    getPoOptions,
    checkLink,
    createPR,
    updatePR,
    responsibles,
    responsibleOptions,
    preparedBy,
    lookupLoading,
    loadResponsibles,
    loadLookups,
    addResponsible,
    getResponsible,
  };
}
