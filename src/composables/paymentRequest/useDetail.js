import { ref } from "vue";
import api from "@/js/api";

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

export function useDetail() {
  const detailLoading = ref(false);
  const detailError = ref(null);

  const fetchDetail = async (id) => {
    detailLoading.value = true;
    detailError.value = null;

    try {
      const response = await api.get(`/pr/${id}`);
      return mapPRDetail(response.data);
    } catch (err) {
      detailError.value = err.response?.data?.message ?? err.message;
      console.error("Gagal mengambil detail Payment Request:", err);
      return null;
    } finally {
      detailLoading.value = false;
    }
  };

  return { fetchDetail, detailLoading, detailError };
}
