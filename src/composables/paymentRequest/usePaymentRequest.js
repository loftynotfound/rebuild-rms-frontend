import { useCard, fetchDetail } from "@/composables/paymentRequest/useData";
import { useFilter } from "@/composables/paymentRequest/useFilter";
import { useExport } from "@/composables/paymentRequest/useExport";
import { useStore } from "@/composables/paymentRequest/useStore";

// usePaymentRequest menjadi satu pintu untuk seluruh fitur Payment Request.
// Setiap composable tetap memiliki tanggung jawabnya masing-masing.
// File ini hanya menggabungkan hasilnya agar mudah digunakan oleh component.
export function usePaymentRequest() {
  const card = useCard();
  const store = useStore();
  const filter = useFilter();
  const exportFns = useExport();

  return {
    ...card,
    ...store,
    ...filter,
    ...exportFns,
    useCard,
    fetchDetail,
  };
}
