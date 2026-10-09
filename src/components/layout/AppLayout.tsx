import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { useAuth } from "../../context/AuthContext";
import { useSmoothMotion } from "@/lib/motion";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { shouldReduceMotion } = useSmoothMotion();

  // If user is not logged in or on the login view, don't show navigation
  const isAuthPage = location.pathname === "/login" || !user;

  if (isAuthPage) {
    return (
      <div className="min-h-screen text-foreground font-sans">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 6 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -6 }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0.1 }
                  : { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
              }
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row font-sans">
      {/* Desktop Sidebar (Docked Edge-to-Edge Untitled UI Style) */}
      <AppSidebar />

      {/* Main Content View Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 6 }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: -6 }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0.1 }
                    : { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
                }
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Navigation (Bottom Nav Bar for Mobile Screens) */}
      <MobileBottomNav />
    </div>
  );
};

export default AppLayout;
