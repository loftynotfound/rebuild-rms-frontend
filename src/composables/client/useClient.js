import { ref, computed } from "vue";
import api from "@/js/api";

/**
 * Composable untuk mengelola data Client (list, pagination, CRUD)
 * beserta seluruh logic terkait halaman Client.
 * Endpoint: GET/POST/PUT/DELETE /api/clients, GET /api/regions/select
 */
export function useClients() {
  const clients = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const page = ref(1);
  const item = ref(10);
  const totalData = ref(0);
  const totalPage = ref(0);

  // ── Modal & Form State ───────────────────────────
  const showModal = ref(false);
  const modalMode = ref("create"); // 'create' | 'edit'
  const submitting = ref(false);
  const formError = ref(null);
  const regions = ref([]);
  const togglingActive = ref(false);

  // ── Delete Confirmation ─────────────────────────────
  const showDeleteModal = ref(false);
  const deleteTarget = ref(null);
  const deleteSubmitting = ref(false);
  const deleteError = ref(null);

  const form = ref({
    client_id: null,
    name: "",
    email: "",
    phone: "",
    address: "",
    region_id: "",
    client_active: "no",
  });

  async function fetchClients() {
    loading.value = true;
    error.value = null;

    try {
      const res = await api.get("/clients", {
        params: { page: page.value, item: item.value },
      });

      clients.value = res.data ?? [];
      totalData.value = res.meta?.total_data ?? 0;
      totalPage.value = res.meta?.total_page ?? 0;
    } catch (err) {
      error.value = err.response?.data?.message || "Gagal memuat data client";
    } finally {
      loading.value = false;
    }
  }

  async function fetchRegions() {
    try {
      const res = await api.get("/regions/select");
      regions.value = res.data ?? [];
    } catch (err) {
      regions.value = [];
    }
  }

  async function deleteClient(id) {
    try {
      await api.delete(`/clients/${id}`);
      await fetchClients();
      return true;
    } catch (err) {
      deleteError.value =
        err.response?.data?.message || "Failed to delete client";
      return false;
    }
  }

  function goToPage(newPage) {
    if (newPage < 1 || newPage > totalPage.value) return;
    page.value = newPage;
    fetchClients();
  }

  // Data tabel dengan nomor urut berdasarkan halaman aktif
  const rows = computed(() =>
    clients.value.map((client, index) => ({
      ...client,
      no: String((page.value - 1) * item.value + index + 1).padStart(2, "0"),
    })),
  );

  // Modal Delete
  function handleDelete(client) {
    deleteTarget.value = client;
    deleteError.value = null;
    showDeleteModal.value = true;
  }

  // Tutup modal konfirmasi hapus tanpa aksi
  function closeDeleteModal() {
    showDeleteModal.value = false;
    deleteTarget.value = null;
    deleteError.value = null;
  }

  // Eksekusi delete setelah user konfirmasi di dalam modal
  async function confirmDelete() {
    if (!deleteTarget.value) return;

    deleteSubmitting.value = true;
    deleteError.value = null;

    const success = await deleteClient(deleteTarget.value.client_id);

    deleteSubmitting.value = false;
    if (success) closeDeleteModal();
  }

  function resetForm() {
    form.value = {
      client_id: null,
      name: "",
      email: "",
      phone: "",
      address: "",
      region_id: "",
      client_active: "no",
    };
    formError.value = null;
  }

  // Buka modal mode create
  async function handleAdd() {
    resetForm();
    modalMode.value = "create";
    if (regions.value.length === 0) {
      await fetchRegions();
    }
    showModal.value = true;
  }

  // Buka modal mode edit, isi form dari data baris
  async function handleEdit(client) {
    modalMode.value = "edit";
    formError.value = null;

    if (regions.value.length === 0) {
      await fetchRegions();
    }

    form.value = {
      client_id: client.client_id,
      name: client.client_name,
      email: client.client_email,
      phone: client.client_phone,
      address: client.client_address,
      region_id:
        client.client_ref_region != null
          ? Number(client.client_ref_region)
          : "",
      client_active: client.client_active ?? "no",
    };

    showModal.value = true;
  }

  // Toggle status aktif/nonaktif client dari modal edit
  async function toggleClientActive() {
    if (!form.value.client_id) return;

    togglingActive.value = true;
    formError.value = null;

    const isActive = form.value.client_active === "yes";
    const endpoint = isActive ? "deactivate" : "activate";

    try {
      await api.post(`/clients/${form.value.client_id}/${endpoint}`);
      form.value.client_active = isActive ? "no" : "yes";
      await fetchClients();
    } catch (err) {
      formError.value =
        err.response?.data?.message || "Gagal mengubah status client";
    } finally {
      togglingActive.value = false;
    }
  }

  function closeModal() {
    showModal.value = false;
  }

  // Submit form create/edit sesuai mode
  async function submitForm() {
    submitting.value = true;
    formError.value = null;

    const payload = {
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
      address: form.value.address,
      region_id: form.value.region_id,
    };

    try {
      if (modalMode.value === "create") {
        await api.post("/clients", payload);
      } else {
        await api.put(`/clients/${form.value.client_id}`, payload);
      }
      showModal.value = false;
      await fetchClients();
    } catch (err) {
      formError.value = err.response?.data?.message || "Gagal menyimpan client";
    } finally {
      submitting.value = false;
    }
  }

  return {
    clients,
    rows,
    loading,
    error,
    page,
    item,
    totalData,
    totalPage,
    fetchClients,
    deleteClient,
    goToPage,
    handleAdd,
    handleEdit,
    // modal & form
    showModal,
    modalMode,
    submitting,
    formError,
    regions,
    form,
    closeModal,
    submitForm,
    // delete confirmation
    handleDelete,
    showDeleteModal,
    deleteTarget,
    deleteSubmitting,
    deleteError,
    closeDeleteModal,
    confirmDelete,
    // activate/deactivate
    togglingActive,
    toggleClientActive,
  };
}
