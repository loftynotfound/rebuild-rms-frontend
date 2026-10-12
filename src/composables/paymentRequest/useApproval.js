import { computed, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/js/api";

const asList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

export function useApproval() {
  const authStore = useAuthStore();

  const responsibles = ref([]);
  const checkers = ref([]);
  const signatureId = ref(null);
  const preparedBy = ref("");
  const loading = ref(false);

  const responsibleOptions = computed(() =>
    responsibles.value.map((item) => ({
      responsible: item.name,
      coa: item.coa,
    })),
  );

  const getMySignature = () => api.get("/admins/me/signature");

  const saveMySignature = (formData) =>
    api.post("/admins/me/signature", formData);

  const getCheckers = () => api.get("/admins/checkers");

  const getAdmin = (adminId) => api.get(`/admins/${adminId}`);

  const mapResponsible = (item) => ({
    id: item.responsible_id,
    value: String(item.responsible_id),
    name: item.responsible_name,
    coa: item.responsible_coa_code,
    label: `${item.responsible_name} ${item.responsible_coa_code}`,
  });

  async function loadResponsibles() {
    const response = await api.get("/responsibles/select");
    responsibles.value = asList(response).map(mapResponsible);
  }

  async function load() {
    loading.value = true;

    try {
      const adminId = authStore.admin?.admin_id;

      const [, checkerResponse, signatureResponse, adminResponse] =
        await Promise.all([
          loadResponsibles(),
          getCheckers(),
          getMySignature().catch(() => null),
          adminId ? getAdmin(adminId) : Promise.resolve(null),
        ]);

      checkers.value = asList(checkerResponse)
        .filter((admin) => admin.admin_id !== adminId)
        .map((admin) => ({
          value: admin.admin_id,
          label: admin.admin_name,
        }));

      const signature = signatureResponse?.data;

      signatureId.value = signature?.signature_id ?? signature?.id ?? null;

      preparedBy.value = adminResponse?.data?.admin_name ?? "";
    } finally {
      loading.value = false;
    }
  }

  async function addResponsible({ responsible, coa }) {
    await api.post("/responsibles", {
      name: responsible,
      coa_code: coa,
    });

    await loadResponsibles();

    return (
      responsibles.value.find(
        (item) =>
          item.name.toLowerCase() === responsible.toLowerCase() &&
          item.coa.toLowerCase() === coa.toLowerCase(),
      )?.value ?? ""
    );
  }

  const submitRequest = (prId, payload = {}) =>
    api.post(`/pr/${prId}/submit`, payload);

  const submitManyRequests = (payload) => api.post("/pr/bulk-submit", payload);

  return {
    getMySignature,
    saveMySignature,
    signatureId,
    getCheckers,
    getAdmin,
    checkers,
    preparedBy,
    responsibles,
    responsibleOptions,
    loadResponsibles,
    addResponsible,
    approvalLoading: loading,
    load,
    submitRequest,
    submitManyRequests,
  };
}
