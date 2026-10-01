import {
  requests,
  persist,
  nextId,
  generateRfpNumber,
  today,
  STATUS,
} from "@/composables/paymentRequest/useStore";

const save = (payload, existingId = null) => {
  const existing = existingId
    ? requests.value.find((request) => request.prId === Number(existingId))
    : null;

  const item = {
    ...existing,
    ...payload,
    prId: existingId ? Number(existingId) : payload.prId || nextId(),
    prRfpNumber:
      payload.prRfpNumber || existing?.prRfpNumber || generateRfpNumber(),
    prStatus: payload.prStatus || existing?.prStatus || STATUS.DRAFT,
    prRequestedAmount: Number(payload.prRequestedAmount || 0),
    prPoAmount: Number(payload.prPoAmount || 0),
    prCogs: Number(payload.prCogs || 0),
    prCreateDate: payload.prCreateDate || existing?.prCreateDate || today(),
    prModifyDate: today(),
    approvals: payload.approvals ?? existing?.approvals ?? [],
    payments: payload.payments ?? existing?.payments ?? [],
  };

  if (existingId) {
    const index = requests.value.findIndex(
      (request) => request.prId === Number(existingId),
    );
    if (index !== -1) requests.value[index] = item;
  } else {
    requests.value.unshift(item);
  }

  persist();

  return item;
};

export function useCreate() {
  return { save };
}
