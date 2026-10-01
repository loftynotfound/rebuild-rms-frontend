import { ref, computed } from "vue";
import api from "@/js/api";

/**
 * Composable untuk mengelola data Access (list, pagination, CRUD)
 * beserta seluruh logic terkait halaman Role Access.
 * Endpoint: GET/POST/PUT/DELETE /api/access
 */
export function useAccess() {
  const accessList = ref([]);
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

  // ── Delete Confirmation ─────────────────────────────
  const showDeleteModal = ref(false);
  const deleteTarget = ref(null);
  const deleteSubmitting = ref(false);
  const deleteError = ref(null);

  const form = ref({
    access_id: null,
    title: "",
    module: "",
    slug: "",
  });

  async function fetchAccess() {
    loading.value = true;
    error.value = null;

    try {
      const res = await api.get("/access", {
        params: { page: page.value, item: item.value },
      });

      accessList.value = res.data ?? [];
      totalData.value = res.meta?.total_data ?? 0;
      totalPage.value = res.meta?.total_page ?? 0;
    } catch (err) {
      error.value = err.response?.data?.message || "Gagal memuat data access";
    } finally {
      loading.value = false;
    }
  }

  async function deleteAccess(id) {
    try {
      await api.delete(`/access/${id}`);
      await fetchAccess();
      return true;
    } catch (err) {
      deleteError.value =
        err.response?.data?.message || "Failed to delete access";
      return false;
    }
  }

  function goToPage(newPage) {
    if (newPage < 1 || newPage > totalPage.value) return;
    page.value = newPage;
    fetchAccess();
  }

  // Data tabel dengan nomor urut berdasarkan halaman aktif
  const rows = computed(() =>
    accessList.value.map((access, index) => ({
      ...access,
      no: String((page.value - 1) * item.value + index + 1).padStart(2, "0"),
    })),
  );

  // Modal Delete
  function handleDelete(access) {
    deleteTarget.value = access;
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

    const success = await deleteAccess(deleteTarget.value.access_id);

    deleteSubmitting.value = false;
    if (success) closeDeleteModal();
  }

  function resetForm() {
    form.value = {
      access_id: null,
      title: "",
      module: "",
      slug: "",
    };
    formError.value = null;
  }

  // Buka modal mode create
  function handleAdd() {
    resetForm();
    modalMode.value = "create";
    showModal.value = true;
  }

  // Buka modal mode edit, isi form dari data baris
  function handleEdit(access) {
    modalMode.value = "edit";
    formError.value = null;

    form.value = {
      access_id: access.access_id,
      title: access.access_title,
      module: access.access_module,
      slug: access.access_slug,
    };

    showModal.value = true;
  }

  function closeModal() {
    showModal.value = false;
  }

  // Submit form create/edit sesuai mode
  async function submitForm() {
    submitting.value = true;
    formError.value = null;

    const payload = {
      title: form.value.title,
      module: form.value.module,
      slug: form.value.slug,
    };

    try {
      if (modalMode.value === "create") {
        await api.post("/access", payload);
      } else {
        await api.put(`/access/${form.value.access_id}`, payload);
      }
      showModal.value = false;
      await fetchAccess();
    } catch (err) {
      formError.value = err.response?.data?.message || "Gagal menyimpan access";
    } finally {
      submitting.value = false;
    }
  }

  return {
    accessList,
    rows,
    loading,
    error,
    page,
    item,
    totalData,
    totalPage,
    fetchAccess,
    deleteAccess,
    goToPage,
    handleAdd,
    handleEdit,
    // modal & form
    showModal,
    modalMode,
    submitting,
    formError,
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
  };
}
