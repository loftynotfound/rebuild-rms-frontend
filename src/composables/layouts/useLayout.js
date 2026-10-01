import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

// Breakpoint 'lg' Tailwind. Di atas ini dianggap desktop.
const DESKTOP_BREAKPOINT = 1024;

export function useLayout() {
  const router = useRouter();
  const authStore = useAuthStore();
  const { admin: currentUser } = storeToRefs(authStore);

  // Default: terbuka di desktop, tertutup di mobile.
  const sidebarOpen = ref(window.innerWidth >= DESKTOP_BREAKPOINT);

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value;
  };

  // Dropdown profil di Header (nama user → menu Profil / Logout).
  const profileMenuOpen = ref(false);

  const toggleProfileMenu = () => {
    profileMenuOpen.value = !profileMenuOpen.value;
  };

  const closeProfileMenu = () => {
    profileMenuOpen.value = false;
  };

  const goToProfile = () => {
    closeProfileMenu();
    router.push("/profile");
  };

  // Modal konfirmasi logout.
  const showLogoutConfirm = ref(false);
  const loggingOut = ref(false);

  const confirmLogout = () => {
    closeProfileMenu();
    showLogoutConfirm.value = true;
  };

  const cancelLogout = () => {
    showLogoutConfirm.value = false;
  };

  const handleLogout = async () => {
    loggingOut.value = true;
    try {
      await authStore.logout();
      router.push("/login");
    } finally {
      loggingOut.value = false;
      showLogoutConfirm.value = false;
    }
  };

  return {
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
  };
}
