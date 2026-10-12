import { computed, ref, watch } from "vue";
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

export function useList(source = null, searchFields = DEFAULT_SEARCH_FIELDS) {
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

  const fetchRequests = async () => {
    listLoading.value = true;
    listError.value = "";

    try {
      const results = await Promise.all(
        Object.values(STATUS).map(async (status) => {
          const response = await api.get("/pr", {
            params: { status },
          });

          const body = response?.data;
          if (Array.isArray(body)) return body;
          if (Array.isArray(body?.data)) return body.data;

          return [];
        }),
      );

      requests.value = results.flat().map((pr) => cardFromPR(pr));
    } catch (error) {
      listError.value =
        error.response?.status === 403
          ? "Anda tidak punya akses untuk halaman ini."
          : (error.response?.data?.message ??
            error.message ??
            "Gagal memuat payment request.");
    } finally {
      listLoading.value = false;
    }
  };

  const paymentText = (item) =>
    (item.payments ?? [])
      .map(
        (payment) =>
          `${payment.paymentBankAccountName ?? ""} ${
            payment.paymentBankAccountNumber ?? ""
          }`,
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
      if (sort.value === "id") {
        return Number(a.prId) - Number(b.prId);
      }

      if (sort.value === "date") {
        return String(b.prCreateDate ?? "").localeCompare(
          String(a.prCreateDate ?? ""),
        );
      }

      return 0;
    });
  });

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(filteredCard.value.length / perPage.value)),
  );

  const card = computed(() =>
    filteredCard.value.slice(
      (page.value - 1) * perPage.value,
      page.value * perPage.value,
    ),
  );

  const goToPage = (value) => {
    page.value = Math.min(Math.max(1, value), totalPages.value);
  };

  watch([search, dateFrom, dateTo, sort, perPage], () => {
    page.value = 1;
  });

  return {
    requests,
    listLoading,
    listError,
    fetchRequests,
    loading: listLoading,
    error: listError,
    fetchCards: fetchRequests,
    money,
    date,
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
  };
}
