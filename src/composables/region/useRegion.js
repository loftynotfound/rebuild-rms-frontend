import { ref, computed } from "vue";
import api from "@/js/api";

/**
 * Composable untuk mengelola data Region (list, pagination, delete, create/edit)
 * beserta seluruh logic terkait halaman Admin Region.
 * Endpoint: GET /api/regions, POST /api/regions, PUT /api/regions/{id}, DELETE /api/regions/{id}
 */
export function useRegions() {
  const regions = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const page = ref(1);
  const item = ref(10);
  const totalData = ref(0);
  const totalPage = ref(0);

  // ── Form Create/Edit ────────────────────────────────
  const showModal = ref(false);
  const formMode = ref("create"); // 'create' | 'edit'
  const formTitle = ref("");
  const formSubmitting = ref(false);
  const formError = ref(null);
  const editingId = ref(null);

  // ── Delete Confirmation ─────────────────────────────
  const showDeleteModal = ref(false);
  const deleteTarget = ref(null);
  const deleteSubmitting = ref(false);
  const deleteError = ref(null);

  async function fetchRegions() {
    loading.value = true;
    error.value = null;

    try {
      const res = await api.get("/regions", {
        params: { page: page.value, item: item.value },
      });

      regions.value = res.data ?? [];
      totalData.value = res.meta?.total_data ?? 0;
      totalPage.value = res.meta?.total_page ?? 0;
    } catch (err) {
      error.value = err.response?.data?.message || "Gagal memuat data region";
    } finally {
      loading.value = false;
    }
  }

  async function deleteRegion(id) {
    try {
      await api.delete(`/regions/${id}`);
      await fetchRegions();
      return true;
    } catch (err) {
      deleteError.value =
        err.response?.data?.message || "Failed to delete region";
      return false;
    }
  }

  function goToPage(newPage) {
    if (newPage < 1 || newPage > totalPage.value) return;
    page.value = newPage;
    fetchRegions();
  }

  // Data tabel dengan nomor urut berdasarkan halaman aktif
  const rows = computed(() =>
    regions.value.map((region, index) => ({
      ...region,
      no: String((page.value - 1) * item.value + index + 1).padStart(2, "0"),
    })),
  );

  // Buka modal konfirmasi hapus, simpan target region
  function handleDelete(region) {
    deleteTarget.value = region;
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

    const success = await deleteRegion(deleteTarget.value.region_id);

    deleteSubmitting.value = false;
    if (success) closeDeleteModal();
  }

  // Buka modal dalam mode tambah
  function handleAdd() {
    formMode.value = "create";
    formTitle.value = "";
    formError.value = null;
    editingId.value = null;
    showModal.value = true;
  }

  // Buka modal dalam mode edit, prefill title dari baris yang dipilih
  function handleEdit(region) {
    formMode.value = "edit";
    formTitle.value = region.region_title;
    formError.value = null;
    editingId.value = region.region_id;
    showModal.value = true;
  }

  // Tutup modal & reset form
  function closeModal() {
    showModal.value = false;
    formTitle.value = "";
    formError.value = null;
    editingId.value = null;
  }

  // Submit form: create atau update tergantung formMode
  async function submitForm() {
    const title = formTitle.value.trim();
    if (!title) {
      formError.value = "Title wajib diisi";
      return;
    }

    formSubmitting.value = true;
    formError.value = null;

    try {
      if (formMode.value === "create") {
        await api.post("/regions", { title });
      } else {
        await api.put(`/regions/${editingId.value}`, { title });
      }

      await fetchRegions();
      closeModal();
    } catch (err) {
      formError.value = err.response?.data?.message || "Gagal menyimpan region";
    } finally {
      formSubmitting.value = false;
    }
  }

  return {
    regions,
    rows,
    loading,
    error,
    page,
    item,
    totalData,
    totalPage,
    fetchRegions,
    deleteRegion,
    goToPage,
    handleAdd,
    handleEdit,
    // form
    showModal,
    formMode,
    formTitle,
    formSubmitting,
    formError,
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
  };
}
