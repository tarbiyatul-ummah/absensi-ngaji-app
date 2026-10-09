import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { loadOrganizationConfigFromCloud } from "@/config/organization";
import { supabase } from "@/services/supabase";
import {
  clearLoginRateLimit,
  getLoginRateLimitStatus,
  recordFailedLoginAttempt,
} from "@/services/loginRateLimiter";
import { useSmoothMotion, scaleFadeVariants, fadeSlideUpVariants } from "@/lib/motion";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { shouldReduceMotion } = useSmoothMotion();

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

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const rateLimit = getLoginRateLimitStatus();
    if (rateLimit.isLocked) {
      const minutes = Math.ceil(rateLimit.retryAfterSeconds / 60);
      setErrorMsg(
        `Terlalu banyak percobaan login. Coba lagi sekitar ${minutes} menit.`,
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        recordFailedLoginAttempt();
        setErrorMsg(getLoginErrorMessage(error.message));
        return;
      }

      clearLoginRateLimit();
      await loadOrganizationConfigFromCloud().catch(() => undefined);
      navigate("/", { replace: true });
    } catch {
      recordFailedLoginAttempt();
      setErrorMsg("Login gagal. Periksa koneksi dan konfigurasi Supabase.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-page flex items-center justify-center px-4">
      <motion.div
        variants={scaleFadeVariants}
        initial={shouldReduceMotion ? false : "initial"}
        animate="animate"
        className="w-full max-w-sm"
      >
        <Card className="w-full">
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Sistem Absensi</h1>
              <p className="text-sm text-muted-foreground">
                Masuk untuk mengelola absensi lembaga anda.
              </p>
            </div>

            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  variants={fadeSlideUpVariants}
                  initial={shouldReduceMotion ? false : "initial"}
                  animate="animate"
                  exit="exit"
                >
                  <Alert
                    variant="destructive"
                    className="block leading-relaxed break-words border-destructive/30 bg-destructive/5 text-destructive"
                  >
                    {errorMsg}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="nama@email.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Memproses..." : "Masuk"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginView;

