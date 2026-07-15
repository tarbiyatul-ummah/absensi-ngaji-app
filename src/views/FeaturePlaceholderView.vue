<script setup lang="ts">
import { RouterLink } from "vue-router";
import { HugeiconsIcon } from "@hugeicons/vue";
import { ArrowLeft02Icon, BookOpenCheckIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { organizationConfig } from "../config/organization";

defineProps<{
  title: string;
  description: string;
}>();
</script>

<template>
  <div class="app-page">
    <div class="app-container space-y-4">
      <Button as-child variant="ghost" size="sm" class="w-fit px-2">
        <RouterLink to="/dashboard">
          <HugeiconsIcon
            :icon="ArrowLeft02Icon"
            :size="16"
            color="currentColor"
            :stroke-width="1.7"
          />
          Dashboard
        </RouterLink>
      </Button>

      <Card>
        <CardContent class="p-5">
        <div
          class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
        >
          <HugeiconsIcon
            :icon="BookOpenCheckIcon"
            :size="26"
            color="currentColor"
            :stroke-width="1.7"
          />
        </div>

        <h1 class="app-title">{{ title }}</h1>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          {{ description }}
        </p>

        <div
          class="mt-5 rounded-lg border border-dashed bg-muted p-4"
        >
          <p class="text-[13px] font-medium text-foreground">
            Fitur ini sudah masuk konfigurasi menu.
          </p>
          <p class="mt-1 text-xs leading-5 text-muted-foreground">
            Detail alur, data, dan hak akses bisa dikembangkan sesuai kebutuhan
            tiap {{ organizationConfig.typeLabel }}.
          </p>
        </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
