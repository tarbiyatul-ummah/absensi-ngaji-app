<script setup lang="ts">
import { ref } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Jilid, Guru } from "../../types";
import { terms } from "../../config/organization";

const props = defineProps<{
  jilidList: Jilid[];
  guruList: Guru[];
  variant?: "card" | "plain";
}>();

const emit = defineEmits<{
  (e: "submit", data: { nama: string; jilidId: string; guruId: string }): void;
  (e: "cancel"): void;
}>();

const inputNama = ref("");
const selectedJilid = ref("");
const selectedGuru = ref("");

const handleSubmit = () => {
  if (!inputNama.value || !selectedJilid.value || !selectedGuru.value) {
    return alert("Lengkapi data terlebih dahulu");
  }

  emit("submit", {
    nama: inputNama.value,
    jilidId: selectedJilid.value,
    guruId: selectedGuru.value,
  });

  inputNama.value = ""; // Reset form setelah submit
};
</script>

<template>
  <component
    :is="props.variant === 'plain' ? 'form' : Card"
    :class="props.variant === 'plain' ? 'space-y-4' : 'gap-0 py-0'"
    @submit.prevent="handleSubmit"
  >
    <CardHeader v-if="props.variant !== 'plain'" class="border-b py-4">
      <CardTitle>Tambah {{ terms.studentSingularTitle }} Baru</CardTitle>
    </CardHeader>

    <div :class="props.variant === 'plain' ? 'space-y-4' : 'space-y-4 p-4'">
      <div>
        <Label>
          Nama {{ terms.studentSingularTitle }}
        </Label>
        <Textarea
          v-model="inputNama"
          placeholder="Pisahkan dengan koma (contoh: Budi, Andi)"
          rows="2"
        />
      </div>

      <div class="flex gap-3">
        <div class="w-full">
          <Label>
            {{ terms.levelSingularTitle }}
          </Label>
          <select
            v-model="selectedJilid"
            class="ui-select"
          >
            <option value="" disabled>
              Pilih {{ terms.levelSingularTitle }}
            </option>
            <option
              v-for="jilid in jilidList"
              :key="jilid.id"
              :value="jilid.id"
            >
              {{ jilid.nama }}
            </option>
          </select>
        </div>
        <div class="w-full">
          <Label>
            {{ terms.mentorSingularTitle }}
          </Label>
          <select
            v-model="selectedGuru"
            class="ui-select"
          >
            <option value="" disabled>
              Pilih {{ terms.mentorSingularTitle }}
            </option>
            <option v-for="guru in guruList" :key="guru.id" :value="guru.id">
              {{ guru.nama }}
            </option>
          </select>
        </div>
      </div>

      <div class="pt-2">
        <Button
          type="button"
          class="w-full md:w-auto"
          @click="handleSubmit"
        >
          <HugeiconsIcon
            :icon="PlusSignIcon"
            :size="17"
            color="currentColor"
            :stroke-width="2"
          />
          Simpan Data
        </Button>
      </div>
    </div>
  </component>
</template>
