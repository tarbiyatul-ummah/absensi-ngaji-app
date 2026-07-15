import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css"; // Pastikan @tailwind directives ada di sini
import { applyOrganizationMetadata } from "./config/organization";

const app = createApp(App);

applyOrganizationMetadata();

app.use(createPinia());
app.use(router);

app.mount("#app");
