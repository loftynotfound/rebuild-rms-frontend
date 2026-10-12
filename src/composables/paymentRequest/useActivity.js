import api from "@/js/api";

export function useActivity() {
  const getComments = (prId) => api.get(`/pr/${prId}/comments`);

  const addComment = (prId, payload) =>
    api.post(`/pr/${prId}/comments`, payload);

  const getHistory = (prId) => api.get(`/pr/${prId}/history`);

  const getDocuments = (prId) => api.get(`/pr/${prId}/documents`);

  const uploadDocument = (prId, formData) =>
    api.post(`/pr/${prId}/documents`, formData);

  const deleteDocument = (prId, documentId) =>
    api.delete(`/pr/${prId}/documents/${documentId}`);

  return {
    getComments,
    addComment,
    getHistory,
    getDocuments,
    uploadDocument,
    deleteDocument,
  };
}
