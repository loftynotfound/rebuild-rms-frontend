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
    class="flex min-h-screen items-center justify-center bg-linear-to-br from-[#17BDAF] to-[#119E92] p-4">
    <div class="w-full max-w-md rounded-sm bg-white p-8 shadow-xl">
      <!-- Logo -->
      <div class="mb-6 flex flex-col items-center">
        <h1 class="text-lg font-bold text-slate-700">{{ pageTitle }}</h1>
        <p class="mt-1 text-center text-sm text-slate-400">
          {{ pageSubtitle }}
        </p>
      </div>

      <!-- Link Invalid State -->
      <p v-if="isLinkInvalid" class="text-center text-sm text-red-500">
        This link is invalid. Please make sure you opened it from the email we sent.
      </p>

      <!-- Success State -->
      <p v-else-if="success" class="text-center text-sm text-teal-600">
        {{ mode === "activate" ? "Your account is ready." : "Your password has been updated." }}
        Redirecting to login...
      </p>

      <!-- Form -->
      <form v-else class="space-y-4" @submit.prevent="submit">
        <!-- Email (khusus mode activate) -->
        <div v-if="mode === 'activate'" class="relative">
          <span class="absolute inset-y-0 left-4 flex items-center text-slate-400">
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </span>
          <input
            :value="email"
            type="email"
            disabled
            class="w-full rounded-sm border border-slate-200 bg-slate-100 py-2 pr-4 pl-12 text-slate-500 placeholder-slate-400" />
        </div>

        <!-- Password -->
        <div class="relative">
          <span class="absolute inset-y-0 left-4 flex items-center text-slate-400">
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true">
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
            class="w-full rounded-sm border py-2 pr-12 pl-12 text-slate-700 placeholder-slate-400 focus:border-transparent focus:ring-2 focus:ring-teal-500 focus:outline-none"
            :class="passwordError ? 'border-red-300' : 'border-slate-200'" />
          <button
            type="button"
            class="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
            :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
            @click="showPassword = !showPassword">
            <svg
              v-if="!showPassword"
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true">
              <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg
              v-else
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true">
              <path
                d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.9 5.1A10.7 10.7 0 0 1 12 5c7 0 10.5 7 10.5 7a13.2 13.2 0 0 1-3.15 4.15M6.3 6.3A13.6 13.6 0 0 0 1.5 12s3.5 7 10.5 7a10.6 10.6 0 0 0 4.2-.85" />
            </svg>
          </button>
        </div>
        <p v-if="passwordError" class="-mt-2 text-xs text-red-500">
          {{ passwordError }}
        </p>

        <!-- Confirm Password -->
        <div class="relative">
          <span class="absolute inset-y-0 left-4 flex items-center text-slate-400">
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true">
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
            class="w-full rounded-sm border py-2 pr-12 pl-12 text-slate-700 placeholder-slate-400 focus:border-transparent focus:ring-2 focus:ring-teal-500 focus:outline-none"
            :class="confirmError ? 'border-red-300' : 'border-slate-200'" />
          <button
            type="button"
            class="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
            :aria-label="showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'"
            @click="showConfirmPassword = !showConfirmPassword">
            <svg
              v-if="!showConfirmPassword"
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true">
              <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg
              v-else
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true">
              <path
                d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.9 5.1A10.7 10.7 0 0 1 12 5c7 0 10.5 7 10.5 7a13.2 13.2 0 0 1-3.15 4.15M6.3 6.3A13.6 13.6 0 0 0 1.5 12s3.5 7 10.5 7a10.6 10.6 0 0 0 4.2-.85" />
            </svg>
          </button>
        </div>
        <p v-if="confirmError" class="-mt-2 text-xs text-red-500">
          {{ confirmError }}
        </p>

        <!-- Error Message -->
        <p v-if="error" class="text-center text-sm text-red-500">
          {{ error }}
        </p>

        <!-- Submit -->
        <div class="mt-2 flex justify-center">
          <button
            type="submit"
            :disabled="!isFormValid || loading"
            class="mt-2 w-60 rounded-sm bg-[#14A89C] py-2 font-bold tracking-wide text-white uppercase transition-colors hover:bg-[#17BDAF] disabled:cursor-not-allowed disabled:opacity-60">
            {{ loading ? "Processing..." : mode === "activate" ? "Set Password" : "Save Password" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
