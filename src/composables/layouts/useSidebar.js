import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";

/**
 * Composable untuk logic Sidebar.
 * Menangani: data menu, active state, dan toggle submenu (Control & Admin).
 *
 * iconSvg menyimpan markup <svg>...</svg> lengkap (bukan cuma path 'd'),
 * karena beberapa icon punya multi-path/rect/polyline. Dirender via v-html
 * di Sidebar.vue, dibungkus <span class="w-5 h-5"> supaya ukurannya
 * mengikuti Tailwind (v-html tidak menerapkan class pada svg dari luar).
 */
export function useSidebar() {
  const route = useRoute();

  const menuItems = ref([
    {
      label: "Dashboard",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>',
      to: "/dashboard",
    },
    {
      label: "Purchase Order",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M6 3H14L19 8V21H6C4.89543 21 4 20.1046 4 19V5C4 3.89543 4.89543 3 6 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M14 3V8H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 12H16M8 16H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>',
      to: "/po",
    },
    {
      label: "Report",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M21 21H6.2C5.07989 21 4.51984 21 4.09202 20.782C3.71569 20.5903 3.40973 20.2843 3.21799 19.908C3 19.4802 3 18.9201 3 17.8V3M7 15L12 9L16 13L21 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
      to: "/report",
    },
    {
      label: "Client List",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M3 21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19 21V15V7C19 5.11438 19 4.17157 18.4142 3.58579C17.8284 3 16.8856 3 15 3H12H9C7.11438 3 6.17157 3 5.58579 3.58579C5 4.17157 5 5.11438 5 7V15V21" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path><path d="M9 8L10 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9 12L10 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9 16L10 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M14 8L15 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M14 12L15 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M14 16L15 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
      to: "/client",
    },
    {
      label: "Region List",
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" transform="matrix(-1, 0, 0, 1, 0, 0)"><path d="M9 20L3 17V4L9 7M9 20L15 17M9 20V7M15 17L21 20V7L15 4M15 17V4M9 7L15 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
      to: "/region",
    },
    {
      label: "Payment Request",
      children: [
        {
          label: "Overview",
          iconSvg:
            '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Huge Icons by Hugeicons - undefined --><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="m8.643 3.146l-1.705.788C4.313 5.147 3 5.754 3 6.75s1.313 1.603 3.938 2.816l1.705.788c1.652.764 2.478 1.146 3.357 1.146s1.705-.382 3.357-1.146l1.705-.788C19.687 8.353 21 7.746 21 6.75s-1.313-1.603-3.938-2.816l-1.705-.788C13.705 2.382 12.879 2 12 2s-1.705.382-3.357 1.146"/><path d="M20.788 11.097c.141.199.212.406.212.634c0 .982-1.313 1.58-3.938 2.776l-1.705.777c-1.652.753-2.478 1.13-3.357 1.13s-1.705-.377-3.357-1.13l-1.705-.777C4.313 13.311 3 12.713 3 11.731c0-.228.07-.435.212-.634"/><path d="M20.377 16.266c.415.331.623.661.623 1.052c0 .981-1.313 1.58-3.938 2.776l-1.705.777C13.705 21.624 12.879 22 12 22s-1.705-.376-3.357-1.13l-1.705-.776C4.313 18.898 3 18.299 3 17.318c0-.391.208-.72.623-1.052"/></g></svg>',
          to: "/payment-request/overview",
        },
        {
          label: "Report",
          iconSvg:
            '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Huge Icons by Hugeicons - undefined --><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="M7 7c.629-1.122 1.481-2 2.793-2c5.547 0 2.43 12 8.39 12c1.321 0 2.169-.884 2.817-2"/><path d="M21 21H10c-3.3 0-4.95 0-5.975-1.025S3 17.3 3 14V3"/></g></svg>',
          to: "/payment-request/report",
        },
      ],
    },
    {
      label: "Control",
      children: [
        {
          label: "Unit",
          iconSvg:
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
          to: "/control/unit",
        },
        {
          label: "PPN",
          iconSvg:
            '<svg viewBox="0 0 24 24" fill="none"><path d="M17 13H21V19C21 20.1046 20.1046 21 19 21M17 13V19C17 20.1046 17.8954 21 19 21M17 13V5.75707C17 4.85168 17 4.39898 16.8098 4.13646C16.6439 3.90746 16.3888 3.75941 16.1076 3.72897C15.7853 3.69408 15.3923 3.91868 14.6062 4.36788L14.2938 4.54637C14.0045 4.7117 13.8598 4.79438 13.7062 4.82675C13.5702 4.85539 13.4298 4.85539 13.2938 4.82675C13.1402 4.79438 12.9955 4.7117 12.7062 4.54637L10.7938 3.45359C10.5045 3.28826 10.3598 3.20559 10.2062 3.17322C10.0702 3.14457 9.92978 3.14457 9.79383 3.17322C9.64019 3.20559 9.49552 3.28826 9.20618 3.4536L7.29382 4.54637C7.00448 4.71171 6.85981 4.79438 6.70617 4.82675C6.57022 4.85539 6.42978 4.85539 6.29383 4.82675C6.14019 4.79438 5.99552 4.71171 5.70618 4.54637L5.39382 4.36788C4.60772 3.91868 4.21467 3.69408 3.89237 3.72897C3.61123 3.75941 3.35611 3.90746 3.1902 4.13646C3 4.39898 3 4.85168 3 5.75707V16.2C3 17.8801 3 18.7202 3.32698 19.362C3.6146 19.9264 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H19M12 10.5C11.5 10.376 10.6851 10.3714 10 10.376C9.77091 10.3775 9.90941 10.3678 9.6 10.376C8.79258 10.4012 8.00165 10.7368 8 11.6875C7.99825 12.7003 9 13 10 13C11 13 12 13.2312 12 14.3125C12 15.1251 11.1925 15.4812 10.1861 15.5991C9.3861 15.5991 9 15.625 8 15.5M10 16V17M10 8.99998V9.99998" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
          to: "/control/ppn",
        },
      ],
    },
    {
      label: "Admin",
      children: [
        {
          label: "Admin List",
          iconSvg:
            '<svg viewBox="0 0 24 24" fill="none"><path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
          to: "/admin/list",
        },
        {
          label: "Role",
          iconSvg:
            '<svg viewBox="0 0 24 24" fill="none"><path d="M11.3586 20.6831C11.5639 20.7901 11.6666 20.8436 11.809 20.8713C11.92 20.8929 12.08 20.8929 12.191 20.8713C12.3334 20.8436 12.4361 20.7901 12.6414 20.6831C14.54 19.6939 20 16.4612 20 12.0001V8.21772C20 7.4182 20 7.01845 19.8692 6.67482C19.7537 6.37126 19.566 6.10039 19.3223 5.88564C19.0465 5.64255 18.6722 5.50219 17.9236 5.22146L12.5618 3.21079C12.3539 3.13283 12.25 3.09385 12.143 3.07839C12.0482 3.06469 11.9518 3.06469 11.857 3.07839C11.75 3.09385 11.6461 3.13283 11.4382 3.21079L6.0764 5.22146C5.3278 5.50219 4.9535 5.64255 4.67766 5.88564C4.43398 6.10039 4.24627 6.37126 4.13076 6.67482C4 7.01845 4 7.4182 4 8.21772V12.0001C4 16.4612 9.45996 19.6939 11.3586 20.6831Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
          to: "/admin/roles",
        },
        {
          label: "Division",
          iconSvg:
            '<svg viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M11 4C10.4477 4 10 4.44772 10 5V6H14V5C14 4.44772 13.5523 4 13 4H11ZM16 6V5C16 3.34315 14.6569 2 13 2H11C9.34315 2 8 3.34315 8 5V6H4C2.89543 6 2 6.89543 2 8V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V8C22 6.89543 21.1046 6 20 6H16ZM9 8H4V19H20V8H15H9Z" fill="currentColor"></path></svg>',
          to: "/admin/divisions",
        },
        {
          label: "Role Access",
          iconSvg:
            '<svg viewBox="0 0 24 24" fill="none"><path d="M17 8.99994C17 8.48812 16.8047 7.9763 16.4142 7.58579C16.0237 7.19526 15.5118 7 15 7M15 15C18.3137 15 21 12.3137 21 9C21 5.68629 18.3137 3 15 3C11.6863 3 9 5.68629 9 9C9 9.27368 9.01832 9.54308 9.05381 9.80704C9.11218 10.2412 9.14136 10.4583 9.12172 10.5956C9.10125 10.7387 9.0752 10.8157 9.00469 10.9419C8.937 11.063 8.81771 11.1823 8.57913 11.4209L3.46863 16.5314C3.29568 16.7043 3.2092 16.7908 3.14736 16.8917C3.09253 16.9812 3.05213 17.0787 3.02763 17.1808C3 17.2959 3 17.4182 3 17.6627V19.4C3 19.9601 3 20.2401 3.10899 20.454C3.20487 20.6422 3.35785 20.7951 3.54601 20.891C3.75992 21 4.03995 21 4.6 21H7V19H9V17H11L12.5791 15.4209C12.8177 15.1823 12.937 15.063 13.0581 14.9953C13.1843 14.9248 13.2613 14.8987 13.4044 14.8783C13.5417 14.8586 13.7588 14.8878 14.193 14.9462C14.4569 14.9817 14.7263 15 15 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
          to: "/admin/access",
        },
      ],
    },
  ]);

  const isActive = (to) => {
    if (!to) return false;
    return route.path === to;
  };

  const isParentActive = (item) => {
    if (!item.children) return isActive(item.to);
    return item.children.some((child) => isActive(child.to));
  };

  const openGroups = ref(
    menuItems.value
      .filter((item) => item.children && isParentActive(item))
      .map((item) => item.label),
  );

  const toggleGroup = (label) => {
    const index = openGroups.value.indexOf(label);
    if (index === -1) {
      openGroups.value.push(label);
    } else {
      openGroups.value.splice(index, 1);
    }
  };

  const isGroupOpen = (label) => openGroups.value.includes(label);

  watch(
    () => route.path,
    () => {
      menuItems.value.forEach((item) => {
        if (item.children && isParentActive(item) && !isGroupOpen(item.label)) {
          openGroups.value.push(item.label);
        }
      });
    },
  );

  const activeLabel = computed(() => {
    const found = menuItems.value.find((item) => isParentActive(item));
    return found?.label ?? null;
  });

  return {
    menuItems,
    openGroups,
    toggleGroup,
    isGroupOpen,
    isActive,
    isParentActive,
    activeLabel,
  };
}
