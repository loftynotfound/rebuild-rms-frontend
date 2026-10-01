import { ref, computed } from "vue";
import api from "@/js/api";

/**
 * Composable untuk mengelola data Division (list, pagination, CRUD)
 * beserta seluruh logic terkait halaman Admin Division.
 * Endpoint: GET/POST/PUT/DELETE /api/divisions
 */
export function useDivisions() {
  const divisions = ref([]);
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
    division_id: null,
    title: "",
  });

  async function fetchDivisions() {
    loading.value = true;
    error.value = null;

    try {
      const res = await api.get("/divisions", {
        params: { page: page.value, item: item.value },
      });

      divisions.value = res.data ?? [];
      totalData.value = res.meta?.total_data ?? 0;
      totalPage.value = res.meta?.total_page ?? 0;
    } catch (err) {
      error.value = err.response?.data?.message || "Gagal memuat data division";
    } finally {
      loading.value = false;
    }
  }

  async function deleteDivision(id) {
    try {
      await api.delete(`/divisions/${id}`);
      await fetchDivisions();
      return true;
    } catch (err) {
      deleteError.value =
        err.response?.data?.message || "Failed to delete division";
      return false;
    }
  }

  function goToPage(newPage) {
    if (newPage < 1 || newPage > totalPage.value) return;
    page.value = newPage;
    fetchDivisions();
  }

  // Data tabel dengan nomor urut berdasarkan halaman aktif
  const rows = computed(() =>
    divisions.value.map((division, index) => ({
      ...division,
      no: String((page.value - 1) * item.value + index + 1).padStart(2, "0"),
    })),
  );

  // Modal Delete
  function handleDelete(division) {
    deleteTarget.value = division;
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

    const success = await deleteDivision(deleteTarget.value.division_id);

    deleteSubmitting.value = false;
    if (success) closeDeleteModal();
  }

  function resetForm() {
    form.value = {
      division_id: null,
      title: "",
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
  function handleEdit(division) {
    modalMode.value = "edit";
    formError.value = null;

    form.value = {
      division_id: division.division_id,
      title: division.division_title,
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
    };

    try {
      if (modalMode.value === "create") {
        await api.post("/divisions", payload);
      } else {
        await api.put(`/divisions/${form.value.division_id}`, payload);
      }
      showModal.value = false;
      await fetchDivisions();
    } catch (err) {
      formError.value =
        err.response?.data?.message || "Gagal menyimpan division";
    } finally {
      submitting.value = false;
    }
  }

  return {
    divisions,
    rows,
    loading,
    error,
    page,
    item,
    totalData,
    totalPage,
    fetchDivisions,
    deleteDivision,
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
