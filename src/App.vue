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
  "/penilaian",
  "/akun/istilah",
]);
const bottomNavHiddenPrefixes = ["/tabungan", "/penilaian/"];
const shouldShowBottomNav = computed(
  () =>
    !bottomNavHiddenPaths.has(route.path) &&
    !bottomNavHiddenPrefixes.some((path) => route.path.startsWith(path)),
);
</script>

<template>
  <div class="min-h-screen text-foreground">
    <RouterView />

    <nav
      v-if="shouldShowBottomNav"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-4 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_24px_hsl(222.2_84%_4.9%/0.08)]"
    >
      <div class="mx-auto grid max-w-md grid-cols-4">
        <RouterLink
          v-for="item in enabledNavigationItems"
          :key="item.key"
          :to="item.to"
          class="active-link flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-md px-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <span class="nav-icon flex h-8 w-8 items-center justify-center rounded-full transition-colors">
            <HugeiconsIcon
              :icon="item.icon"
              :size="22"
              color="currentColor"
              :stroke-width="1.8"
            />
          </span>
          <span class="max-w-full truncate text-xs font-medium leading-none">
            {{ item.label }}
          </span>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>

<style>
.router-link-active.active-link {
  color: var(--foreground);
}

</style>
