import api from "@/js/api";

export function useActivity() {
  const getComments = (prId) => api.get(`/pr/${prId}/comments`);

  const addComment = (prId, payload) =>
    api.post(`/pr/${prId}/comments`, payload);

  const getHistory = (prId) => api.get(`/pr/${prId}/history`);

  const getCancelRequests = (params = {}) =>
    api.get("/pr/cancel-requests", { params });

  const reviewCancelRequest = (cancelId, mode, payload = {}) =>
    api.post(`/pr/cancel-requests/${cancelId}/${mode}`, payload);

  return {
    getComments,
    addComment,
    getHistory,
    getCancelRequests,
    reviewCancelRequest,
  };
}
