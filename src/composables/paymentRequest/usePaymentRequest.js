import { useStore } from "@/composables/paymentRequest/useStore";
import { useCreate } from "@/composables/paymentRequest/useCreate";
import { useCard } from "@/composables/paymentRequest/useCard";
import { useFilter } from "@/composables/paymentRequest/useFilter";
import { useExport } from "@/composables/paymentRequest/useExport";
import { useStatus } from "@/composables/paymentRequest/useStatus";

export function usePaymentRequest() {
  const store = useStore();
  const create = useCreate();
  const filter = useFilter();
  const exportFns = useExport();
  const status = useStatus();

  return {
    ...store,
    ...filter,
    ...create,
    ...status,
    ...exportFns,

    createCard: (source, searchFields) => useCard(source, searchFields),
  };
}
