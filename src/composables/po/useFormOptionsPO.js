import { ref, watch } from "vue";
import api from "@/js/api";

// Dropdown options & client search yang dipakai bersama oleh form Create PO
// dan form Edit PO (di halaman detail), supaya tidak duplikasi logic fetch.
export function usePOFormOptions() {
  const optionsError = ref("");

  const regionOptions = ref([]);
  const picOptions = ref([]);
  const picClientOptions = ref([]);
  const divisionOptions = ref([]);
  const unitOptions = ref([]);
  const currentPpn = ref(null);

  // Dropdown yang tampil langsung di form utama (region, pic office, pic client,
  // division, ppn). Unit sengaja dipisah — hanya dipakai di modal Add/Edit Item
  async function fetchFormOptions() {
    try {
      const [regionRes, picRes, picClientRes, divisionRes, ppnRes] =
        await Promise.all([
          api.get("/regions/select"),
          api.get("/admins/pic"),
          api.get("/admins/pic-client"),
          api.get("/divisions/select"),
          api.get("/ppn/current"),
        ]);
      regionOptions.value = regionRes.data ?? [];
      picOptions.value = picRes.data ?? [];
      picClientOptions.value = picClientRes.data ?? [];
      divisionOptions.value = divisionRes.data ?? [];
      currentPpn.value = ppnRes.data ?? null;
    } catch {
      optionsError.value = "Failed to load form data";
    }
  }

  // unit dipanggil saat modal Add/Edit Item dibuka pertama kali.
  async function fetchUnitOptions() {
    if (unitOptions.value.length > 0) return;
    try {
      const res = await api.get("/units/select");
      unitOptions.value = res.data ?? [];
    } catch {
      optionsError.value = "Failed to load unit options";
    }
  }

  // ── Client search & select ────────────────────────
  const clientKeyword = ref("");
  const clientOptions = ref([]);
  const clientSearchLoading = ref(false);
  let clientSearchTimeout = null;
  let suppressNextSearch = false;

  function makeClientSearch(form) {
    watch(clientKeyword, (keyword) => {
      clearTimeout(clientSearchTimeout);

      if (suppressNextSearch) {
        suppressNextSearch = false;
        return;
      }

      if (form.client_id) {
        form.client_id = 0;
      }

      if (!keyword) {
        clientOptions.value = [];
        return;
      }
      clientSearchTimeout = setTimeout(async () => {
        clientSearchLoading.value = true;
        try {
          const res = await api.get("/clients/select", { params: { keyword } });
          clientOptions.value = res.data ?? [];
        } catch {
          clientOptions.value = [];
        } finally {
          clientSearchLoading.value = false;
        }
      }, 400);
    });

    function selectClient(client) {
      suppressNextSearch = true;
      form.client_id = client.client_id;
      form.client_name = client.client_name;
      form.client_email = client.client_email;
      form.client_phone = client.client_phone;
      form.client_address = client.client_address;
      clientKeyword.value = client.client_name;
      clientOptions.value = [];
    }

    function clearSelectedClient() {
      suppressNextSearch = true;
      form.client_id = 0;
      form.client_name = "";
      form.client_email = "";
      form.client_phone = "";
      form.client_address = "";
      clientKeyword.value = "";
      clientOptions.value = [];
    }

    function presetClientKeyword(name) {
      suppressNextSearch = true;
      clientKeyword.value = name;
    }

    return { selectClient, clearSelectedClient, presetClientKeyword };
  }

  return {
    optionsError,
    regionOptions,
    picOptions,
    picClientOptions,
    divisionOptions,
    unitOptions,
    currentPpn,
    fetchFormOptions,
    fetchUnitOptions,
    clientKeyword,
    clientOptions,
    clientSearchLoading,
    makeClientSearch,
  };
}
