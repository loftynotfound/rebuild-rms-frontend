import { ref, computed } from "vue";
import api from "@/js/api";

/**
 * Composable untuk mengelola data Role (list, pagination, CRUD)
 * beserta seluruh logic terkait halaman Admin Role.
 * Endpoint: GET/POST/PUT/DELETE /api/roles, GET /api/access, GET /api/roles/{id}
 */
export function useRoles() {
  const roles = ref([]);
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
  const accessList = ref([]);

  // ── Delete Confirmation ─────────────────────────────
  const showDeleteModal = ref(false);
  const deleteTarget = ref(null);
  const deleteSubmitting = ref(false);
  const deleteError = ref(null);

  const form = ref({
    role_id: null,
    title: "",
    access_ids: [],
  });

  async function fetchRoles() {
    loading.value = true;
    error.value = null;

    try {
      const res = await api.get("/roles", {
        params: { page: page.value, item: item.value },
      });

      roles.value = res.data ?? [];
      totalData.value = res.meta?.total_data ?? 0;
      totalPage.value = res.meta?.total_page ?? 0;
    } catch (err) {
      error.value = err.response?.data?.message || "Gagal memuat data role";
    } finally {
      loading.value = false;
    }
  }

  async function fetchAccessList() {
    try {
      // item di-set ke batas maksimal (200) karena /api/access pakai pagination,
      // sedangkan checkbox di modal butuh seluruh access sekaligus.
      const res = await api.get("/access", { params: { item: 200 } });
      accessList.value = res.data ?? [];
    } catch (err) {
      accessList.value = [];
    }
  }

  // Kelompokkan access berdasarkan access_module untuk tampilan checkbox
  const accessGroups = computed(() => {
    const groups = {};
    for (const access of accessList.value) {
      const module = access.access_module;
      if (!groups[module]) groups[module] = [];
      groups[module].push(access);
    }
    return Object.entries(groups).map(([module, accesses]) => ({
      module,
      accesses,
    }));
  });

  async function deleteRole(id) {
    try {
      await api.delete(`/roles/${id}`);
      await fetchRoles();
      return true;
    } catch (err) {
      deleteError.value =
        err.response?.data?.message || "Failed to delete role";
      return false;
    }
  }

  function goToPage(newPage) {
    if (newPage < 1 || newPage > totalPage.value) return;
    page.value = newPage;
    fetchRoles();
  }

  // Data tabel dengan nomor urut berdasarkan halaman aktif
  const rows = computed(() =>
    roles.value.map((role, index) => ({
      ...role,
      no: String((page.value - 1) * item.value + index + 1).padStart(2, "0"),
    })),
  );

  // Modal Delete
  function handleDelete(role) {
    deleteTarget.value = role;
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

    const success = await deleteRole(deleteTarget.value.role_id);

    deleteSubmitting.value = false;
    if (success) closeDeleteModal();
  }

  function resetForm() {
    form.value = {
      role_id: null,
      title: "",
      access_ids: [],
    };
    formError.value = null;
  }

  // Buka modal mode create
  async function handleAdd() {
    resetForm();
    modalMode.value = "create";
    if (accessList.value.length === 0) {
      await fetchAccessList();
    }
    showModal.value = true;
  }

  // Buka modal mode edit, ambil detail role untuk isi access_ids terpilih
  async function handleEdit(role) {
    modalMode.value = "edit";
    formError.value = null;

    if (accessList.value.length === 0) {
      await fetchAccessList();
    }

    try {
      const res = await api.get(`/roles/${role.role_id}`);
      form.value = {
        role_id: res.data.role.role_id,
        title: res.data.role.role_title,
        access_ids: res.data.access_ids ?? [],
      };
    } catch (err) {
      formError.value =
        err.response?.data?.message || "Gagal memuat detail role";
      form.value = {
        role_id: role.role_id,
        title: role.role_title,
        access_ids: [],
      };
    }

    showModal.value = true;
  }

  function closeModal() {
    showModal.value = false;
  }

  // Toggle satu access_id di form
  function toggleAccess(accessId) {
    const index = form.value.access_ids.indexOf(accessId);
    if (index === -1) {
      form.value.access_ids.push(accessId);
    } else {
      form.value.access_ids.splice(index, 1);
    }
  }

  // Submit form create/edit sesuai mode
  async function submitForm() {
    submitting.value = true;
    formError.value = null;

    const payload = {
      title: form.value.title,
      access_ids: form.value.access_ids,
    };

    try {
      if (modalMode.value === "create") {
        await api.post("/roles", payload);
      } else {
        await api.put(`/roles/${form.value.role_id}`, payload);
      }
      showModal.value = false;
      await fetchRoles();
    } catch (err) {
      formError.value = err.response?.data?.message || "Gagal menyimpan role";
    } finally {
      submitting.value = false;
    }
  }

  return {
    roles,
    rows,
    loading,
    error,
    page,
    item,
    totalData,
    totalPage,
    fetchRoles,
    deleteRole,
    goToPage,
    handleAdd,
    handleEdit,
    // modal & form
    showModal,
    modalMode,
    submitting,
    formError,
    accessGroups,
    form,
    // delete confirmation
    handleDelete,
    showDeleteModal,
    deleteTarget,
    deleteSubmitting,
    deleteError,
    closeDeleteModal,
    confirmDelete,
    closeModal,
    submitForm,
    toggleAccess,
  };
}
