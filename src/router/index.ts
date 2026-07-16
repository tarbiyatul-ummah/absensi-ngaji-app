import { createRouter, createWebHistory } from "vue-router";
import { getCurrentUser } from "../services/supabase";
import { terms } from "../config/organization";

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
    {
      path: "/keuangan",
      component: () => import("../views/FinanceView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/tabungan",
      component: () => import("../views/SavingsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/tabungan/:id",
      component: () => import("../views/SavingsDetailView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/penilaian",
      component: () => import("../views/FeaturePlaceholderView.vue"),
      props: () => ({
        title: "Penilaian",
        description:
          `Catat perkembangan ${terms.studentSingularLower} dengan format yang bisa disesuaikan untuk organisasi.`,
      }),
      meta: { requiresAuth: true },
    },
    {
      path: "/akun",
      component: () => import("../views/AccountView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/akun/istilah",
      component: () => import("../views/OrganizationTermsView.vue"),
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
