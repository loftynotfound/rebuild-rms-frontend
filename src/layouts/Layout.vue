<script setup>
import { useLayout } from "@/composables/layouts/useLayout.js";
import Sidebar from "@/components/layouts/Sidebar.vue";
import Header from "@/components/layouts/Header.vue";
import Modal from "@/components/ui/Modal.vue";

const {
  sidebarOpen,
  currentUser,
  toggleSidebar,
  profileMenuOpen,
  toggleProfileMenu,
  closeProfileMenu,
  goToProfile,
  showLogoutConfirm,
  loggingOut,
  confirmLogout,
  cancelLogout,
  handleLogout,
} = useLayout();
</script>

<template>
  <div class="flex h-screen w-full overflow-x-hidden">
    <Sidebar :is-open="sidebarOpen" />

    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
      @click="toggleSidebar"
    />

    <div class="flex flex-col flex-1 h-screen overflow-hidden">
      <Header
        :current-user="currentUser"
        :profile-menu-open="profileMenuOpen"
        @toggle-sidebar="toggleSidebar"
        @toggle-profile-menu="toggleProfileMenu"
        @close-profile-menu="closeProfileMenu"
        @go-to-profile="goToProfile"
        @logout="confirmLogout"
      />

      <main class="flex-1 overflow-y-auto">
        <div class="p-6 bg-gray-50 min-h-full">
          <router-view :user="currentUser" />
        </div>
      </main>
    </div>

    <Modal
      v-if="showLogoutConfirm"
      title="Logout Confirmation"
      @close="cancelLogout"
    >
      <p class="text-sm text-slate-600">
        Are you sure you want to log out of this account?
      </p>

      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          class="w-full sm:w-auto rounded-sm border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          :disabled="loggingOut"
          @click="cancelLogout"
        >
          Cancel
        </button>
        <button
          type="button"
          class="w-full sm:w-auto rounded-sm bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          :disabled="loggingOut"
          @click="handleLogout"
        >
          {{ loggingOut ? "Processing..." : "Logout" }}
        </button>
      </div>
    </Modal>
  </div>
</template>
