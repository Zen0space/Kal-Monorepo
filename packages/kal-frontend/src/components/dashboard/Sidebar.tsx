"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Code,
  Database,
  FileText,
  Home,
  Key,
  List,
  Menu,
  MessageSquare,
  Settings,
  X,
  Zap,
} from "react-feather";
import { useAtom } from "jotai";

import { useAuth } from "@/lib/auth-context";
import { useSidebarLayout } from "@/hooks/useBreakpoint";
import { sidebarCollapsedAtom } from "@/atoms/sidebar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// Navigation structure — grouped by section
// ---------------------------------------------------------------------------
const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Home", icon: Home }],
  },
  {
    label: "Developer",
    items: [
      { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
      { href: "/dashboard/logs", label: "Request Logs", icon: List },
      { href: "/dashboard/docs", label: "API Reference", icon: BookOpen },
      { href: "/dashboard/setup", label: "Setup", icon: Code },
    ],
  },
  {
    label: "Data",
    items: [{ href: "/dashboard/foods", label: "Food List", icon: Database }],
  },
];

// ---------------------------------------------------------------------------
// Tooltip — custom animated tooltip for collapsed state
// ---------------------------------------------------------------------------
function Tooltip({
  children,
  label,
  show,
}: {
  children: ReactNode;
  label: string;
  show: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  if (!show) return <>{children}</>;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {hovered && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 animate-tooltip-in pointer-events-none">
          <div className="px-2.5 py-1.5 rounded-md bg-white/[0.06] border border-white/[0.06] text-xs font-medium text-content-primary whitespace-nowrap shadow-lg shadow-black/40">
            {label}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// User avatar with initials
// ---------------------------------------------------------------------------
function UserInitials({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  const initials = (() => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2)
        return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "U";
  })();

  return (
    <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center flex-shrink-0">
      <span className="text-[11px] font-semibold text-accent leading-none">
        {initials}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section label
// ---------------------------------------------------------------------------
function SectionLabel({
  label,
  collapsed,
}: {
  label: string;
  collapsed: boolean;
}) {
  return (
    <div className={`px-4 pt-5 pb-1.5 ${collapsed ? "sr-only" : ""}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-content-muted/70">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NavLink — single navigation item (shared between desktop + mobile)
// ---------------------------------------------------------------------------
function NavLink({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Tooltip label={item.label} show={collapsed}>
      <Link
        href={item.href}
        onClick={onClick}
        className={`
          group relative flex items-center gap-3 mx-2 rounded-lg transition-all duration-200
          ${collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"}
          ${
            isActive
              ? "bg-accent/[0.08] text-accent"
              : "text-content-secondary hover:bg-white/[0.04] hover:text-content-primary"
          }
        `}
      >
        {/* Active indicator bar */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" />
        )}

        <Icon
          size={19}
          className={`flex-shrink-0 transition-transform duration-200 ${
            !isActive ? "group-hover:translate-x-[1px]" : ""
          }`}
        />

        {/* Text — animated via max-width + opacity for smooth collapse */}
        <span
          className={`font-medium text-[13.5px] whitespace-nowrap transition-all duration-300 overflow-hidden ${
            collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"
          }`}
        >
          {item.label}
        </span>
      </Link>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Announcement Carousel - Auto-rotating announcements banner with slide animation
// ---------------------------------------------------------------------------

interface Announcement {
  id: string;
  icon: typeof AlertCircle;
  iconColor: string;
  bgGradient: string;
  title: string;
  message: string | React.ReactNode;
  linkText: string;
  linkHref: string;
}

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "pricing-launch",
    icon: Zap,
    iconColor: "text-yellow-400",
    bgGradient: "from-yellow-500/10 to-amber-500/10",
    title: "Need More Requests?",
    message: "Upgrade your plan for higher daily limits and premium features.",
    linkText: "View Plans",
    linkHref: "/pricing",
  },
  {
    id: "api-v1-migration",
    icon: AlertCircle,
    iconColor: "text-accent",
    bgGradient: "from-accent/10 to-emerald-500/10",
    title: "API v1 Migration:",
    message: (
      <>
        API endpoints have moved to{" "}
        <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-accent text-xs font-mono">
          /api/v1/*
        </code>
        . Update your base URL.
      </>
    ),
    linkText: "View Guide",
    linkHref: "/dashboard/setup",
  },
];

const ROTATE_INTERVAL = 5000; // 5 seconds

function AnnouncementCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Handle slide transition
  const goToSlide = (newIndex: number) => {
    if (isAnimating || newIndex === currentIndex) return;
    setPrevIndex(currentIndex);
    setIsAnimating(true);
    setCurrentIndex(newIndex);
    setTimeout(() => setIsAnimating(false), 400); // Match animation duration
  };

  // Auto-rotate effect
  useEffect(() => {
    if (dismissed || isPaused || ANNOUNCEMENTS.length <= 1) return;

    const interval = setInterval(() => {
      goToSlide((currentIndex + 1) % ANNOUNCEMENTS.length);
    }, ROTATE_INTERVAL);

    return () => clearInterval(interval);
  }, [dismissed, isPaused, currentIndex, isAnimating]);

  if (dismissed) return null;

  const current = ANNOUNCEMENTS[currentIndex];

  return (
    <div
      className="border-b border-accent/20 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative">
        {/* Slides container */}
        <div
          className="flex transition-transform duration-400 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transitionDuration: "400ms",
          }}
        >
          {ANNOUNCEMENTS.map((announcement) => {
            const Icon = announcement.icon;
            return (
              <div
                key={announcement.id}
                className={`w-full flex-shrink-0 bg-gradient-to-r ${announcement.bgGradient}`}
              >
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      size={18}
                      className={`${announcement.iconColor} flex-shrink-0`}
                    />
                    <p className="text-sm text-content-primary truncate">
                      <span className="font-semibold">
                        {announcement.title}
                      </span>{" "}
                      <span className="text-content-secondary">
                        {announcement.message}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Dot indicators */}
                    {ANNOUNCEMENTS.length > 1 && (
                      <div className="flex items-center gap-1.5">
                        {ANNOUNCEMENTS.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => goToSlide(idx)}
                            className={`h-1.5 rounded-full transition-all duration-200 ${
                              idx === currentIndex
                                ? "bg-accent w-3"
                                : "bg-white/20 hover:bg-white/40 w-1.5"
                            }`}
                            aria-label={`Go to announcement ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                    <Link
                      href={announcement.linkHref}
                      className="text-xs font-medium text-accent hover:text-accent/80 transition-colors whitespace-nowrap"
                    >
                      {announcement.linkText}
                    </Link>
                    <button
                      onClick={() => setDismissed(true)}
                      className="p-1 text-content-muted hover:text-content-primary transition-colors"
                      aria-label="Dismiss all announcements"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SIDEBAR — Desktop / Tablet
// =========================================================================
function DesktopSidebar() {
  const { shouldAutoCollapse, isMounted } = useSidebarLayout();
  const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);
  const pathname = usePathname();
  const hasInitialized = useRef(false);
  const { name, email } = useAuth();

  useEffect(() => {
    if (isMounted && !hasInitialized.current) {
      hasInitialized.current = true;
      setCollapsed(shouldAutoCollapse);
    }
  }, [isMounted, shouldAutoCollapse, setCollapsed]);

  const displayName = name || email?.split("@")[0] || "User";
  const displayEmail = email || "";

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-40
        bg-gradient-to-b from-[#151515] to-[#101010]
        border-r border-white/[0.06]
        transition-[width] duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-64"}
      `}
    >
      <div className="flex flex-col h-full">
        {/* ---- Logo ---- */}
        <div className="h-14 flex items-center px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative flex-shrink-0">
              <div className="w-3.5 h-3.5 rounded-full bg-accent group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-accent/40 blur-[6px]" />
            </div>
            <span
              className={`text-lg font-bold text-content-primary whitespace-nowrap transition-all duration-300 overflow-hidden ${
                collapsed ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100"
              }`}
            >
              Kal
            </span>
          </Link>
        </div>

        {/* Subtle separator after logo */}
        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* ---- Navigation sections ---- */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              <SectionLabel label={section.label} collapsed={collapsed} />
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                  collapsed={collapsed}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* ---- Footer zone ---- */}
        <div className="mt-auto">
          {/* Subtle separator */}
          <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* Changelog + Feedback */}
          <div className="py-2">
            <Tooltip label="Changelog" show={collapsed}>
              <Link
                href="/dashboard/changelog"
                className={`
                  group relative flex items-center gap-3 mx-2 rounded-lg transition-all duration-200
                  ${collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"}
                  ${
                    pathname === "/dashboard/changelog"
                      ? "bg-accent/[0.08] text-accent"
                      : "text-content-secondary hover:bg-white/[0.04] hover:text-content-primary"
                  }
                `}
              >
                {pathname === "/dashboard/changelog" && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" />
                )}
                <FileText
                  size={19}
                  className="flex-shrink-0 text-accent drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                />
                <span
                  className={`font-medium text-[13.5px] whitespace-nowrap text-accent drop-shadow-[0_0_6px_rgba(16,185,129,0.5)] transition-all duration-300 overflow-hidden ${
                    collapsed
                      ? "max-w-0 opacity-0"
                      : "max-w-[180px] opacity-100"
                  }`}
                >
                  Changelog
                </span>
              </Link>
            </Tooltip>

            <Tooltip label="Review & Bug" show={collapsed}>
              <Link
                href="/dashboard/feedback"
                className={`
                  group relative flex items-center gap-3 mx-2 rounded-lg transition-all duration-200
                  ${collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2.5"}
                  ${
                    pathname === "/dashboard/feedback"
                      ? "bg-accent/[0.08] text-accent"
                      : "text-content-secondary hover:bg-white/[0.04] hover:text-content-primary"
                  }
                `}
              >
                {pathname === "/dashboard/feedback" && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" />
                )}
                <MessageSquare
                  size={19}
                  className={`flex-shrink-0 transition-transform duration-200 ${
                    pathname !== "/dashboard/feedback"
                      ? "group-hover:translate-x-[1px]"
                      : ""
                  }`}
                />
                <span
                  className={`font-medium text-[13.5px] whitespace-nowrap transition-all duration-300 overflow-hidden ${
                    collapsed
                      ? "max-w-0 opacity-0"
                      : "max-w-[180px] opacity-100"
                  }`}
                >
                  Review & Bug
                </span>
              </Link>
            </Tooltip>
          </div>

          {/* Subtle separator */}
          <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* User section + Settings */}
          <div className="py-3 px-2 space-y-1">
            {/* User identity row */}
            <Tooltip label={displayName} show={collapsed}>
              <Link
                href="/dashboard/settings"
                className={`
                  group relative flex items-center gap-3 rounded-lg transition-all duration-200
                  ${collapsed ? "px-0 py-2 justify-center" : "px-3 py-2"}
                  ${
                    pathname === "/dashboard/settings"
                      ? "bg-accent/[0.08]"
                      : "hover:bg-white/[0.04]"
                  }
                `}
              >
                {pathname === "/dashboard/settings" && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" />
                )}
                <UserInitials name={name} email={email} />
                <div
                  className={`min-w-0 transition-all duration-300 overflow-hidden ${
                    collapsed
                      ? "max-w-0 opacity-0"
                      : "max-w-[160px] opacity-100"
                  }`}
                >
                  <p className="text-[13px] font-medium text-content-primary truncate leading-tight">
                    {displayName}
                  </p>
                  {displayEmail && (
                    <p className="text-[11px] text-content-muted truncate leading-tight mt-0.5">
                      {displayEmail}
                    </p>
                  )}
                </div>
                {!collapsed && (
                  <Settings
                    size={15}
                    className="ml-auto flex-shrink-0 text-content-muted group-hover:text-content-secondary transition-colors"
                  />
                )}
              </Link>
            </Tooltip>

            {/* Collapse toggle */}
            <Tooltip label={collapsed ? "Expand" : "Collapse"} show={collapsed}>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className={`
                  flex items-center gap-3 rounded-lg w-full transition-all duration-200
                  text-content-muted hover:bg-white/[0.04] hover:text-content-secondary
                  ${collapsed ? "px-0 py-2 justify-center" : "px-3 py-2"}
                `}
              >
                {collapsed ? (
                  <ChevronRight size={18} className="flex-shrink-0" />
                ) : (
                  <>
                    <ChevronLeft size={18} className="flex-shrink-0" />
                    <span className="font-medium text-[13px] whitespace-nowrap">
                      Collapse
                    </span>
                  </>
                )}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </aside>
  );
}

// =========================================================================
// SIDEBAR — Mobile
// =========================================================================
function MobileSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { name, email } = useAuth();

  const displayName = name || email?.split("@")[0] || "User";
  const displayEmail = email || "";

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-gradient-to-b from-[#151515] to-[#101010] border-b border-white/[0.06] z-50 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-3.5 h-3.5 rounded-full bg-accent" />
            <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-accent/40 blur-[6px]" />
          </div>
          <span className="text-lg font-bold text-content-primary">Kal</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-content-secondary hover:text-content-primary transition-colors"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 z-50
          bg-gradient-to-b from-[#151515] to-[#101010]
          border-r border-white/[0.06]
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-14 flex items-center justify-between px-4">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5"
            >
              <div className="relative">
                <div className="w-3.5 h-3.5 rounded-full bg-accent" />
                <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-accent/40 blur-[6px]" />
              </div>
              <span className="text-lg font-bold text-content-primary">
                Kal
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 text-content-secondary hover:text-content-primary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Subtle separator */}
          <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* Navigation sections */}
          <nav className="flex-1 py-2 overflow-y-auto">
            {navSections.map((section) => (
              <div key={section.label}>
                <div className="px-4 pt-5 pb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-content-muted/70">
                    {section.label}
                  </span>
                </div>
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        group relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-all duration-200
                        ${
                          isActive
                            ? "bg-accent/[0.08] text-accent"
                            : "text-content-secondary hover:bg-white/[0.04] hover:text-content-primary"
                        }
                      `}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" />
                      )}
                      <Icon size={19} className="flex-shrink-0" />
                      <span className="font-medium text-[13.5px]">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="mt-auto">
            <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            {/* Changelog + Feedback */}
            <div className="py-2">
              <Link
                href="/dashboard/changelog"
                onClick={() => setMobileOpen(false)}
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-all duration-200
                  ${
                    pathname === "/dashboard/changelog"
                      ? "bg-accent/[0.08] text-accent"
                      : "text-content-secondary hover:bg-white/[0.04] hover:text-content-primary"
                  }
                `}
              >
                {pathname === "/dashboard/changelog" && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" />
                )}
                <FileText
                  size={19}
                  className="flex-shrink-0 text-accent drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                />
                <span className="font-medium text-[13.5px] text-accent drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]">
                  Changelog
                </span>
              </Link>

              <Link
                href="/dashboard/feedback"
                onClick={() => setMobileOpen(false)}
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-all duration-200
                  ${
                    pathname === "/dashboard/feedback"
                      ? "bg-accent/[0.08] text-accent"
                      : "text-content-secondary hover:bg-white/[0.04] hover:text-content-primary"
                  }
                `}
              >
                {pathname === "/dashboard/feedback" && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" />
                )}
                <MessageSquare size={19} className="flex-shrink-0" />
                <span className="font-medium text-[13.5px]">Review & Bug</span>
              </Link>
            </div>

            <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            {/* User section */}
            <div className="py-3 px-2 space-y-1">
              <Link
                href="/dashboard/settings"
                onClick={() => setMobileOpen(false)}
                className={`
                  group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                  ${
                    pathname === "/dashboard/settings"
                      ? "bg-accent/[0.08]"
                      : "hover:bg-white/[0.04]"
                  }
                `}
              >
                {pathname === "/dashboard/settings" && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" />
                )}
                <UserInitials name={name} email={email} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-content-primary truncate leading-tight">
                    {displayName}
                  </p>
                  {displayEmail && (
                    <p className="text-[11px] text-content-muted truncate leading-tight mt-0.5">
                      {displayEmail}
                    </p>
                  )}
                </div>
                <Settings
                  size={15}
                  className="flex-shrink-0 text-content-muted group-hover:text-content-secondary transition-colors"
                />
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// =========================================================================
// SIDEBAR — Export (switches between mobile / desktop)
// =========================================================================
export function Sidebar() {
  const { isMobile, isMounted } = useSidebarLayout();

  if (isMounted && isMobile) {
    return <MobileSidebar />;
  }

  return <DesktopSidebar />;
}

// =========================================================================
// Dashboard Layout wrapper
// =========================================================================
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isMobile, shouldAutoCollapse, isMounted } = useSidebarLayout();
  const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isMounted && !hasInitialized.current) {
      hasInitialized.current = true;
      setCollapsed(shouldAutoCollapse);
    }
  }, [isMounted, shouldAutoCollapse, setCollapsed]);

  // Determine margin - default to desktop (ml-64) for SSR
  const mainMargin =
    isMounted && isMobile ? "ml-0 pt-14" : collapsed ? "ml-16" : "ml-64";

  return (
    <div className="min-h-screen bg-dark">
      <Sidebar />
      <main
        className={`transition-[margin] duration-300 ease-in-out ${mainMargin}`}
      >
        <AnnouncementCarousel />
        {children}
      </main>
    </div>
  );
}
