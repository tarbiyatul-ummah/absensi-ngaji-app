<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { Santri, Jilid, Attendance, AttendanceStatus } from "../../types";
import { terms } from "../../config/organization";

const props = defineProps<{
  filteredSantri: Santri[];
  jilidList: Jilid[];
  attendanceData: Attendance[];
  savingSantriIds?: Set<string>;
}>();

const emit = defineEmits<{
  (e: "status-change", santri: Santri, status: AttendanceStatus): void;
}>();

const getAttendanceStatus = (santriId: string): AttendanceStatus => {
  const record = props.attendanceData.find((a) => a.santriId === santriId);
  if (!record) return "absent";
  if (record.status) return record.status;
  return record.isPresent ? "present" : "absent";
};

const isSaving = (santriId: string) => {
  return props.savingSantriIds?.has(santriId) ?? false;
};

const getButtonClass = (santriId: string, status: AttendanceStatus) => {
  const activeStatus = getAttendanceStatus(santriId);
  const isActive = activeStatus === status;

  if (status === "present") {
    return isActive
      ? "border-[hsl(142_42%_82%)] bg-[hsl(142_76%_94%)] text-[hsl(142_72%_29%)]"
      : "border-border bg-background text-foreground hover:bg-accent";
  }

  return isActive
    ? "border-[hsl(48_76%_78%)] bg-[hsl(48_96%_89%)] text-[hsl(32_95%_35%)]"
    : "border-border bg-background text-foreground hover:bg-accent";
};
</script>

<template>
  <Card class="gap-0 py-0">
    <CardHeader class="flex-row items-center justify-between border-b py-4">
      <CardTitle>Daftar Kehadiran</CardTitle>
      <span class="text-xs font-medium text-muted-foreground"
        >{{ filteredSantri.length }} {{ terms.studentSingularTitle }}</span
      >
    </CardHeader>

    <div class="divide-y">
      <div
        v-for="santri in filteredSantri"
        :key="santri.id"
        class="flex flex-col gap-3 p-4 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex flex-col">
          <span class="text-sm font-medium text-foreground">{{
            santri.nama
          }}</span>
          <span class="text-xs text-muted-foreground">
            {{ jilidList.find((j) => j.id === santri.jilidId)?.nama || "N/A" }}
          </span>
        </div>

        <div
          class="grid grid-cols-2 gap-2 sm:w-44"
          :class="isSaving(santri.id) ? 'cursor-wait opacity-70' : ''"
          role="group"
          :aria-label="`Status absensi ${santri.nama}`"
        >
          <Button
            type="button"
            variant="outline"
            class="h-9 px-3 text-[13px] font-semibold disabled:cursor-wait"
            :class="getButtonClass(santri.id, 'present')"
            :disabled="isSaving(santri.id)"
            :aria-pressed="getAttendanceStatus(santri.id) === 'present'"
            @click="emit('status-change', santri, 'present')"
          >
            Hadir
          </Button>
          <Button
            type="button"
            variant="outline"
            class="h-9 px-3 text-[13px] font-semibold disabled:cursor-wait"
            :class="getButtonClass(santri.id, 'permission')"
            :disabled="isSaving(santri.id)"
            :aria-pressed="getAttendanceStatus(santri.id) === 'permission'"
            @click="emit('status-change', santri, 'permission')"
          >
            Izin
          </Button>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredSantri.length === 0"
        class="p-8 text-center text-sm text-muted-foreground"
      >
        Tidak ada data {{ terms.studentSingularLower }} untuk filter ini.
      </div>
    </div>
  </Card>
</template>
