import { ref, computed } from "vue";
import api from "@/js/api";

/**
 * Composable untuk mengelola data Admin (list, pagination, activate/deactivate,
 * resend activation, create/edit) beserta seluruh logic terkait halaman Admin.
 * Endpoint: GET /api/admins, POST /api/admins, PUT /api/admins/{id},
 * POST /api/admins/{id}/activate, POST /api/admins/{id}/deactivate,
 * POST /api/admins/{id}/resend-activation, GET /api/roles/select, GET /api/regions/select
 */
export function useAdmins() {
  const admins = ref([]);
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
  const roles = ref([]);
  const regions = ref([]);

  const form = ref({
    admin_id: null,
    email: "",
    username: "",
    role_id: "",
    region_id: "",
    pic: "no",
    pic_client: "no",
  });

  async function fetchAdmins() {
    loading.value = true;
    error.value = null;

    try {
      const res = await api.get("/admins", {
        params: { page: page.value, item: item.value },
      });

      admins.value = res.data ?? [];
      totalData.value = res.meta?.total_data ?? 0;
      totalPage.value = res.meta?.total_page ?? 0;
    } catch (err) {
      error.value = err.response?.data?.message || "Gagal memuat data admin";
    } finally {
      loading.value = false;
    }
  }

  async function fetchRoles() {
    try {
      const res = await api.get("/roles/select");
      roles.value = res.data ?? [];
    } catch (err) {
      roles.value = [];
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

  async function activateAdmin(id) {
    try {
      await api.post(`/admins/${id}/activate`);
      await fetchAdmins();
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || "Gagal mengaktifkan admin";
      return false;
    }
  }

  async function deactivateAdmin(id) {
    try {
      await api.post(`/admins/${id}/deactivate`);
      await fetchAdmins();
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || "Gagal menonaktifkan admin";
      return false;
    }
  }

  async function resendActivation(id) {
    try {
      await api.post(`/admins/${id}/resend-activation`);
      return true;
    } catch (err) {
      error.value =
        err.response?.data?.message || "Gagal mengirim ulang email aktivasi";
      return false;
    }
  }

  function goToPage(newPage) {
    if (newPage < 1 || newPage > totalPage.value) return;
    page.value = newPage;
    fetchAdmins();
  }

  // Data tabel dengan nomor urut berdasarkan halaman aktif
  const rows = computed(() =>
    admins.value.map((admin, index) => ({
      ...admin,
      no: String((page.value - 1) * item.value + index + 1).padStart(2, "0"),
    })),
  );

  // Konfirmasi & aktifkan admin dari baris tabel
  async function handleActivate(admin) {
    const confirmed = confirm(`Aktifkan akun "${admin.admin_name}"?`);
    if (!confirmed) return;
    await activateAdmin(admin.admin_id);
  }

  // Konfirmasi & nonaktifkan admin dari baris tabel
  async function handleDeactivate(admin) {
    const confirmed = confirm(`Nonaktifkan akun "${admin.admin_name}"?`);
    if (!confirmed) return;
    await deactivateAdmin(admin.admin_id);
  }

  // Kirim ulang email aktivasi dari baris tabel
  async function handleResendActivation(admin) {
    const confirmed = confirm(
      `Kirim ulang email aktivasi ke "${admin.admin_email}"?`,
    );
    if (!confirmed) return;
    await resendActivation(admin.admin_id);
  }

  function resetForm() {
    form.value = {
      admin_id: null,
      email: "",
      username: "",
      role_id: "",
      region_id: "",
      pic: "no",
      pic_client: "no",
    };
    formError.value = null;
  }

  // Muat dropdown role & region jika belum pernah di-fetch
  async function ensureDropdownsLoaded() {
    const tasks = [];
    if (roles.value.length === 0) tasks.push(fetchRoles());
    if (regions.value.length === 0) tasks.push(fetchRegions());
    if (tasks.length) await Promise.all(tasks);
  }

  // Buka modal mode create
  async function handleAdd() {
    resetForm();
    modalMode.value = "create";
    await ensureDropdownsLoaded();
    showModal.value = true;
  }

  // Buka modal mode edit, isi form dari data baris
  async function handleEdit(admin) {
    modalMode.value = "edit";
    formError.value = null;
    await ensureDropdownsLoaded();

    form.value = {
      admin_id: admin.admin_id,
      email: admin.admin_email,
      username: admin.admin_name,
      role_id: admin.admin_ref_role != null ? Number(admin.admin_ref_role) : "",
      region_id:
        admin.admin_ref_region != null ? Number(admin.admin_ref_region) : "",
      pic: admin.admin_pic ?? "no",
      pic_client: admin.admin_pic_client ?? "no",
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
      email: form.value.email,
      username: form.value.username,
      role_id: form.value.role_id,
      region_id: form.value.region_id,
      pic: form.value.pic,
      pic_client: form.value.pic_client,
    };

    try {
      if (modalMode.value === "create") {
        await api.post("/admins", payload);
      } else {
        await api.put(`/admins/${form.value.admin_id}`, payload);
      }
      showModal.value = false;
      await fetchAdmins();
    } catch (err) {
      formError.value = err.response?.data?.message || "Gagal menyimpan admin";
    } finally {
      submitting.value = false;
    }
  }

  return {
    admins,
    rows,
    loading,
    error,
    page,
    item,
    totalData,
    totalPage,
    fetchAdmins,
    activateAdmin,
    deactivateAdmin,
    resendActivation,
    goToPage,
    handleActivate,
    handleDeactivate,
    handleResendActivation,
    handleAdd,
    handleEdit,
    // modal & form
    showModal,
    modalMode,
    submitting,
    formError,
    roles,
    regions,
    form,
    closeModal,
    submitForm,
  };
}
