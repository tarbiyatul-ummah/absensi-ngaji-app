<script setup lang="ts">
import { RouterView, RouterLink } from "vue-router";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  CheckListIcon,
  DashboardSquare01Icon,
  DatabaseIcon,
  Share08Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-800 pb-20">
    <RouterView />

    <!-- Mobile Bottom Navigation -->
    <!-- Sisipkan di bagian bawah template App.vue -->
    <nav
      v-if="$route.path !== '/login'"
      class="fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-[#EAEAEA] flex justify-around p-2 pb-safe"
    >
      <RouterLink
        to="/"
        class="flex flex-col items-center p-2 text-gray-400 hover:text-gray-900 active-link"
      >
        <HugeiconsIcon
          :icon="CheckListIcon"
          :size="20"
          color="currentColor"
          :stroke-width="1.7"
          class="mb-1"
        />
        <span class="text-[11px] font-medium">Absen</span>
      </RouterLink>

      <RouterLink
        to="/master"
        class="flex flex-col items-center p-2 text-gray-400 hover:text-gray-900 active-link"
      >
        <HugeiconsIcon
          :icon="DatabaseIcon"
          :size="20"
          color="currentColor"
          :stroke-width="1.7"
          class="mb-1"
        />
        <span class="text-[11px] font-medium">Data</span>
      </RouterLink>
      <RouterLink
        to="/dashboard"
        class="flex flex-col items-center p-2 text-gray-400 hover:text-gray-900 active-link"
      >
        <HugeiconsIcon
          :icon="DashboardSquare01Icon"
          :size="21"
          color="currentColor"
          :stroke-width="1.7"
          class="mb-1"
        />
        <span class="text-[11px] font-medium">Dashboard</span>
      </RouterLink>

      <RouterLink
        to="/keuangan"
        class="flex flex-col items-center p-2 text-gray-400 hover:text-gray-900 active-link"
      >
        <HugeiconsIcon
          :icon="Wallet01Icon"
          :size="20"
          color="currentColor"
          :stroke-width="1.7"
          class="mb-1"
        />
        <span class="text-[11px] font-medium">SPP</span>
      </RouterLink>

      <RouterLink
        to="/export"
        class="flex flex-col items-center p-2 text-gray-400 hover:text-gray-900 active-link"
      >
        <HugeiconsIcon
          :icon="Share08Icon"
          :size="20"
          color="currentColor"
          :stroke-width="1.7"
          class="mb-1"
        />
        <span class="text-[11px] font-medium">Rekap</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style>
/* Update warna aktif navigasi ala Linear (Hitam/Gelap) */
.router-link-active.active-link {
  color: #111827;
}
</style>
