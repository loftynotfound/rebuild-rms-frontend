import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import api from "@/js/api";

export function useLogin() {
  const router = useRouter();
  const authStore = useAuthStore();

  const email = ref("");
  const password = ref("");
  const showPassword = ref(false);
  const loading = ref(false);
  const errorMessage = ref("");

  const togglePassword = () => {
    showPassword.value = !showPassword.value;
  };

  const handleLogin = async () => {
    errorMessage.value = "";
    loading.value = true;

    try {
      await authStore.login(email.value, password.value);
      router.push("/dashboard");
    } catch (error) {
      errorMessage.value =
        error.response?.data?.message ??
        error.message ??
        "Invalid email or password.";
    } finally {
      loading.value = false;
    }
  };

  // ── Forgot Password ──────────────────────────────
  const showForgotModal = ref(false);
  const forgotEmail = ref("");
  const forgotLoading = ref(false);
  const forgotError = ref("");
  const forgotSent = ref(false);

  function openForgotModal() {
    // Prefill with the email already typed in the login form, if any
    forgotEmail.value = email.value;
    forgotError.value = "";
    forgotSent.value = false;
    showForgotModal.value = true;
  }

  function closeForgotModal() {
    showForgotModal.value = false;
  }

  async function confirmSendResetEmail() {
    if (!forgotEmail.value) {
      forgotError.value = "Email is required.";
      return;
    }

    forgotLoading.value = true;
    forgotError.value = "";

    try {
      await api.post("/auth/forgot-password", { email: forgotEmail.value });
      forgotSent.value = true;
    } catch (error) {
      // Backend always responds with success to prevent email enumeration,
      // but this still guards against network/validation errors.
      forgotError.value =
        error.response?.data?.message ??
        "Failed to send email, please try again.";
    } finally {
      forgotLoading.value = false;
    }
  }

  return {
    email,
    password,
    showPassword,
    loading,
    errorMessage,
    togglePassword,
    handleLogin,
    showForgotModal,
    forgotEmail,
    forgotLoading,
    forgotError,
    forgotSent,
    openForgotModal,
    closeForgotModal,
    confirmSendResetEmail,
  };
}
