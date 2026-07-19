import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css"; // Pastikan @tailwind directives ada di sini
import { applyOrganizationMetadata } from "./config/organization";

const REDIRECT_STORAGE_KEY = "absensi-ngaji:redirect-path";
const app = createApp(App);

applyOrganizationMetadata();

app.use(createPinia());
app.use(router);

app.mount("#app");

if (typeof window !== "undefined") {
  const redirectPath = window.sessionStorage.getItem(REDIRECT_STORAGE_KEY);

  if (redirectPath) {
    window.sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
    router.isReady().then(() => {
      router.replace(redirectPath).catch(() => undefined);
    });
  }
}
