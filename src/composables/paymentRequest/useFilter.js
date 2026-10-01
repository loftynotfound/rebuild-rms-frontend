import { computed, ref } from "vue";
import { requests } from "@/composables/paymentRequest/useStore";

export function useFilter() {
  const search = ref("");
  const dateFrom = ref("");
  const dateTo = ref("");

  // Gabungkan nama dan nomor rekening semua payment jadi satu teks
  const paymentText = (item) =>
    (item.payments ?? [])
      .map((p) => `${p.paymentBankAccountName} ${p.paymentBankAccountNumber}`)
      .join(" ");

  const matches = (item, query = search.value) => {
    const q = query.trim().toLowerCase();
    return (
      !q ||
      [
        item.prId,
        item.prRfpNumber,
        item.prQoutNumber,
        item.prPoNumber,
        item.prVendor,
        item.prDescriptionItem,
        item.responsibleName,
        item.adminName,
        paymentText(item),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  };

  const inDateRange = (item) =>
    (!dateFrom.value || item.prCreateDate >= dateFrom.value) &&
    (!dateTo.value || item.prCreateDate <= dateTo.value);

  const filteredRequests = computed(() =>
    requests.value.filter((item) => matches(item) && inDateRange(item)),
  );

  return {
    search,
    dateFrom,
    dateTo,
    filteredRequests,
  };
}
