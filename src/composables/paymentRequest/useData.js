import { computed, ref } from "vue";
import api from "@/js/api";
import {
  requests,
  mapPR,
  mapPRDetail,
  detailLoading,
  detailError,
} from "@/composables/paymentRequest/useStore";

const DEFAULT_SEARCH_FIELDS = [
  "prId",
  "prRfpNumber",
  "prQoutNumber",
  "prPoNumber",
  "prVendor",
  "prDescriptionItem",
  "responsibleName",
  "adminName",
];

const API_PER_PAGE = 200;
const DEFAULT_PER_PAGE = 12;

export function useCard(
  source = requests,
  searchFields = DEFAULT_SEARCH_FIELDS,
) {
  const search = ref("");
  const dateFrom = ref("");
  const dateTo = ref("");
  const sort = ref("");
  const page = ref(1);
  const perPage = ref(DEFAULT_PER_PAGE);

  const loading = ref(false);
  const error = ref(null);

  // /api/pr menggunakan parameter item untuk menentukan jumlah data yang dikirim.
  // Data yang diterima kemudian digunakan sebagai sumber filter dan pagination card.
  // Nilai 200 menjaga kebutuhan UI tetap sederhana tanpa request per halaman.
  const fetchCards = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get("/pr", {
        params: {
          item: API_PER_PAGE,
        },
      });

      const body = response.data;
      const list = Array.isArray(body) ? body : (body?.data ?? []);

      requests.value = list.map(mapPR);
    } catch (err) {
      error.value = err.response?.data?.message ?? err.message;
      console.error("Gagal mengambil Payment Request:", err);
    } finally {
      loading.value = false;
    }
  };

  const paymentText = (item) =>
    (item.payments ?? [])
      .map(
        (payment) =>
          `${payment.paymentBankAccountName} ${payment.paymentBankAccountNumber}`,
      )
      .join(" ");

  // Filter dilakukan setelah data API sudah diubah melalui mapPR.
  // Search dapat mencari field PR sekaligus informasi payment yang tersedia.
  // Filter tanggal menggunakan tanggal pembuatan PR dalam format YYYY-MM-DD.
  const filteredCard = computed(() => {
    const query = search.value.trim().toLowerCase();

    const result = source.value.filter((item) => {
      const matchesSearch =
        !query ||
        searchFields.some((key) =>
          String(item[key] ?? "")
            .toLowerCase()
            .includes(query),
        ) ||
        paymentText(item).toLowerCase().includes(query);

      const createdDay = String(item.prCreateDate || "").slice(0, 10);

      const matchesFrom = !dateFrom.value || createdDay >= dateFrom.value;

      const matchesTo = !dateTo.value || createdDay <= dateTo.value;

      return matchesSearch && matchesFrom && matchesTo;
    });

    return [...result].sort((a, b) => {
      if (sort.value === "id") {
        return a.prId - b.prId;
      }

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
    loading,
    error,
    fetchCards,
    filteredCard,
    card,
    totalPages,
    goToPage,
  };
}

export const fetchDetail = async (id) => {
  detailLoading.value = true;
  detailError.value = null;

  try {
    const response = await api.get(`/pr/${id}`);
    return mapPRDetail(response.data);
  } catch (err) {
    detailError.value = err.response?.data?.message ?? err.message;
    console.error("Gagal mengambil detail Payment Request:", err);
    return null;
  } finally {
    detailLoading.value = false;
  }
};
