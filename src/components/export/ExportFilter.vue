<script setup lang="ts">
import { HugeiconsIcon } from "@hugeicons/vue";
import { FileDownloadIcon } from "@hugeicons/core-free-icons";
import type { Jilid, Guru } from "../../types";
import type {
  AcademicMonthOption,
  AcademicPeriodType,
  AcademicSemester,
  AcademicYearOption,
} from "../../utils/academicPeriod";

defineProps<{
  startDate: string;
  endDate: string;
  periodType: AcademicPeriodType;
  academicYearStart: number;
  semester: AcademicSemester;
  selectedMonth: string;
  academicYearOptions: AcademicYearOption[];
  academicMonthOptions: AcademicMonthOption[];
  filterType: string; // 'semua', 'jilid', 'guru'
  filterId: string;
  jilidList: Jilid[];
  guruList: Guru[];
  isGenerating: boolean;
}>();

const emit = defineEmits<{
  (e: "update:startDate", value: string): void;
  (e: "update:endDate", value: string): void;
  (e: "update:periodType", value: AcademicPeriodType): void;
  (e: "update:academicYearStart", value: number): void;
  (e: "update:semester", value: AcademicSemester): void;
  (e: "update:selectedMonth", value: string): void;
  (e: "update:filterType", value: string): void;
  (e: "update:filterId", value: string): void;
  (e: "generate"): void;
}>();

const handlePeriodSelect = (type: AcademicPeriodType) => {
  emit("update:periodType", type);
};

const handleFilterTypeChange = (value: string) => {
  emit("update:filterType", value);
  emit("update:filterId", "");
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
</script>

<template>
  <div
    class="bg-white rounded-lg shadow-[0_1px_3px_rgba(63,63,68,0.15),0_0_0_1px_rgba(63,63,68,0.05)] overflow-hidden"
  >
    <div class="p-4 border-b border-[#E1E3E5] bg-[#FAFAFA]">
      <h2 class="text-[14px] font-semibold text-[#202223]">Pengaturan Rekap</h2>
    </div>

    <div class="p-4 space-y-4">
      <!-- Periode Selection -->
      <div>
        <label class="block text-[13px] text-[#202223] font-medium mb-2"
          >Pilih Periode Laporan</label
        >
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <button
            @click="handlePeriodSelect('academicYear')"
            :class="{
              'bg-[#008060] text-white': periodType === 'academicYear',
              'bg-[#F4F6F8] text-[#202223] hover:bg-[#E1E3E5]':
                periodType !== 'academicYear',
            }"
            class="px-3 py-2 rounded-md text-[12px] font-medium transition-colors border border-[#C9CCCF]"
          >
            Tahun Ajaran
          </button>
          <button
            @click="handlePeriodSelect('semester')"
            :class="{
              'bg-[#008060] text-white': periodType === 'semester',
              'bg-[#F4F6F8] text-[#202223] hover:bg-[#E1E3E5]':
                periodType !== 'semester',
            }"
            class="px-3 py-2 rounded-md text-[12px] font-medium transition-colors border border-[#C9CCCF]"
          >
            Semester
          </button>
          <button
            @click="handlePeriodSelect('month')"
            :class="{
              'bg-[#008060] text-white': periodType === 'month',
              'bg-[#F4F6F8] text-[#202223] hover:bg-[#E1E3E5]':
                periodType !== 'month',
            }"
            class="px-3 py-2 rounded-md text-[12px] font-medium transition-colors border border-[#C9CCCF]"
          >
            Bulanan
          </button>
          <button
            @click="handlePeriodSelect('custom')"
            :class="{
              'bg-[#008060] text-white': periodType === 'custom',
              'bg-[#F4F6F8] text-[#202223] hover:bg-[#E1E3E5]':
                periodType !== 'custom',
            }"
            class="px-3 py-2 rounded-md text-[12px] font-medium transition-colors border border-[#C9CCCF]"
          >
            Kustom
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div v-if="periodType !== 'custom'">
            <label class="block text-[11px] text-[#6D7175] font-medium mb-1"
              >Tahun Ajaran</label
            >
            <select
              :value="academicYearStart"
              @change="
                emit(
                  'update:academicYearStart',
                  Number(($event.target as HTMLSelectElement).value),
                )
              "
              class="w-full rounded-md border border-[#C9CCCF] bg-white p-2 text-[13px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none"
            >
              <option
                v-for="year in academicYearOptions"
                :key="year.startYear"
                :value="year.startYear"
              >
                {{ year.label }}
              </option>
            </select>
          </div>

          <div v-if="periodType === 'semester'">
            <label class="block text-[11px] text-[#6D7175] font-medium mb-1"
              >Semester</label
            >
            <select
              :value="semester"
              @change="
                emit(
                  'update:semester',
                  ($event.target as HTMLSelectElement)
                    .value as AcademicSemester,
                )
              "
              class="w-full rounded-md border border-[#C9CCCF] bg-white p-2 text-[13px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none"
            >
              <option value="ganjil">Ganjil</option>
              <option value="genap">Genap</option>
            </select>
          </div>

          <div v-if="periodType === 'month'">
            <label class="block text-[11px] text-[#6D7175] font-medium mb-1"
              >Bulan</label
            >
            <select
              :value="selectedMonth"
              @change="
                emit(
                  'update:selectedMonth',
                  ($event.target as HTMLSelectElement).value,
                )
              "
              class="w-full rounded-md border border-[#C9CCCF] bg-white p-2 text-[13px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none"
            >
              <option
                v-for="month in academicMonthOptions"
                :key="month.value"
                :value="month.value"
              >
                {{ month.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Date Range Display/Input -->
        <div
          v-if="periodType === 'custom'"
          class="flex flex-col md:flex-row gap-2 mb-3"
        >
          <div class="flex-1">
            <label class="block text-[11px] text-[#6D7175] font-medium mb-1"
              >Dari</label
            >
            <input
              type="date"
              :value="startDate"
              @input="
                emit(
                  'update:startDate',
                  ($event.target as HTMLInputElement).value,
                )
              "
              class="w-full rounded-md border border-[#C9CCCF] bg-white p-2 text-[13px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none"
            />
          </div>
          <div class="flex-1">
            <label class="block text-[11px] text-[#6D7175] font-medium mb-1"
              >Sampai</label
            >
            <input
              type="date"
              :value="endDate"
              @input="
                emit(
                  'update:endDate',
                  ($event.target as HTMLInputElement).value,
                )
              "
              class="w-full rounded-md border border-[#C9CCCF] bg-white p-2 text-[13px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none"
            />
          </div>
        </div>

        <!-- Date Range Display -->
        <div
          v-if="startDate && endDate"
          class="px-3 py-2 bg-[#E3F1DF] rounded-md border border-[#D0E4C9]"
        >
          <p class="text-[12px] text-[#008060] font-medium">
            {{ formatDate(startDate) }} - {{ formatDate(endDate) }}
          </p>
        </div>
      </div>

      <!-- Filter Tipe -->
      <div class="flex flex-col md:flex-row gap-3">
        <div class="w-full">
          <label class="block text-[13px] text-[#202223] font-medium mb-1.5"
            >Filter Laporan</label
          >
          <select
            :value="filterType"
            @change="
              handleFilterTypeChange(($event.target as HTMLSelectElement).value)
            "
            class="w-full rounded-md border border-[#C9CCCF] bg-white p-2.5 text-[14px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer"
          >
            <option value="semua">Semua Santri</option>
            <option value="jilid">Berdasarkan Jilid</option>
            <option value="guru">Berdasarkan Guru</option>
          </select>
        </div>

        <!-- Conditional Dropdown (Muncul jika Jilid/Guru dipilih) -->
        <div
          v-if="filterType !== 'semua'"
          class="w-full animate-in fade-in duration-200"
        >
          <label class="block text-[13px] text-[#202223] font-medium mb-1.5">
            Pilih {{ filterType === "jilid" ? "Jilid" : "Guru" }}
          </label>
          <select
            :value="filterId"
            @change="
              emit(
                'update:filterId',
                ($event.target as HTMLSelectElement).value,
              )
            "
            class="w-full rounded-md border border-[#C9CCCF] bg-white p-2.5 text-[14px] text-[#202223] focus:border-[#008060] focus:ring-1 focus:ring-[#008060] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer"
          >
            <option value="" disabled>Pilih spesifik...</option>
            <template v-if="filterType === 'jilid'">
              <option
                v-for="jilid in jilidList"
                :key="jilid.id"
                :value="jilid.id"
              >
                {{ jilid.nama }}
              </option>
            </template>
            <template v-else>
              <option v-for="guru in guruList" :key="guru.id" :value="guru.id">
                {{ guru.nama }}
              </option>
            </template>
          </select>
        </div>
      </div>

      <div class="pt-2">
        <button
          @click="emit('generate')"
          :disabled="isGenerating"
          class="w-full rounded-md bg-[#202223] px-4 py-2.5 text-[14px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.15)] hover:bg-[#454749] active:bg-[#111213] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <HugeiconsIcon
            v-if="!isGenerating"
            :icon="FileDownloadIcon"
            :size="17"
            color="currentColor"
            :stroke-width="2"
          />
          <svg
            v-else
            class="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {{ isGenerating ? "Menyusun Data..." : "Buat Rekap" }}
        </button>
      </div>
    </div>
  </div>
</template>
