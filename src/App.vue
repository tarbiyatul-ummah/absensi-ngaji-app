<script setup lang="ts">
import { RouterView, RouterLink } from "vue-router";
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
        <!-- Hugeicon: Checklist / Task -->
        <svg
          class="w-5 h-5 mb-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
          />
        </svg>
        <span class="text-[11px] font-medium">Absen</span>
      </RouterLink>

      <RouterLink
        to="/master"
        class="flex flex-col items-center p-2 text-gray-400 hover:text-gray-900 active-link"
      >
        <!-- Hugeicon: Database / Folder -->
        <svg
          class="w-5 h-5 mb-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
          />
        </svg>
        <span class="text-[11px] font-medium">Data</span>
      </RouterLink>
      <RouterLink
        to="/dashboard"
        class="flex flex-col items-center p-2 text-gray-400 hover:text-gray-900 active-link"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span class="text-[11px] font-medium">Dashboard</span>
      </RouterLink>

      <RouterLink
        to="/export"
        class="flex flex-col items-center p-2 text-gray-400 hover:text-gray-900 active-link"
      >
        <!-- Hugeicon: Share / Message -->
        <svg
          class="w-5 h-5 mb-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
          />
        </svg>
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
