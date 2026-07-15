<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { signOut } from "firebase/auth";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  AccountSetting02Icon,
  Logout03Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "../services/firebase";
import {
  dashboardMenuItems,
  organizationConfig,
  terms,
} from "../config/organization";

const router = useRouter();
const activeFeatureItems = dashboardMenuItems.filter((item) => item.enabled);
const accountEmail = computed(
  () => auth.currentUser?.email ?? `Admin ${organizationConfig.typeLabel}`,
);

const handleLogout = async () => {
  await signOut(auth);
  router.push("/login");
};
</script>

<template>
  <div class="app-page">
    <div class="app-container space-y-4">
      <header class="app-header">
        <div>
          <h1 class="app-title">Akun</h1>
          <p class="app-subtitle">
            Kelola identitas organisasi, istilah aplikasi, dan sesi admin.
          </p>
        </div>
      </header>

      <Card class="gap-0 py-0">
        <CardHeader class="border-b py-4">
          <CardTitle>Pengaturan Organisasi</CardTitle>
          <CardDescription>
            Identitas lembaga, tampilan browser, dan bahasa aplikasi.
          </CardDescription>
        </CardHeader>

        <CardContent class="divide-y p-0">
          <section class="p-4">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Organisasi
            </p>
            <div class="flex items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
              >
                <HugeiconsIcon
                  :icon="AccountSetting02Icon"
                  :size="24"
                  color="currentColor"
                  :stroke-width="1.7"
                />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-medium text-muted-foreground">
                  {{ organizationConfig.typeLabel }}
                </p>
                <h2 class="truncate text-base font-bold text-foreground">
                  {{ organizationConfig.name }}
                </h2>
                <p class="mt-1 truncate text-[13px] text-muted-foreground">
                  Login sebagai {{ accountEmail }}
                </p>
              </div>
            </div>
          </section>

          <section class="p-4">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tampilan Web
            </p>
            <div class="flex items-center gap-3">
              <img
                :src="organizationConfig.faviconUrl"
                alt="Favicon aktif"
                class="h-12 w-12 rounded-lg border bg-muted object-contain p-1"
              />
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-foreground">
                  {{ organizationConfig.appTitle }}
                </p>
                <p class="text-xs text-muted-foreground">
                  Title dan favicon yang tampil di browser
                </p>
              </div>
            </div>
          </section>

          <section class="p-4">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Bahasa Aplikasi
            </p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div class="rounded-lg border p-3">
                <p class="text-xs text-muted-foreground">Peserta</p>
                <p class="text-sm font-semibold text-foreground">
                  {{ terms.studentSingularTitle }}
                </p>
              </div>
              <div class="rounded-lg border p-3">
                <p class="text-xs text-muted-foreground">Pengajar/Pembina</p>
                <p class="text-sm font-semibold text-foreground">
                  {{ terms.mentorSingularTitle }}
                </p>
              </div>
              <div class="rounded-lg border p-3">
                <p class="text-xs text-muted-foreground">Tingkatan</p>
                <p class="text-sm font-semibold text-foreground">
                  {{ terms.levelSingularTitle }}
                </p>
              </div>
            </div>
          </section>
        </CardContent>
        <CardFooter class="border-t p-4">
          <Button as-child class="w-full sm:w-auto">
            <RouterLink to="/akun/istilah">
              Edit Pengaturan
            </RouterLink>
          </Button>
        </CardFooter>
      </Card>

      <Card class="gap-0 py-0">
        <CardHeader class="border-b py-4">
          <CardTitle>Menu Aktif</CardTitle>
          <CardDescription>
            Fitur yang tersedia di dashboard organisasi saat ini.
          </CardDescription>
        </CardHeader>

        <div class="divide-y">
          <div
            v-for="item in activeFeatureItems"
            :key="item.key"
            class="flex items-center gap-3 px-4 py-3"
          >
            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
            >
              <HugeiconsIcon
                :icon="item.icon"
                :size="20"
                color="currentColor"
                :stroke-width="1.7"
              />
            </div>
            <div>
              <p class="text-sm font-medium text-foreground">
                {{ item.label }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ item.description }}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card class="gap-0 py-0">
        <CardHeader class="border-b py-4">
          <CardTitle>Sesi</CardTitle>
          <CardDescription>
            Keluar dari perangkat ini saat selesai mengelola data.
          </CardDescription>
        </CardHeader>
        <CardContent class="p-4">
          <Button
            type="button"
            variant="outline"
            class="w-full justify-center"
            @click="handleLogout"
          >
            <HugeiconsIcon
              :icon="Logout03Icon"
              :size="18"
              color="currentColor"
              :stroke-width="1.7"
            />
            Keluar
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
