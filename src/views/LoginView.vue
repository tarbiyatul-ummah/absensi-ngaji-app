<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { loadOrganizationConfigFromCloud } from "../config/organization";
import { supabase } from "../services/supabase";
import {
  clearLoginRateLimit,
  getLoginRateLimitStatus,
  recordFailedLoginAttempt,
} from "../services/loginRateLimiter";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const email = ref("");
const password = ref("");
const errorMsg = ref("");
const isLoading = ref(false);
const router = useRouter();

const getLoginErrorMessage = (message: string) => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("email not confirmed")) {
    return "Email belum dikonfirmasi. Buka email verifikasi dari Supabase atau matikan email confirmation di Supabase Auth.";
  }

  if (
    lowerMessage.includes("invalid login credentials") ||
    lowerMessage.includes("invalid credentials")
  ) {
    return "Email atau password belum cocok. Periksa kembali data login Supabase.";
  }

  if (lowerMessage.includes("email rate limit exceeded")) {
    return "Terlalu banyak percobaan email dari Supabase. Tunggu sebentar lalu coba lagi.";
  }

  return `Login gagal: ${message}`;
};

const handleLogin = async () => {
  const rateLimit = getLoginRateLimitStatus();
  if (rateLimit.isLocked) {
    const minutes = Math.ceil(rateLimit.retryAfterSeconds / 60);
    errorMsg.value = `Terlalu banyak percobaan login. Coba lagi sekitar ${minutes} menit.`;
    return;
  }

  isLoading.value = true;
  errorMsg.value = "";
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value,
    });

    if (error) {
      recordFailedLoginAttempt();
      errorMsg.value = getLoginErrorMessage(error.message);
      return;
    }

    clearLoginRateLimit();
    await loadOrganizationConfigFromCloud().catch(() => undefined);
    router.push("/"); // Redirect ke home setelah login sukses
  } catch {
    recordFailedLoginAttempt();
    errorMsg.value = "Login gagal. Periksa koneksi dan konfigurasi Supabase.";
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="app-page flex items-center justify-center px-4">
    <Card class="w-full max-w-100">
      <CardContent class="p-6 space-y-6">
        <div class="text-center space-y-2">
          <h1 class="text-2xl font-bold text-foreground">Sistem Absensi</h1>
          <p class="text-sm text-muted-foreground">
            Masuk untuk mengelola absensi lembaga anda.
          </p>
        </div>

        <Alert
          v-if="errorMsg"
          variant="destructive"
          class="block leading-relaxed break-words border-destructive/30 bg-destructive/5 text-destructive"
        >
          {{ errorMsg }}
        </Alert>

        <div class="space-y-4">
          <div>
            <Label>Email</Label>
            <Input v-model="email" type="email" placeholder="nama@email.com" />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              v-model="password"
              type="password"
              @keyup.enter="handleLogin"
              placeholder="Password"
            />
          </div>

          <Button
            type="button"
            @click="handleLogin"
            :disabled="isLoading"
            class="w-full"
          >
            {{ isLoading ? "Memproses..." : "Masuk" }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
