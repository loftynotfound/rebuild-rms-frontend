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
      try {
        const sig = await api.get("/admins/me/signature");
        form.signature = sig.data?.signature_file ?? "";
      } catch {
        form.signature = ""; // 404 = belum punya tanda tangan
      }
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

  let savedSignature = "";

  async function saveSignature() {
    const blob = await (await fetch(form.signature)).blob();
    const ext = blob.type === "image/jpeg" ? "jpg" : "png";

    const fd = new FormData();
    fd.append("file", blob, `signature.${ext}`);
    fd.append("name_pic", form.username || admin.value?.admin_name || "");

    await api.post("/admins/me/signature", fd);
    savedSignature = form.signature;
  }

  async function saveProfile() {
    saving.value = true;
    error.value = "";
    try {
      const adminId = authStore.admin?.admin_id;

      if (authStore.hasAccess("edit_other_admin")) {
        const accountData = { ...form };
        delete accountData.signature;
        await api.put(`/admins/${adminId}`, {
          email: form.email,
          username: form.username,
          role_id: form.role_id,
          region_id: form.region_id,
          pic: form.pic,
          pic_client: form.pic_client,
        });
        await saveSignature();
        await fetchAdmin();
      }

      if (form.signature && form.signature !== savedSignature) {
        await saveSignature();
      }

      await fetchAdmin();
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || "Failed to save changes";
      return false;
    } finally {
      saving.value = false;
    }
  }

  // Ubah data URL (hasil canvas / upload) menjadi File
  async function dataUrlToFile(dataUrl, filename) {
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], filename, { type: blob.type });
  }

  async function saveSignature() {
    if (!form.signature || !form.signature.startsWith("data:image"))
      return true;
    const file = await dataUrlToFile(form.signature, "signature.png");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name_pic", form.username);
    await api.post("/admins/me/signature", fd);
    return true;
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
