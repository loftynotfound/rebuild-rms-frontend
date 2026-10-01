import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/js/api";

// Password rule: min 8 characters, at least one uppercase, one lowercase, one number
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function useResetPassword() {
  const route = useRoute();
  const router = useRouter();

  // Mode ditentukan dari path route, sesuai 2 URL berbeda yang dikirim backend:
  // - /activate?token=...&email=...       -> set password akun baru
  // - /reset-password?code=...            -> forgot password
  const mode = route.name === "activate" ? "activate" : "reset";

  const email = route.query.email || "";
  const token = route.query.token || "";
  const code = route.query.code || "";

  const password = ref("");
  const confirmPassword = ref("");
  const loading = ref(false);
  const error = ref("");
  const success = ref(false);

  const isLinkInvalid = computed(() => {
    if (mode === "activate") return !email || !token;
    return !code;
  });

  const passwordError = computed(() => {
    if (!password.value) return "";
    if (!PASSWORD_RULE.test(password.value)) {
      return "Password must be at least 8 characters, with uppercase, lowercase, and a number";
    }
    return "";
  });

  const confirmError = computed(() => {
    if (!confirmPassword.value) return "";
    if (confirmPassword.value !== password.value) {
      return "Passwords do not match";
    }
    return "";
  });

  const isFormValid = computed(() => {
    return (
      password.value &&
      confirmPassword.value &&
      !passwordError.value &&
      !confirmError.value
    );
  });

  const pageTitle = computed(() =>
    mode === "activate" ? "Set Your Password" : "Reset Password",
  );

  const pageSubtitle = computed(() =>
    mode === "activate"
      ? "Create a password to get started"
      : "Create a new password for your account",
  );

  async function submit() {
    if (!isFormValid.value || isLinkInvalid.value) return;

    loading.value = true;
    error.value = "";

    try {
      if (mode === "activate") {
        await api.post("/auth/activate", {
          email,
          token,
          password: password.value,
        });
      } else {
        await api.post("/auth/reset-password-code", {
          reset_code: code,
          new_password: password.value,
        });
      }

      success.value = true;

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      error.value =
        err.response?.data?.message ||
        "Something went wrong. This link may have expired.";
    } finally {
      loading.value = false;
    }
  }

  return {
    mode,
    email,
    password,
    confirmPassword,
    loading,
    error,
    success,
    isLinkInvalid,
    passwordError,
    confirmError,
    isFormValid,
    pageTitle,
    pageSubtitle,
    submit,
  };
}
