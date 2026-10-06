import { ref } from "vue";
import api from "@/js/api";

// Status yang dikenal backend (prValidStatuses)
const API_STATUSES = [
  "draft",
  "submitted",
  "revision",
  "approved",
  "rejected",
  "completed",
  "cancelled",
];

// Samakan shape API dengan shape kartu yang dipakai Data.vue / Overview.vue
export const cardFromPR = (pr, extra = {}) => ({
  prId: pr.pr_id,
  prRfpNumber: pr.pr_rfp_no,
  prDescriptionItem: pr.pr_description_item,
  prRequestedAmount: pr.pr_requested_amount,
  prPoNumber: pr.pr_po_no || "",
  prQuotationNumber: pr.quotation_no || pr.pr_qout_no || "",
  responsibleName: pr.responsible_name,
  adminName: pr.admin_name,
  prCreateDate: pr.pr_create_date,
  prStatus: pr.pr_status,
  ...extra,
});

export function usePRList() {
  const requests = ref([]);
  const loading = ref(false);
  const error = ref("");

  const fetchRequests = async () => {
    loading.value = true;
    error.value = "";
    try {
      // GET /pr?status=x membalas { paged:false, data:[...] } dan tidak dipaginasi
      const results = await Promise.all(
        API_STATUSES.map((status) =>
          api
            .get("/pr", { params: { status } })
            .then((res) => res.data?.data ?? []),
        ),
      );
      requests.value = results.flat().map((pr) => cardFromPR(pr));
    } catch (e) {
      error.value =
        e.response?.data?.message ?? "Failed to load payment requests.";
    } finally {
      loading.value = false;
    }
  };

  return { requests, loading, error, fetchRequests };
}