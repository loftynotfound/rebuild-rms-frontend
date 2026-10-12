import {
  useRequest,
  STATUS,
  PAYMENT_STATUS,
  APPROVAL_STATUS,
  money,
  date,
  cardFromPR,
} from "@/composables/paymentRequest/useRequest";
import { useApproval } from "@/composables/paymentRequest/useApproval";
import { usePayment } from "@/composables/paymentRequest/usePayment"; 
import { useCancellation } from "@/composables/paymentRequest/useCancellation";
import { useActivity } from "@/composables/paymentRequest/useActivity";
import { useExport } from "@/composables/paymentRequest/useExport";

export function usePaymentRequest() {
  return {
    STATUS,
    PAYMENT_STATUS,
    APPROVAL_STATUS,
    money,
    date,
    cardFromPR,

    ...useRequest(),
    ...useApproval(),
    ...usePayment(),
    ...useCancellation(),
    ...useActivity(),
    ...useExport(),
  };
}
