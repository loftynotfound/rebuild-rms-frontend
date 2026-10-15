<script setup>
import { useSidebar } from "@/composables/layouts/useSidebar";

defineProps({
  isOpen: {
    type: Boolean,
    default: true,
  },
});

const { menuItems, isGroupOpen, toggleGroup, isActive, isParentActive } = useSidebar();
</script>

<template>
  <aside
    data-app-sidebar
    class="fixed inset-y-0 left-0 z-40 flex h-screen shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white transition-all duration-200 lg:static"
    :class="isOpen ? 'w-60 translate-x-0' : 'w-60 -translate-x-full lg:w-0 lg:border-r-0'">
    <!-- Wrapper lebar tetap agar konten tidak menyusut saat aside di-collapse (lg:w-0) -->
    <div class="flex h-full w-60 flex-col overflow-y-auto">
      <!-- Logo -->
      <div class="flex items-center gap-2 px-4 py-4">
        <img
          src="/src/assets/logos/logo-ruas.png"
          alt="RUAS Logo"
          class="h-16 w-auto shrink-0 rounded-md object-contain" />
      </div>

      <!-- Menu -->
      <nav class="flex-1 px-3 pb-6">
        <ul class="flex flex-col gap-1">
          <li v-for="item in menuItems" :key="item.label">
            <template v-if="item.children">
              <button
                type="button"
                class="flex w-full cursor-pointer items-center justify-between gap-2 px-3 pt-4 pb-1.5 text-[11px] font-semibold tracking-wider uppercase transition-colors"
                :class="
                  isParentActive(item) ? 'text-[#119E92]' : 'text-slate-400 hover:text-slate-600'
                "
                @click="toggleGroup(item.label)">
                <span>{{ item.label }}</span>
                <svg
                  class="h-3.5 w-3.5 transition-transform duration-300"
                  :class="isGroupOpen(item.label) ? 'rotate-180' : ''"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                class="grid transition-[grid-template-rows] duration-300 ease-in-out"
                :style="{
                  gridTemplateRows: isGroupOpen(item.label) ? '1fr' : '0fr',
                }">
                <ul class="flex flex-col gap-1 overflow-hidden">
                  <li v-for="child in item.children" :key="child.label">
                    <router-link
                      :to="child.to"
                      class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
                      :class="
                        isActive(child.to)
                          ? 'bg-[#119E92]/10 text-[#119E92]'
                          : 'text-slate-600 hover:bg-slate-100'
                      ">
                      <span
                        class="h-5 w-5 shrink-0 [&_svg]:h-5 [&_svg]:w-5"
                        v-html="child.iconSvg" />
                      {{ child.label }}
                    </router-link>
                  </li>
                </ul>
              </div>
            </template>

            <template v-else>
              <router-link
                :to="item.to"
                class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
                :class="
                  isActive(item.to)
                    ? 'bg-[#119E92]/10 text-[#119E92]'
                    : 'text-slate-700 hover:bg-slate-100'
                ">
                <span class="h-5 w-5 shrink-0 [&_svg]:h-5 [&_svg]:w-5" v-html="item.iconSvg" />
                {{ item.label }}
              </router-link>
            </template>
          </li>
        </ul>
      </nav>
    </div>
  </aside>
</template>
