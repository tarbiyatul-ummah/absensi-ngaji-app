import React, { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { getMainNavigationItems, useTerms } from "../../config/organization";
import { springDefault, useSmoothMotion } from "@/lib/motion";

const bottomNavHiddenPaths = new Set([
  "/login",
  "/keuangan",
  "/penilaian",
  "/akun/istilah",
]);
const bottomNavHiddenPrefixes = ["/tabungan", "/penilaian/"];

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const terms = useTerms();
  const { shouldReduceMotion } = useSmoothMotion();

  const enabledNavigationItems = useMemo(
    () => getMainNavigationItems(terms).filter((item) => item.enabled),
    [terms]
  );

  const shouldShow = useMemo(() => {
    const path = location.pathname;
    if (bottomNavHiddenPaths.has(path)) return false;
    if (bottomNavHiddenPrefixes.some((prefix) => path.startsWith(prefix))) {
      return false;
    }
    return true;
  }, [location.pathname]);

  if (!shouldShow) return null;

  const isItemActive = (to: string) => {
    const pathname = location.pathname;
    if (to === "/") return pathname === "/";
    if (to === "/dashboard") {
      return (
        pathname === "/dashboard" ||
        pathname.startsWith("/keuangan") ||
        pathname.startsWith("/tabungan") ||
        pathname.startsWith("/penilaian")
      );
    }
    if (to === "/master") {
      return pathname === "/master" || pathname.startsWith("/master-guru");
    }
    if (to === "/akun") {
      return pathname === "/akun" || pathname.startsWith("/akun/");
    }
    return pathname.startsWith(to);
  };

  return (
    <nav
      aria-label="Navigasi Utama Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_24px_hsl(222.2_84%_4.9%/0.08)] lg:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4">
        {enabledNavigationItems.map((item) => {
          const active = isItemActive(item.to);
          return (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.to === "/"}
              className={`
                relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors
                ${active ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}
              `}
            >
              <motion.div
                className="flex flex-col items-center justify-center gap-1 w-full"
                whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
              >
                <span className="relative flex h-8 w-8 items-center justify-center rounded-lg">
                  {active && (
                    <motion.span
                      layoutId="mobile-nav-indicator"
                      className="absolute inset-0 rounded-lg bg-neutral-100 dark:bg-neutral-800"
                      transition={shouldReduceMotion ? { duration: 0 } : springDefault}
                    />
                  )}
                  <span
                    className={`relative z-10 transition-colors ${
                      active
                        ? "text-[#7F56D9] dark:text-purple-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    <HugeiconsIcon
                      icon={item.icon}
                      size={22}
                      strokeWidth={active ? 2 : 1.8}
                    />
                  </span>
                </span>
                <span
                  className={`max-w-full truncate text-[11px] leading-tight ${
                    active ? "text-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;

