import { ref } from "vue";
import api from "@/js/api";
import { useAuthStore } from "@/stores/auth";

// res = { success, message, data } (interceptor sudah unwrap axios)
const asList = (res) => (Array.isArray(res?.data) ? res.data : []);

export function useRequestLookup() {
  const authStore = useAuthStore();

  const responsibles = ref([]);
  const checkers = ref([]);
  const signatureId = ref(null);
  const preparedBy = ref("");
  const loading = ref(false);

  const mapResponsible = (r) => ({
    id: r.responsible_id,
    value: String(r.responsible_id),
    name: r.responsible_name,
    coa: r.responsible_coa_code,
    label: `${r.responsible_name} ${r.responsible_coa_code}`,
  });

  async function loadResponsibles() {
    const res = await api.get("/responsibles/select");
    responsibles.value = asList(res).map(mapResponsible);
  }

  async function load() {
    loading.value = true;
    try {
      const me = authStore.admin?.admin_id;
      const [, checkerRes, sigRes, meRes] = await Promise.all([
        loadResponsibles(),
        api.get("/admins/checkers"),
        api.get("/admins/me/signature").catch(() => null),
        me ? api.get(`/admins/${me}`) : null,
      ]);

      checkers.value = asList(checkerRes)
        .filter((a) => a.admin_id !== me) // requester tidak boleh jadi checker
        .map((a) => ({ value: a.admin_id, label: a.admin_name }));

      const sig = sigRes?.data;
      signatureId.value = sig?.signature_id ?? sig?.id ?? null;
      preparedBy.value = meRes?.data?.admin_name ?? "";
    } finally {
      loading.value = false;
    }
  }

  // Butuh akses create_responsible. Mengembalikan value (id string) untuk langsung dipilih.
  async function addResponsible({ responsible, coa }) {
    await api.post("/responsibles", { name: responsible, coa_code: coa });
    await loadResponsibles();
    return (
      responsibles.value.find(
        (r) =>
          r.name.toLowerCase() === responsible.toLowerCase() &&
          r.coa.toLowerCase() === coa.toLowerCase(),
      )?.value ?? ""
    );
  }

  return {
    responsibles,
    checkers,
    signatureId,
    preparedBy,
    loading,
    load,
    addResponsible,
  };
}
