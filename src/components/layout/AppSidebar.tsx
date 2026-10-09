import React, { useState, useRef, useEffect, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  MoreVertical,
  LogOut,
  Settings,
  CircleDot,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getMainNavigationItems,
  useOrganizationConfig,
  useTerms,
} from "../../config/organization";
import { springDefault, useSmoothMotion } from "@/lib/motion";

interface AppSidebarProps {
  className?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ className = "" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const orgConfig = useOrganizationConfig();
  const terms = useTerms();
  const { shouldReduceMotion } = useSmoothMotion();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Only the 4 configured navigation items
  const navigationItems = useMemo(
    () => getMainNavigationItems(terms).filter((item) => item.enabled),
    [terms]
  );

  // Determine active state including nested routes
  const isItemActive = (to: string) => {
    const pathname = location.pathname;
    if (to === "/") {
      return pathname === "/";
    }
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

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    await signOut();
    navigate("/login", { replace: true });
  };

  // Derive user display information
  const userDisplayName =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    (user?.email ? user.email.split("@")[0] : "Pengajar");
  const userEmail = user?.email || "ustadz@pesantren.id";
  const userAvatar = user?.user_metadata?.avatar_url as string | undefined;
  const userInitials =
    userDisplayName
      .split(" ")
      .map((part: string) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <aside
      className={`
        hidden lg:flex flex-col h-screen sticky top-0 shrink-0 border-r border-border/80 bg-neutral-50/70 dark:bg-neutral-900/60 backdrop-blur-md select-none transition-[width] duration-200 z-30
        ${isCollapsed ? "w-[68px]" : "w-64"}
        ${className}
      `}
    >
      {/* Header (Logo + Brand + Collapse button) */}
      <div className="p-3 border-b border-border/40">
        {isCollapsed ? (
          // Collapsed Header: Centered elements stacked neatly without horizontal overlap
          <div className="flex flex-col items-center gap-2.5">
            <div
              title={orgConfig.name}
              className="size-9 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-[#7F56D9] dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-900/50 shadow-2xs"
            >
              {orgConfig.faviconUrl && !orgConfig.faviconUrl.includes("placeholder") ? (
                <img
                  src={orgConfig.faviconUrl}
                  alt={orgConfig.name}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <LayoutGrid className="size-4.5" />
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              aria-label="Buka sidebar"
              title="Buka sidebar"
              className="size-8 flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="size-4.5" />
            </button>
          </div>
        ) : (
          // Expanded Header: Brand on left, collapse button on right
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="size-8.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-[#7F56D9] dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-900/50 shadow-2xs">
                {orgConfig.faviconUrl && !orgConfig.faviconUrl.includes("placeholder") ? (
                  <img
                    src={orgConfig.faviconUrl}
                    alt={orgConfig.name}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <LayoutGrid className="size-4.5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate block tracking-tight leading-tight">
                  {orgConfig.name || "Untitled UI"}
                </span>
                <span className="text-[11px] text-muted-foreground truncate block leading-tight mt-0.5">
                  {orgConfig.appTitle}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              aria-label="Tutup sidebar"
              title="Tutup sidebar"
              className="size-7.5 flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Menu (The 4 menus only) */}
      <nav
        aria-label="Menu Navigasi Desktop"
        className={`flex-1 py-3 space-y-1 ${isCollapsed ? "px-2" : "px-3"}`}
      >
        {navigationItems.map((item) => {
          const active = isItemActive(item.to);
          return (
            <NavLink
              key={item.key}
              to={item.to}
              title={isCollapsed ? item.label : undefined}
              className={`
                group relative flex items-center rounded-lg text-sm transition-all duration-150 outline-none
                ${
                  isCollapsed
                    ? "size-10 mx-auto justify-center"
                    : "gap-3 px-3 py-2.5 w-full"
                }
                ${
                  active
                    ? "bg-neutral-200/60 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 font-semibold shadow-2xs"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/40 font-medium"
                }
              `}
            >
              {/* Active Icon in purple accent color */}
              <span
                className={`shrink-0 transition-colors flex items-center justify-center ${
                  active
                    ? "text-[#7F56D9] dark:text-purple-400"
                    : "text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300"
                }`}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={20}
                  strokeWidth={active ? 2 : 1.8}
                />
              </span>

              {!isCollapsed && (
                <span className="truncate flex-1 leading-none">
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Flexible Spacer */}
      <div className="flex-1 min-h-6" />

      {/* Footer User Profile Card (Lucy Bond style) */}
      <div
        ref={profileMenuRef}
        className={`relative border-t border-border/80 ${isCollapsed ? "p-2" : "p-3"}`}
      >
        <button
          type="button"
          onClick={() => setProfileMenuOpen((prev) => !prev)}
          className={`
            w-full flex items-center rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60 transition-colors group cursor-pointer text-left
            ${isCollapsed ? "justify-center p-1.5" : "justify-between p-1.5"}
          `}
          aria-expanded={profileMenuOpen}
          aria-label="Menu Profil Pengguna"
          title={isCollapsed ? `${userDisplayName} (${userEmail})` : undefined}
        >
          <div className={`flex items-center min-w-0 ${isCollapsed ? "justify-center" : "gap-2.5"}`}>
            {/* Avatar */}
            <div className="size-8.5 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 border border-border shrink-0 flex items-center justify-center font-semibold text-xs text-foreground shadow-2xs">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userDisplayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{userInitials}</span>
              )}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate leading-tight">
                  {userDisplayName}
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate leading-tight mt-0.5">
                  {userEmail}
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <MoreVertical className="size-4 text-neutral-400 group-hover:text-neutral-600 shrink-0 ml-1.5 transition-colors" />
          )}
        </button>

        {/* Profile Popover Menu (Right of sidebar) */}
        <AnimatePresence>
          {profileMenuOpen && (
            <motion.div
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.96, x: -4 }
              }
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.96, x: -4 }
              }
              transition={shouldReduceMotion ? { duration: 0.1 } : springDefault}
              className="absolute left-[calc(100%+0.5rem)] bottom-2 z-50 rounded-xl border border-border bg-card p-2 shadow-xl min-w-[220px]"
            >
              {/* Account Status Card */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-accent/40 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-7 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 border border-border shrink-0 flex items-center justify-center font-semibold text-[11px] text-foreground">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userDisplayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{userInitials}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate leading-tight">
                      {userDisplayName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate leading-tight">
                      {userEmail}
                    </p>
                  </div>
                </div>
                <div title="Akun Aktif" className="shrink-0 ml-1 text-foreground">
                  <CircleDot className="size-3.5" />
                </div>
              </div>

              <div className="border-t border-border/70 my-1" />

              {/* Menu Actions */}
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/akun");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-accent/70 transition-colors text-left cursor-pointer"
                >
                  <Settings className="size-3.5 text-muted-foreground shrink-0" />
                  <span>Pengaturan Akun</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="size-3.5 shrink-0" />
                    <span>Keluar</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">Sign out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};

export default AppSidebar;
