<script setup>
defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
  profileMenuOpen: {
    type: Boolean,
    default: false,
  },
});

defineEmits([
  "toggle-sidebar",
  "toggle-profile-menu",
  "close-profile-menu",
  "go-to-profile",
  "logout",
]);
</script>

<template>
  <header
    class="flex items-center justify-between px-6 h-14 bg-white border-b border-slate-200"
  >
    <button
      type="button"
      class="rounded-lg text-[#119E92] hover:text-[#0d7a70] transition-colors cursor-pointer"
      aria-label="Toggle sidebar"
      @click="$emit('toggle-sidebar')"
    >
      <svg
        class="w-6 h-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>

    <div class="relative">
      <button
        type="button"
        class="relative text-sm font-semibold tracking-wide text-slate-700 hover:text-[#119E92] transition-colors duration-200 cursor-pointer after:absolute after:left-0 after:-bottom-1 after:h-[1.5px] after:w-0 after:bg-[#119E92] after:transition-all after:duration-200 hover:after:w-full"
        @click="$emit('toggle-profile-menu')"
      >
        {{ currentUser?.admin_email ?? currentUser?.email }}
      </button>

      <!-- Backdrop transparan untuk menutup dropdown saat klik di luar -->
      <div
        v-if="profileMenuOpen"
        class="fixed inset-0 z-40"
        @click="$emit('close-profile-menu')"
      />

      <div
        v-if="profileMenuOpen"
        class="absolute right-0 top-full mt-2 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg z-50"
      >
        <button
          type="button"
          class="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer"
          @click="$emit('go-to-profile')"
        >
          <svg
            class="w-4 h-4 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Profil
        </button>
        <button
          type="button"
          class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
          @click="$emit('logout')"
        >
          <svg
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </div>
    </div>
  </header>
</template>
