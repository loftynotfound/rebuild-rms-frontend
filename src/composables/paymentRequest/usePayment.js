import api from "@/js/api";

export function usePayment() {
  const getPayments = (prId) => api.get(`/pr/${prId}/payments`);

  const getPaymentChain = (prId) => api.get(`/pr/${prId}/payment-chain`);

  const recordPayment = (prId, payload) => api.post(`/pr/${prId}/payments`, payload);

  const updateAmounts = (prId, payload) => api.post(`/pr/${prId}/amounts`, payload);

  const confirmPayment = (paymentId) => api.post(`/pr/payments/${paymentId}/confirm`);

  const updatePriorityDate = (paymentId, priorityDate) =>
    api.post(`/pr/payments/${paymentId}/priority-date`, {
      priority_date: priorityDate,
    });

  const cancelPayment = (paymentId, payload = {}) =>
    api.post(`/pr/payments/${paymentId}/cancel`, payload);

  return {
    getPayments,
    getPaymentChain,
    recordPayment,
    updateAmounts,
    confirmPayment,
    updatePriorityDate,
    cancelPayment,
  };
}
