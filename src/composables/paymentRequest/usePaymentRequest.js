import {
  useList,
  STATUS,
  money,
  date,
  cardFromPR,
} from "@/composables/paymentRequest/useList";
import {
  useDetail,
  PAYMENT_STATUS,
  APPROVAL_STATUS,
} from "@/composables/paymentRequest/useDetail";
import { useActivity } from "@/composables/paymentRequest/useActivity";
import { useDocument } from "@/composables/paymentRequest/useDocument";
import { useApproval } from "@/composables/paymentRequest/useApproval";
import { usePayment } from "@/composables/paymentRequest/usePayment";
import { useExport } from "@/composables/paymentRequest/useExport";

export function usePaymentRequest() {
  return {
    STATUS,
    PAYMENT_STATUS,
    APPROVAL_STATUS,
    money,
    date,
    cardFromPR,

    ...useList(),
    ...useDetail(),
    ...useActivity(),
    ...useDocument(),
    ...useApproval(),
    ...usePayment(),
    ...useExport(),
  };
}
