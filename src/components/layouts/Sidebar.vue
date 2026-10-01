<script setup>
import { useSidebar } from "@/composables/layouts/useSidebar";

defineProps({
  isOpen: {
    type: Boolean,
    default: true,
  },
});

const { menuItems, isGroupOpen, toggleGroup, isActive, isParentActive } =
  useSidebar();
</script>

<template>
  <aside
    data-app-sidebar
    class="flex flex-col h-screen shrink-0 bg-white border-r border-slate-200 overflow-hidden transition-all duration-200 fixed inset-y-0 left-0 z-40 lg:static"
    :class="
      isOpen
        ? 'w-60 translate-x-0'
        : 'w-60 -translate-x-full lg:w-0 lg:border-r-0'
    "
  >
    <!-- Wrapper lebar tetap agar konten tidak menyusut saat aside di-collapse (lg:w-0) -->
    <div class="flex flex-col w-60 h-full overflow-y-auto">
      <!-- Logo -->
      <div class="flex items-center gap-2 px-4 py-4">
        <img
          src="/src/assets/logos/logo-ruas.png"
          alt="RUAS Logo"
          class="w-auto h-16 rounded-md object-contain shrink-0"
        />
      </div>

      <!-- Menu -->
      <nav class="flex-1 px-3 pb-6">
        <ul class="flex flex-col gap-1">
          <li v-for="item in menuItems" :key="item.label">
            <template v-if="item.children">
              <button
                type="button"
                class="w-full flex items-center justify-between gap-2 px-3 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                :class="
                  isParentActive(item)
                    ? 'text-[#119E92]'
                    : 'text-slate-400 hover:text-slate-600'
                "
                @click="toggleGroup(item.label)"
              >
                <span>{{ item.label }}</span>
                <svg
                  class="w-3.5 h-3.5 transition-transform duration-300"
                  :class="isGroupOpen(item.label) ? 'rotate-180' : ''"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <div
                class="grid transition-[grid-template-rows] duration-300 ease-in-out"
                :style="{
                  gridTemplateRows: isGroupOpen(item.label) ? '1fr' : '0fr',
                }"
              >
                <ul class="flex flex-col gap-1 overflow-hidden">
                  <li v-for="child in item.children" :key="child.label">
                    <router-link
                      :to="child.to"
                      class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                      :class="
                        isActive(child.to)
                          ? 'text-[#119E92] bg-[#119E92]/10'
                          : 'text-slate-600 hover:bg-slate-100'
                      "
                    >
                      <span
                        class="w-5 h-5 shrink-0 [&_svg]:w-5 [&_svg]:h-5"
                        v-html="child.iconSvg"
                      />
                      {{ child.label }}
                    </router-link>
                  </li>
                </ul>
              </div>
            </template>

            <template v-else>
              <router-link
                :to="item.to"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                :class="
                  isActive(item.to)
                    ? 'text-[#119E92] bg-[#119E92]/10'
                    : 'text-slate-700 hover:bg-slate-100'
                "
              >
                <span
                  class="w-5 h-5 shrink-0 [&_svg]:w-5 [&_svg]:h-5"
                  v-html="item.iconSvg"
                />
                {{ item.label }}
              </router-link>
            </template>
          </li>
        </ul>
      </nav>
    </div>
  </aside>
</template>
