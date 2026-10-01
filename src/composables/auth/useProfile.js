import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import api from "@/js/api";

export function useAdminProfile() {
  const router = useRouter();
  const authStore = useAuthStore();

  const admin = ref(null);
  const loading = ref(false);
  const saving = ref(false);
  const sendingReset = ref(false);
  const error = ref("");

  const roleOptions = ref([]);
  const regionOptions = ref([]);

  const form = reactive({
    email: "",
    username: "",
    role_id: null,
    region_id: null,
    pic: "no",
    pic_client: "no",
    signature: "",
  });

  function fillForm(data) {
    form.email = data.admin_email ?? "";
    form.username = data.admin_name ?? "";
    form.role_id = data.admin_ref_role ?? null;
    form.region_id = data.admin_ref_region ?? null;
    form.pic = data.admin_pic ?? "no";
    form.pic_client = data.admin_pic_client ?? "no";
    form.signature =
      data.admin_signature ??
      data.signature ??
      localStorage.getItem("rms_profile_signature_v7") ??
      "";
  }

  async function fetchAdmin() {
    loading.value = true;
    error.value = "";
    try {
      const adminId = authStore.admin?.admin_id;
      if (!adminId) {
        error.value = "Session not found, please log in again";
        return;
      }

      const res = await api.get(`/admins/${adminId}`);
      admin.value = res.data;
      fillForm(res.data);
    } catch (err) {
      error.value =
        err.response?.data?.message || "Failed to load profile data";
    } finally {
      loading.value = false;
    }
  }

  async function fetchOptions() {
    try {
      const [rolesRes, regionsRes] = await Promise.all([
        api.get("/roles/select"),
        api.get("/regions/select"),
      ]);
      roleOptions.value = rolesRes.data;
      regionOptions.value = regionsRes.data;
    } catch {
      // Dropdown options are non-critical; silently ignore, form still usable with current values
    }
  }

  async function saveProfile() {
    saving.value = true;
    error.value = "";
    try {
      const adminId = authStore.admin?.admin_id;
      await api.put(`/admins/${adminId}`, {
        ...form,
        admin_signature: form.signature,
      });
      if (form.signature)
        localStorage.setItem("rms_profile_signature_v7", form.signature);
      await fetchAdmin();
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || "Failed to save changes";
      return false;
    } finally {
      saving.value = false;
    }
  }

  async function sendPasswordReset() {
    sendingReset.value = true;
    error.value = "";
    try {
      await api.post("/auth/forgot-password", { email: form.email });
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || "Failed to send reset email";
      return false;
    } finally {
      sendingReset.value = false;
    }
  }

  const isPic = computed({
    get: () => form.pic === "yes",
    set: (val) => {
      form.pic = val ? "yes" : "no";
    },
  });

  const isPicClient = computed({
    get: () => form.pic_client === "yes",
    set: (val) => {
      form.pic_client = val ? "yes" : "no";
    },
  });

  function goBack() {
    router.back();
  }

  onMounted(() => {
    fetchAdmin();
    fetchOptions();
  });

  return {
    admin,
    form,
    loading,
    saving,
    sendingReset,
    error,
    roleOptions,
    regionOptions,
    isPic,
    isPicClient,
    saveProfile,
    sendPasswordReset,
    goBack,
  };
}
