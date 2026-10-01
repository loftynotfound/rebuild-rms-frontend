import { ref, computed } from "vue";
import api from "@/js/api";

/**
 * Composable untuk mengelola data Unit (list, pagination, create, edit, delete)
 * Endpoint: GET/POST /api/units, PUT/DELETE /api/units/{id}
 */
export function useUnits() {
  const units = ref([]);
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
  const form = ref({ id: null, title: "" });

  // ── Delete Confirmation ─────────────────────────────
  const showDeleteModal = ref(false);
  const deleteTarget = ref(null);
  const deleteSubmitting = ref(false);
  const deleteError = ref(null);

  async function fetchUnits() {
    loading.value = true;
    error.value = null;

    try {
      const res = await api.get("/units", {
        params: { page: page.value, item: item.value },
      });

      units.value = res.data ?? [];
      totalData.value = res.meta?.total_data ?? 0;
      totalPage.value = res.meta?.total_page ?? 0;
    } catch (err) {
      error.value = err.response?.data?.message || "Gagal memuat data unit";
    } finally {
      loading.value = false;
    }
  }

  async function deleteUnit(id) {
    try {
      await api.delete(`/units/${id}`);
      await fetchUnits();
      return true;
    } catch (err) {
      deleteError.value =
        err.response?.data?.message || "Failed to delete unit";
      return false;
    }
  }

  function goToPage(newPage) {
    if (newPage < 1 || newPage > totalPage.value) return;
    page.value = newPage;
    fetchUnits();
  }

  // Data tabel dengan nomor urut berdasarkan halaman aktif
  const rows = computed(() =>
    units.value.map((unit, index) => ({
      ...unit,
      no: String((page.value - 1) * item.value + index + 1).padStart(2, "0"),
    })),
  );

  // Modal Delete
  function handleDelete(unit) {
    deleteTarget.value = unit;
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

    const success = await deleteUnit(deleteTarget.value.unit_id);

    deleteSubmitting.value = false;
    if (success) closeDeleteModal();
  }

  // ── Modal Handlers ────────────────────────────────

  // Buka modal untuk tambah unit baru
  function handleAdd() {
    modalMode.value = "create";
    formError.value = null;
    form.value = { id: null, title: "" };
    showModal.value = true;
  }

  // Buka modal untuk edit unit, isi form dari data baris
  function handleEdit(unit) {
    modalMode.value = "edit";
    formError.value = null;
    form.value = { id: unit.unit_id, title: unit.unit_title };
    showModal.value = true;
  }

  function closeModal() {
    showModal.value = false;
  }

  // Submit form: create atau update tergantung modalMode
  async function submitForm() {
    if (!form.value.title.trim()) {
      formError.value = "Title wajib diisi";
      return;
    }

    submitting.value = true;
    formError.value = null;

    try {
      if (modalMode.value === "edit") {
        await api.put(`/units/${form.value.id}`, { title: form.value.title });
      } else {
        await api.post("/units", { title: form.value.title });
      }
      showModal.value = false;
      await fetchUnits();
    } catch (err) {
      formError.value = err.response?.data?.message || "Gagal menyimpan unit";
    } finally {
      submitting.value = false;
    }
  }

  return {
    units,
    rows,
    loading,
    error,
    page,
    item,
    totalData,
    totalPage,
    fetchUnits,
    deleteUnit,
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
