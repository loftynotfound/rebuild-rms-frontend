import api from "@/js/api";

export function useDocument() {
  const getDocuments = (prId) => api.get(`/pr/${prId}/documents`);

  const uploadDocument = (prId, formData) =>
    api.post(`/pr/${prId}/documents`, formData);

  const deleteDocument = (prId, documentId) =>
    api.delete(`/pr/${prId}/documents/${documentId}`);

  return { getDocuments, uploadDocument, deleteDocument };
}
