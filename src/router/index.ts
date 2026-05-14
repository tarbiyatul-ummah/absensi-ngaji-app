import { createRouter, createWebHistory } from "vue-router";
import { getCurrentUser } from "../services/firebase";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: () => import("../views/LoginView.vue") },
    {
      path: "/",
      component: () => import("../views/AbsensiView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/master",
      component: () => import("../views/MasterSantri.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/master-guru",
      component: () => import("../views/MasterGuruJilid.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/export",
      component: () => import("../views/ExportView.vue"),
      meta: { requiresAuth: true },
    },
    // Di dalam array routes:
    {
      path: "/dashboard",
      component: () => import("../views/DashboardView.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

// Middleware Cek Login

router.beforeEach(async (to) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const user = await getCurrentUser();

  if (requiresAuth && !user) return "/login";
  if (to.path === "/login" && user) return "/";
});

export default router;
