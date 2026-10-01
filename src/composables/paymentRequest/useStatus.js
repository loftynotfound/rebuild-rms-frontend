import {
  getRequest,
  requests,
  persist,
  today,
  STATUS,
  PAYMENT_STATUS,
  APPROVAL_STATUS,
} from "@/composables/paymentRequest/useStore";

const defaultApprovers = [
  { adminName: "Budi", approvalLevel: 1 },
  { adminName: "Sari", approvalLevel: 2 },
];

const nextApprovalId = () =>
  Math.max(
    0,
    ...requests.value.flatMap((item) =>
      item.approvals.map((approval) => approval.approvalId),
    ),
  ) + 1;

const currentApproval = (item) =>
  item.approvals
    .filter((approval) => approval.approvalStatus === APPROVAL_STATUS.PENDING)
    .sort((a, b) => a.approvalLevel - b.approvalLevel)[0];

const submit = (id, approvers = defaultApprovers) => {
  const item = getRequest(id);
  if (!item) return;
  if (![STATUS.DRAFT, STATUS.REVISION].includes(item.prStatus)) return;

  const firstId = nextApprovalId();
  item.approvals = approvers.map((approver, index) => ({
    approvalId: firstId + index,
    adminName: approver.adminName,
    approvalLevel: approver.approvalLevel,
    approvalStatus: APPROVAL_STATUS.PENDING,
    approvalNotes: "",
  }));

  item.prStatus = STATUS.SUBMITTED;
  item.prModifyDate = today();
  persist();
};

const submitMany = (ids) => ids.forEach((id) => submit(id));

// Approve
const approve = (id, notes = "") => {
  const item = getRequest(id);
  if (!item || item.prStatus !== STATUS.SUBMITTED) return;

  const approval = currentApproval(item);
  if (!approval) return;

  approval.approvalStatus = APPROVAL_STATUS.APPROVED;
  approval.approvalNotes = notes;

  if (!currentApproval(item)) {
    item.prStatus = STATUS.APPROVED;
    item.payments.forEach((payment) => {
      if (payment.paymentStatus === PAYMENT_STATUS.DRAFT) {
        payment.paymentStatus = PAYMENT_STATUS.PENDING;
      }
    });
  }

  item.prModifyDate = today();
  persist();
};

// Reject / revise
const decide = (id, approvalStatus, prStatus, notes) => {
  const item = getRequest(id);
  if (!item || item.prStatus !== STATUS.SUBMITTED) return;

  const approval = currentApproval(item);
  if (!approval) return;

  approval.approvalStatus = approvalStatus;
  approval.approvalNotes = notes;
  item.prStatus = prStatus;
  item.prModifyDate = today();
  persist();
};

const reject = (id, notes = "Rejected.") =>
  decide(id, APPROVAL_STATUS.REJECTED, STATUS.REJECTED, notes);

const revise = (id, notes = "Needs revision.") =>
  decide(id, APPROVAL_STATUS.REVISION_REQUESTED, STATUS.REVISION, notes);

// Confirm
const confirmPayment = (id, paymentId) => {
  const item = getRequest(id);
  if (!item || item.prStatus !== STATUS.APPROVED) return;

  const payment = item.payments.find((p) => p.paymentId === paymentId);
  if (!payment || payment.paymentStatus !== PAYMENT_STATUS.PENDING) return;

  payment.paymentStatus = PAYMENT_STATUS.PAID;
  payment.paymentPaidDate = today();

  const activePayments = item.payments.filter(
    (p) => p.paymentStatus !== PAYMENT_STATUS.CANCELLED,
  );
  if (activePayments.every((p) => p.paymentStatus === PAYMENT_STATUS.PAID)) {
    item.prStatus = STATUS.COMPLETED;
  }

  item.prModifyDate = today();
  persist();
};

// Cancel
const cancelRequest = (id) => {
  const item = getRequest(id);
  if (!item) return;
  if (
    ![STATUS.DRAFT, STATUS.REVISION, STATUS.SUBMITTED].includes(item.prStatus)
  )
    return;

  item.prStatus = STATUS.CANCELLED;
  item.prModifyDate = today();
  persist();
};

// Remove
const remove = (id) => {
  requests.value = requests.value.filter((item) => item.prId !== Number(id));
  persist();
};

export function useStatus() {
  return {
    submit,
    submitMany,
    approve,
    reject,
    revise,
    confirmPayment,
    cancelRequest,
    remove,
  };
}
