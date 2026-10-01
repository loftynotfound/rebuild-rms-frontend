<script setup>
import { ref } from "vue";
import { useResetPassword } from "@/composables/auth/useResetPassword";

const {
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
} = useResetPassword();

const showPassword = ref(false);
const showConfirmPassword = ref(false);
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#17BDAF] to-[#119E92]"
  >
    <div class="w-full max-w-md bg-white rounded-md shadow-xl p-8">
      <!-- Logo -->
      <div class="flex flex-col items-center mb-6">
        <h1 class="text-lg font-bold text-slate-700">{{ pageTitle }}</h1>
        <p class="text-sm text-slate-400 text-center mt-1">
          {{ pageSubtitle }}
        </p>
      </div>

      <!-- Link Invalid State -->
      <p v-if="isLinkInvalid" class="text-sm text-red-500 text-center">
        This link is invalid. Please make sure you opened it from the email we
        sent.
      </p>

      <!-- Success State -->
      <p v-else-if="success" class="text-sm text-teal-600 text-center">
        {{
          mode === "activate"
            ? "Your account is ready."
            : "Your password has been updated."
        }}
        Redirecting to login...
      </p>

      <!-- Form -->
      <form v-else class="space-y-4" @submit.prevent="submit">
        <!-- Email (khusus mode activate) -->
        <div v-if="mode === 'activate'" class="relative">
          <span
            class="absolute inset-y-0 left-4 flex items-center text-slate-400"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </span>
          <input
            :value="email"
            type="email"
            disabled
            class="w-full pl-12 pr-4 py-2 border border-slate-200 rounded-sm bg-slate-100 text-slate-500 placeholder-slate-400"
          />
        </div>

        <!-- Password -->
        <div class="relative">
          <span
            class="absolute inset-y-0 left-4 flex items-center text-slate-400"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder="New Password"
            autocomplete="new-password"
            class="w-full pl-12 pr-12 py-2 border rounded-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            :class="passwordError ? 'border-red-300' : 'border-slate-200'"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
            :aria-label="
              showPassword ? 'Sembunyikan password' : 'Tampilkan password'
            "
            @click="showPassword = !showPassword"
          >
            <svg
              v-if="!showPassword"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg
              v-else
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.9 5.1A10.7 10.7 0 0 1 12 5c7 0 10.5 7 10.5 7a13.2 13.2 0 0 1-3.15 4.15M6.3 6.3A13.6 13.6 0 0 0 1.5 12s3.5 7 10.5 7a10.6 10.6 0 0 0 4.2-.85"
              />
            </svg>
          </button>
        </div>
        <p v-if="passwordError" class="text-xs text-red-500 -mt-2">
          {{ passwordError }}
        </p>

        <!-- Confirm Password -->
        <div class="relative">
          <span
            class="absolute inset-y-0 left-4 flex items-center text-slate-400"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <input
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            required
            placeholder="Confirm Password"
            autocomplete="new-password"
            class="w-full pl-12 pr-12 py-2 border rounded-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            :class="confirmError ? 'border-red-300' : 'border-slate-200'"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
            :aria-label="
              showConfirmPassword
                ? 'Sembunyikan password'
                : 'Tampilkan password'
            "
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <svg
              v-if="!showConfirmPassword"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg
              v-else
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.9 5.1A10.7 10.7 0 0 1 12 5c7 0 10.5 7 10.5 7a13.2 13.2 0 0 1-3.15 4.15M6.3 6.3A13.6 13.6 0 0 0 1.5 12s3.5 7 10.5 7a10.6 10.6 0 0 0 4.2-.85"
              />
            </svg>
          </button>
        </div>
        <p v-if="confirmError" class="text-xs text-red-500 -mt-2">
          {{ confirmError }}
        </p>

        <!-- Error Message -->
        <p v-if="error" class="text-sm text-red-500 text-center">
          {{ error }}
        </p>

        <!-- Submit -->
        <div class="flex justify-center mt-2">
          <button
            type="submit"
            :disabled="!isFormValid || loading"
            class="w-60 mt-2 py-2 rounded-sm bg-[#14A89C] hover:bg-[#17BDAF] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold tracking-wide uppercase transition-colors"
          >
            {{
              loading
                ? "Processing..."
                : mode === "activate"
                  ? "Set Password"
                  : "Save Password"
            }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
