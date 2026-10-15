import api from "@/js/api";
import { useExport } from "@/composables/paymentRequest/useExport";

const { openDocument } = useExport();

export function useCancellation() {
  const cancelPR = (prId, payload = {}) => api.post(`/pr/${prId}/cancel`, payload);

  const requestCancel = (prId, formData) => api.post(`/pr/${prId}/cancel-request`, formData);

  const getPrCancelRequests = (prId) => api.get(`/pr/${prId}/cancel-requests`);

  const getCancelRequests = (params = {}) => api.get("/pr/cancel-requests", { params });

  const reviewCancelRequest = (cancelId, mode, payload = {}) =>
    api.post(`/pr/cancel-requests/${cancelId}/${mode}`, payload);

  const openCancelDocument = (cancelId, filename) =>
    openDocument(`/pr/cancel-requests/${cancelId}/document`, filename);

  return {
    cancelPR,
    requestCancel,
    getPrCancelRequests,
    getCancelRequests,
    reviewCancelRequest,
    openCancelDocument,
  };
}
