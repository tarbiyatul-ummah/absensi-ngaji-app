<script setup lang="ts">
import { computed } from "vue";
import { RouterView, RouterLink, useRoute } from "vue-router";
import { HugeiconsIcon } from "@hugeicons/vue";
import { mainNavigationItems } from "./config/organization";

const enabledNavigationItems = mainNavigationItems.filter((item) => item.enabled);
const route = useRoute();
const bottomNavHiddenPaths = new Set([
  "/login",
  "/keuangan",
  "/tabungan",
  "/penilaian",
  "/akun/istilah",
]);
const shouldShowBottomNav = computed(
  () => !bottomNavHiddenPaths.has(route.path),
);
</script>

<template>
  <div class="min-h-screen text-foreground">
    <RouterView />

    <nav
      v-if="shouldShowBottomNav"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 px-3 py-2 shadow-[0_-10px_40px_hsl(222.2_84%_4.9%/0.06)] backdrop-blur-xl"
    >
      <div class="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-xl bg-muted p-1">
        <RouterLink
          v-for="item in enabledNavigationItems"
          :key="item.key"
          :to="item.to"
          class="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-2 text-muted-foreground transition-colors hover:text-foreground active-link"
        >
          <HugeiconsIcon
            :icon="item.icon"
            :size="19"
            color="currentColor"
            :stroke-width="1.8"
          />
          <span class="max-w-full truncate text-[11px] font-semibold">
            {{ item.label }}
          </span>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>

<style>
.router-link-active.active-link {
  background: var(--background);
  color: var(--foreground);
  box-shadow: 0 1px 2px hsl(222.2 84% 4.9% / 0.08);
}
</style>
