import { computed, ref } from "vue";

export function useCard(
  source,
  searchFields = [
    "prId",
    "prRfpNumber",
    "prQoutNumber",
    "prPoNumber",
    "prVendor",
    "prDescriptionItem",
    "responsibleName",
    "adminName",
  ],
) {
  const search = ref("");
  const dateFrom = ref("");
  const dateTo = ref("");
  const sort = ref("");
  const page = ref(1);
  const perPage = ref(12);

  const paymentText = (item) =>
    (item.payments ?? [])
      .map((p) => `${p.paymentBankAccountName} ${p.paymentBankAccountNumber}`)
      .join(" ");

  const filteredCard = computed(() => {
    const q = search.value.trim().toLowerCase();

    const result = source.value.filter((item) => {
      const matchesSearch =
        !q ||
        searchFields.some((key) =>
          String(item[key] ?? "")
            .toLowerCase()
            .includes(q),
        ) ||
        paymentText(item).toLowerCase().includes(q);

      const matchesFrom =
        !dateFrom.value || String(item.prCreateDate || "") >= dateFrom.value;

      const matchesTo =
        !dateTo.value || String(item.prCreateDate || "") <= dateTo.value;

      return matchesSearch && matchesFrom && matchesTo;
    });

    return [...result].sort((a, b) => {
      if (sort.value === "id") return a.prId - b.prId;

      if (sort.value === "date") {
        return String(b.prCreateDate).localeCompare(String(a.prCreateDate));
      }

      return 0;
    });
  });

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(filteredCard.value.length / perPage.value)),
  );

  const card = computed(() =>
    filteredCard.value.slice(
      (page.value - 1) * perPage.value,
      page.value * perPage.value,
    ),
  );

  const goToPage = (value) => {
    page.value = Math.min(Math.max(1, value), totalPages.value);
  };

  return {
    search,
    dateFrom,
    dateTo,
    sort,
    page,
    perPage,
    filteredCard,
    card,
    totalPages,
    goToPage,
  };
}
