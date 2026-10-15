import api from "@/js/api";

export function useApproval() {
  const getMySignature = () => api.get("/admins/me/signature");

  const saveMySignature = (formData) => api.post("/admins/me/signature", formData);

  const getCheckers = () => api.get("/admins/checkers");

  const getAdmin = (adminId) => api.get(`/admins/${adminId}`);

  const submitRequest = (prId, payload = {}) => api.post(`/pr/${prId}/submit`, payload);

  const submitManyRequests = (payload) => api.post("/pr/bulk-submit", payload);

  const getMyApprovals = () => api.get("/pr/my-approvals");

  const getMyDecisions = (params = {}) => api.get("/pr/my-decisions", { params });

  const getApprovals = (prId) => api.get(`/pr/${prId}/approvals`);

  const decide = (approvalId, kind, payload = {}) =>
    api.post(`/pr/approvals/${approvalId}/${kind}`, payload);

  const bulkDecide = (payload) => api.post("/pr/approvals/bulk-decide", payload);

  return {
    getMySignature,
    saveMySignature,
    getCheckers,
    getAdmin,
    submitRequest,
    submitManyRequests,
    getMyApprovals,
    getMyDecisions,
    getApprovals,
    decide,
    bulkDecide,
  };
}
