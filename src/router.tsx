import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "./components/auth/PublicOnlyRoute";

// Lazy loading views for bundle optimization as recommended in improve-react-skill.md
const LoginView = lazy(() => import("./views/LoginView"));
const AbsensiView = lazy(() => import("./views/AbsensiView"));
const MasterSantri = lazy(() => import("./views/MasterSantri"));
const MasterGuruJilid = lazy(() => import("./views/MasterGuruJilid"));
const ExportView = lazy(() => import("./views/ExportView"));
const DashboardView = lazy(() => import("./views/DashboardView"));
const FinanceView = lazy(() => import("./views/FinanceView"));
const SavingsView = lazy(() => import("./views/SavingsView"));
const SavingsDetailView = lazy(() => import("./views/SavingsDetailView"));
const AssessmentView = lazy(() => import("./views/AssessmentView"));
const AccountView = lazy(() => import("./views/AccountView"));
const OrganizationTermsView = lazy(() => import("./views/OrganizationTermsView"));

import { LoadingState } from "./components/ui/loading-state";

const SuspenseFallback = <LoadingState size="fullscreen" text="Memuat Data" />;

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      // Public only routes
      {
        element: <PublicOnlyRoute />,
        children: [
          {
            path: "/login",
            element: (
              <Suspense fallback={SuspenseFallback}>
                <LoginView />
              </Suspense>
            ),
          },
        ],
      },
      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/",
            element: (
              <Suspense fallback={SuspenseFallback}>
                <AbsensiView />
              </Suspense>
            ),
          },
          {
            path: "/master",
            element: (
              <Suspense fallback={SuspenseFallback}>
                <MasterSantri />
              </Suspense>
            ),
          },
          {
            path: "/master-guru",
            element: (
              <Suspense fallback={SuspenseFallback}>
                <MasterGuruJilid />
              </Suspense>
            ),
          },
          {
            path: "/export",
            element: (
              <Suspense fallback={SuspenseFallback}>
                <ExportView />
              </Suspense>
            ),
          },
          {
            path: "/dashboard",
            element: (
              <Suspense fallback={SuspenseFallback}>
                <DashboardView />
              </Suspense>
            ),
          },
          {
            path: "/keuangan",
            element: (
              <Suspense fallback={SuspenseFallback}>
                <FinanceView />
              </Suspense>
            ),
          },
          {
            path: "/tabungan",
            element: (
              <Suspense fallback={SuspenseFallback}>
                <SavingsView />
              </Suspense>
            ),
          },
          {
            path: "/tabungan/:id",
            element: (
              <Suspense fallback={SuspenseFallback}>
                <SavingsDetailView />
              </Suspense>
            ),
          },
          {
            path: "/penilaian",
            element: (
              <Suspense fallback={SuspenseFallback}>
                <AssessmentView />
              </Suspense>
            ),
          },
          {
            path: "/penilaian/:id",
            element: (
              <Suspense fallback={SuspenseFallback}>
                <AssessmentView />
              </Suspense>
            ),
          },
          {
            path: "/akun",
            element: (
              <Suspense fallback={SuspenseFallback}>
                <AccountView />
              </Suspense>
            ),
          },
          {
            path: "/akun/istilah",
            element: (
              <Suspense fallback={SuspenseFallback}>
                <OrganizationTermsView />
              </Suspense>
            ),
          },
        ],
      },
      // 404 fallback
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;

