import api from "@/js/api";

export function usePayment() {
  const confirmPayment = (paymentId) =>
    api.post(`/pr/payments/${paymentId}/confirm`);

  const updatePriorityDate = (paymentId, priorityDate) =>
    api.post(`/pr/payments/${paymentId}/priority-date`, {
      priority_date: priorityDate,
    });

  const cancelPayment = (paymentId, payload = {}) =>
    api.post(`/pr/payments/${paymentId}/cancel`, payload);

  const updateAmounts = (prId, payload) =>
    api.post(`/pr/${prId}/amounts`, payload);

  const recordPayment = (prId, payload) =>
    api.post(`/pr/${prId}/payments`, payload);

  return {
    confirmPayment,
    updatePriorityDate,
    cancelPayment,
    updateAmounts,
    recordPayment,
  };
}
