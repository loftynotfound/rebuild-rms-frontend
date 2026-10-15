<script setup>
import { useLogin } from "@/composables/auth/useLogin";
import Modal from "@/components/ui/Modal.vue";

const {
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
} = useLogin();
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-linear-to-br from-[#17BDAF] to-[#119E92] p-4">
    <div class="w-full max-w-md rounded-md bg-white p-8 shadow-xl">
      <!-- Logo -->
      <div class="mb-8 flex flex-col items-center">
        <div class="mb-2 flex h-34 w-auto items-center justify-center overflow-hidden">
          <img
            src="\src\assets\logos\img-ruas.png"
            alt="RUAS Management System Logo"
            class="h-full w-full object-contain" />
        </div>
      </div>

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="handleLogin">
        <!-- Email -->
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
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </span>
          <input
            v-model="email"
            type="email"
            required
            placeholder="Email"
            name="email"
            autocomplete="email"
            class="w-full rounded-sm border border-slate-200 py-2 pr-4 pl-12 text-slate-700 placeholder-slate-400 focus:border-transparent focus:ring-2 focus:ring-teal-500 focus:outline-none" />
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
            placeholder="Password"
            autocomplete="current-password"
            class="w-full rounded-sm border border-slate-200 py-2 pr-12 pl-12 text-slate-700 placeholder-slate-400 focus:border-transparent focus:ring-2 focus:ring-teal-500 focus:outline-none" />
          <button
            type="button"
            class="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="togglePassword">
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

        <!-- Forgot Password -->
        <div class="flex justify-end">
          <button
            type="button"
            class="text-sm font-medium text-[#119E92] transition-colors hover:text-[#0d7a70]"
            @click="openForgotModal">
            Forgot Password?
          </button>
        </div>

        <!-- Error Message -->
        <p v-if="errorMessage" class="text-center text-sm text-red-500">
          {{ errorMessage }}
        </p>

        <!-- Submit -->
        <div class="mt-2 flex justify-center">
          <button
            type="submit"
            :disabled="loading"
            class="mt-2 w-60 rounded-sm bg-[#14A89C] py-2 font-bold tracking-wide text-white uppercase transition-colors hover:bg-[#17BDAF] disabled:cursor-not-allowed disabled:opacity-60">
            {{ loading ? "Processing..." : "Login" }}
          </button>
        </div>
      </form>
    </div>

    <!-- Forgot Password Modal -->
    <Modal v-if="showForgotModal" title="Reset Password" @close="closeForgotModal">
      <!-- Confirmation step -->
      <div v-if="!forgotSent">
        <p class="mb-4 text-sm text-slate-600">
          We'll send a password reset link to the email address below. Please confirm before we send
          it.
        </p>

        <label
          class="mb-1 block text-xs font-medium tracking-wide text-slate-500 uppercase"
          for="forgot-email">
          Email
        </label>
        <input
          id="forgot-email"
          v-model="forgotEmail"
          type="email"
          required
          placeholder="you@example.com"
          class="w-full rounded-sm border border-slate-200 px-3 py-2 text-slate-700 placeholder-slate-400 focus:border-transparent focus:ring-2 focus:ring-teal-500 focus:outline-none" />

        <p v-if="forgotError" class="mt-2 text-sm text-red-500">
          {{ forgotError }}
        </p>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-sm px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            :disabled="forgotLoading"
            @click="closeForgotModal">
            Cancel
          </button>
          <button
            type="button"
            class="rounded-sm bg-[#14A89C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#17BDAF] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="forgotLoading"
            @click="confirmSendResetEmail">
            {{ forgotLoading ? "Sending..." : "Send Reset Link" }}
          </button>
        </div>
      </div>

      <!-- Success step -->
      <div v-else class="py-2 text-center">
        <div
          class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg
            class="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p class="text-sm text-slate-600">
          If an account exists for
          <span class="font-medium text-slate-800">{{ forgotEmail }}</span
          >, a password reset link has been sent.
        </p>
        <div class="mt-6 flex justify-center">
          <button
            type="button"
            class="rounded-sm bg-[#14A89C] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#17BDAF]"
            @click="closeForgotModal">
            Close
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>
