<script setup lang="ts">
import { ref } from "vue";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { useRouter } from "vue-router";
import { organizationConfig, terms } from "../config/organization";
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
  <div class="app-page flex items-center justify-center px-4">
    <Card class="w-full max-w-100">
      <CardContent class="p-6 space-y-6">
        <div class="text-center space-y-2">
          <h1 class="text-2xl font-bold text-foreground">
            {{ organizationConfig.name }}
          </h1>
          <p class="text-sm text-muted-foreground">
            Masuk untuk mengelola absensi {{ terms.studentSingularLower }}
          </p>
        </div>

        <Alert v-if="errorMsg" variant="destructive">
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
