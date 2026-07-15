<script setup lang="ts">
import { reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import { HugeiconsIcon } from "@hugeicons/vue";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_FAVICON_URL,
  organizationConfig,
  resetOrganizationConfig,
  saveOrganizationConfig,
  terms,
} from "../config/organization";

const showSavedMessage = ref(false);
const uploadError = ref("");
const editableConfig = reactive({
  name: organizationConfig.name,
  typeLabel: organizationConfig.typeLabel,
  appTitle: organizationConfig.appTitle,
  faviconUrl: organizationConfig.faviconUrl,
  studentSingularTitle: terms.studentSingularTitle,
  mentorSingularTitle: terms.mentorSingularTitle,
  levelSingularTitle: terms.levelSingularTitle,
  paymentLabel: terms.paymentLabel,
});

const normalizeLower = (value: string) => value.trim().toLowerCase();
const normalizeTitle = (value: string) => value.trim();

const syncEditableConfig = () => {
  editableConfig.name = organizationConfig.name;
  editableConfig.typeLabel = organizationConfig.typeLabel;
  editableConfig.appTitle = organizationConfig.appTitle;
  editableConfig.faviconUrl = organizationConfig.faviconUrl;
  editableConfig.studentSingularTitle = terms.studentSingularTitle;
  editableConfig.mentorSingularTitle = terms.mentorSingularTitle;
  editableConfig.levelSingularTitle = terms.levelSingularTitle;
  editableConfig.paymentLabel = terms.paymentLabel;
};

const showSavedState = () => {
  showSavedMessage.value = true;
  window.setTimeout(() => {
    showSavedMessage.value = false;
  }, 2200);
};

const handleFaviconUpload = (event: Event) => {
  uploadError.value = "";
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    uploadError.value = "File favicon harus berupa gambar.";
    input.value = "";
    return;
  }

  if (file.size > 256 * 1024) {
    uploadError.value = "Ukuran favicon maksimal 256 KB.";
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    editableConfig.faviconUrl = String(reader.result);
  };
  reader.onerror = () => {
    uploadError.value = "Favicon gagal dibaca.";
  };
  reader.readAsDataURL(file);
};

const resetFavicon = () => {
  uploadError.value = "";
  editableConfig.faviconUrl = DEFAULT_FAVICON_URL;
};

const handleSaveSettings = () => {
  const studentSingularTitle = normalizeTitle(
    editableConfig.studentSingularTitle,
  );
  const mentorSingularTitle = normalizeTitle(editableConfig.mentorSingularTitle);
  const levelSingularTitle = normalizeTitle(editableConfig.levelSingularTitle);

  saveOrganizationConfig({
    name: normalizeTitle(editableConfig.name),
    typeLabel: normalizeTitle(editableConfig.typeLabel),
    appTitle:
      normalizeTitle(editableConfig.appTitle) || organizationConfig.appTitle,
    faviconUrl: editableConfig.faviconUrl || DEFAULT_FAVICON_URL,
    terms: {
      studentSingularTitle,
      studentSingularLower: normalizeLower(studentSingularTitle),
      mentorSingularTitle,
      mentorSingularLower: normalizeLower(mentorSingularTitle),
      levelSingularTitle,
      levelSingularLower: normalizeLower(levelSingularTitle),
      paymentLabel: normalizeTitle(editableConfig.paymentLabel),
    },
  });

  syncEditableConfig();
  showSavedState();
};

const handleResetSettings = () => {
  resetOrganizationConfig();
  syncEditableConfig();
  uploadError.value = "";
  showSavedState();
};
</script>

<template>
  <div class="app-page">
    <div class="app-container space-y-4">
      <Button as-child variant="ghost" size="sm" class="w-fit px-2">
        <RouterLink to="/akun">
          <HugeiconsIcon
            :icon="ArrowLeft02Icon"
            :size="16"
            color="currentColor"
            :stroke-width="1.7"
          />
          Akun
        </RouterLink>
      </Button>

      <header class="app-header">
        <div>
          <h1 class="app-title">Edit Pengaturan</h1>
          <p class="app-subtitle">
            Atur identitas organisasi, tampilan browser, dan istilah yang dipakai di aplikasi.
          </p>
        </div>
      </header>

      <form class="space-y-4" @submit.prevent="handleSaveSettings">
        <Alert
          v-if="showSavedMessage"
          class="border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          Pengaturan berhasil disimpan.
        </Alert>
        <Alert v-if="uploadError" variant="destructive">
          {{ uploadError }}
        </Alert>

        <Card class="gap-0 py-0">
          <CardHeader class="border-b py-4">
            <CardTitle>Pengaturan Organisasi</CardTitle>
            <CardDescription>
              Semua pengaturan ini masih dalam satu identitas aplikasi.
            </CardDescription>
          </CardHeader>

          <CardContent class="divide-y p-0">
            <section class="space-y-3 p-4">
              <div>
                <h2 class="text-sm font-semibold text-foreground">Organisasi</h2>
                <p class="text-xs text-muted-foreground">
                  Nama dan jenis lembaga yang menjadi konteks aplikasi.
                </p>
              </div>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Nama Organisasi</Label>
                  <Input
                    v-model="editableConfig.name"
                    type="text"
                    placeholder="Contoh: LPQ Tarbiyatul Ummah"
                  />
                </div>
                <div>
                  <Label>Label Organisasi</Label>
                  <Input
                    v-model="editableConfig.typeLabel"
                    type="text"
                    placeholder="Contoh: LPQ, Perguruan Silat"
                  />
                </div>
              </div>
            </section>

            <section class="space-y-3 p-4">
              <div>
                <h2 class="text-sm font-semibold text-foreground">Tampilan Web</h2>
                <p class="text-xs text-muted-foreground">
                  Mengubah title tab browser dan favicon aplikasi di perangkat ini.
                </p>
              </div>
              <div>
                <Label>Title Web</Label>
                <Input
                  v-model="editableConfig.appTitle"
                  type="text"
                  placeholder="Contoh: Absensi Organisasi Saya"
                />
                <p class="mt-1 text-xs text-muted-foreground">
                  Title ini tampil di tab browser dan hasil bookmark.
                </p>
              </div>

              <div class="rounded-lg border p-4">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex items-center gap-3">
                    <img
                      :src="editableConfig.faviconUrl || DEFAULT_FAVICON_URL"
                      alt="Preview favicon"
                      class="h-12 w-12 rounded-lg border bg-muted object-contain p-1"
                    />
                    <div>
                      <p class="text-sm font-semibold text-foreground">Favicon</p>
                      <p class="text-xs text-muted-foreground">
                        Pakai gambar persegi, maksimal 256 KB.
                      </p>
                    </div>
                  </div>

                  <div class="flex flex-col gap-2 sm:min-w-64">
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
                      @change="handleFaviconUpload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      @click="resetFavicon"
                    >
                      Pakai Placeholder
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <section class="space-y-3 p-4">
              <div>
                <h2 class="text-sm font-semibold text-foreground">Bahasa Aplikasi</h2>
                <p class="text-xs text-muted-foreground">
                  Sesuaikan sebutan yang muncul di menu, absensi, keuangan, dan rekap.
                </p>
              </div>
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Sebutan Peserta</Label>
                  <Input
                    v-model="editableConfig.studentSingularTitle"
                    type="text"
                    placeholder="Contoh: Santri, Siswa, Murid"
                  />
                </div>
                <div>
                  <Label>Sebutan Pengajar/Pembina</Label>
                  <Input
                    v-model="editableConfig.mentorSingularTitle"
                    type="text"
                    placeholder="Contoh: Guru, Pelatih, Pembina"
                  />
                </div>
                <div>
                  <Label>Sebutan Tingkatan</Label>
                  <Input
                    v-model="editableConfig.levelSingularTitle"
                    type="text"
                    placeholder="Contoh: Jilid, Kelas, Sabuk"
                  />
                </div>
                <div>
                  <Label>Label Pembayaran</Label>
                  <Input
                    v-model="editableConfig.paymentLabel"
                    type="text"
                    placeholder="Contoh: SPP, Iuran"
                  />
                </div>
              </div>
            </section>
          </CardContent>

          <CardFooter class="flex flex-col-reverse gap-2 border-t bg-muted/30 p-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              class="w-full sm:w-auto"
              @click="handleResetSettings"
            >
              Kembalikan Default
            </Button>
            <Button type="submit" class="w-full sm:w-auto">
              Simpan Pengaturan
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  </div>
</template>
