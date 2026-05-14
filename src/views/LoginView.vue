<script setup lang="ts">
import { ref } from "vue";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const errorMsg = ref("");
const isLoading = ref(false);
const router = useRouter();

const handleLogin = async () => {
  isLoading.value = true;
  errorMsg.value = "";
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    router.push("/"); // Redirect ke home setelah login sukses
  } catch (err: any) {
    errorMsg.value = "Email atau password salah. Silakan coba lagi.";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#F4F6F8] flex items-center justify-center px-4">
    <div
      class="bg-white rounded-lg shadow-[0_1px_3px_rgba(63,63,68,0.15),0_0_0_1px_rgba(63,63,68,0.05)] w-full max-w-[400px] overflow-hidden"
    >
      <div class="p-6 space-y-6">
        <div class="text-center space-y-2">
          <h1 class="text-[24px] font-bold text-[#202223]">
            LPQ Tarbiyatul Ummah
          </h1>
          <p class="text-[14px] text-[#6D7175]">
            Masuk untuk mengelola absensi santri
          </p>
        </div>

        <div
          v-if="errorMsg"
          class="p-3 bg-[#FFF4F4] border border-[#D82C0D] rounded text-[#D82C0D] text-[13px]"
        >
          {{ errorMsg }}
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-[13px] font-medium text-[#202223] mb-1.5"
              >Email</label
            >
            <input
              v-model="email"
              type="email"
              class="w-full rounded-md border border-[#C9CCCF] p-2.5 text-[14px] focus:border-[#008060] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
              placeholder="nama@email.com"
            />
          </div>
          <div>
            <label class="block text-[13px] font-medium text-[#202223] mb-1.5"
              >Password</label
            >
            <input
              v-model="password"
              type="password"
              @keyup.enter="handleLogin"
              class="w-full rounded-md border border-[#C9CCCF] p-2.5 text-[14px] focus:border-[#008060] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
              placeholder="••••••••"
            />
          </div>

          <button
            @click="handleLogin"
            :disabled="isLoading"
            class="w-full rounded-md bg-[#008060] py-2.5 text-[14px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.15)] hover:bg-[#006E52] active:bg-[#005E46] transition-colors disabled:opacity-50"
          >
            {{ isLoading ? "Memproses..." : "Masuk" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
