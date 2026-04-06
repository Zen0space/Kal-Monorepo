"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  X,
} from "react-feather";

import { useSidebarLayout } from "@/hooks/useBreakpoint";

interface SidebarProps {
  onSignOut?: () => Promise<void>;
}

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
  { href: "/dashboard/logs", label: "Request Logs", icon: List },
  { href: "/dashboard/docs", label: "API Reference", icon: BookOpen },
  { href: "/dashboard/setup", label: "Setup", icon: Code },
  { href: "/dashboard/foods", label: "Food List", icon: Database },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function ApiVersionBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-accent/10 to-emerald-500/10 border-b border-accent/20">
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle size={18} className="text-accent flex-shrink-0" />
          <p className="text-sm text-content-primary">
            <span className="font-semibold">API v1 Migration:</span>{" "}
            <span className="text-content-secondary">
              API endpoints have moved to{" "}
              <code className="px-1.5 py-0.5 rounded bg-dark-elevated text-accent text-xs font-mono">
                /api/v1/*
              </code>
              . Update your base URL to continue using the API.
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/dashboard/setup"
            className="text-xs font-medium text-accent hover:text-accent/80 transition-colors"
          >
            View Guide
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-content-muted hover:text-content-primary transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ onSignOut }: SidebarProps) {
  const { isMobile, shouldAutoCollapse, isMounted } = useSidebarLayout();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const hasInitialized = useRef(false);

  // Only set initial collapse state once on mount
  useEffect(() => {
    if (isMounted && !hasInitialized.current) {
      hasInitialized.current = true;
      setCollapsed(shouldAutoCollapse);
    }
  }, [isMounted, shouldAutoCollapse]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Mobile: Show hamburger menu and overlay (only after hydration)
  if (isMounted && isMobile) {
    return (
      <>
        {/* Mobile Header Bar */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-dark-surface border-b border-dark-border z-50 flex items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-xl font-bold text-content-primary">Kal</span>
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-content-secondary hover:text-content-primary"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile Drawer */}
        <aside
          className={`
            fixed top-0 left-0 h-full w-72 bg-dark-surface border-r border-dark-border z-50
            transform transition-transform duration-300 ease-in-out
            ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-dark-border">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-xl font-bold text-content-primary">
                  Kal
                </span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-content-secondary hover:text-content-primary"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
                      ${
                        isActive
                          ? "bg-accent/10 text-accent border border-accent/30"
                          : "text-content-secondary hover:bg-dark-elevated hover:text-content-primary"
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Changelog */}
            <div className="border-t border-dark-border py-4">
              <Link
                href="/dashboard/changelog"
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
                  ${
                    pathname === "/dashboard/changelog"
                      ? "bg-accent/10 text-accent border border-accent/30"
                      : "text-content-secondary hover:bg-dark-elevated hover:text-content-primary"
                  }
                `}
              >
                <FileText
                  size={20}
                  className="text-accent drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                />
                <span className="font-medium text-accent drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]">
                  Changelog
                </span>
              </Link>
            </div>

            {/* Feedback */}
            <div className="border-t border-dark-border py-4">
              <Link
                href="/dashboard/feedback"
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
                  ${
                    pathname === "/dashboard/feedback"
                      ? "bg-accent/10 text-accent border border-accent/30"
                      : "text-content-secondary hover:bg-dark-elevated hover:text-content-primary"
                  }
                `}
              >
                <MessageSquare size={20} />
                <span className="font-medium">Review & Bug</span>
              </Link>
            </div>

            {/* Sign Out */}
            {onSignOut && (
              <div className="border-t border-dark-border py-4">
                <button
                  onClick={onSignOut}
                  className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
                    text-content-secondary hover:bg-dark-elevated hover:text-red-400
                    w-[calc(100%-1rem)]"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </aside>
      </>
    );
  }

  // Desktop/Tablet: Collapsible sidebar (default for SSR and non-mobile)
  return (
    <aside
      className={`
        fixed left-0 top-0 h-full bg-dark-surface border-r border-dark-border z-40
        transition-[width] duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-64"}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-dark-border">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-3 h-3 rounded-full bg-accent group-hover:scale-110 transition-transform flex-shrink-0" />
            {!collapsed && (
              <span className="text-xl font-bold text-content-primary whitespace-nowrap">
                Kal
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
                  ${
                    isActive
                      ? "bg-accent/10 text-accent border border-accent/30"
                      : "text-content-secondary hover:bg-dark-elevated hover:text-content-primary"
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Changelog */}
        <div className="border-t border-dark-border py-4">
          <Link
            href="/dashboard/changelog"
            className={`
              flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
              ${
                pathname === "/dashboard/changelog"
                  ? "bg-accent/10 text-accent border border-accent/30"
                  : "text-content-secondary hover:bg-dark-elevated hover:text-content-primary"
              }
            `}
            title={collapsed ? "Changelog" : undefined}
          >
            <FileText
              size={20}
              className="flex-shrink-0 text-accent drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]"
            />
            {!collapsed && (
              <span className="font-medium whitespace-nowrap text-accent drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]">
                Changelog
              </span>
            )}
          </Link>
        </div>

        {/* Feedback */}
        <div className="border-t border-dark-border py-4">
          <Link
            href="/dashboard/feedback"
            className={`
              flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
              ${
                pathname === "/dashboard/feedback"
                  ? "bg-accent/10 text-accent border border-accent/30"
                  : "text-content-secondary hover:bg-dark-elevated hover:text-content-primary"
              }
            `}
            title={collapsed ? "Review & Bug" : undefined}
          >
            <MessageSquare size={20} className="flex-shrink-0" />
            {!collapsed && (
              <span className="font-medium whitespace-nowrap">
                Review & Bug
              </span>
            )}
          </Link>
        </div>

        {/* Bottom actions */}
        <div className="border-t border-dark-border py-4">
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
                text-content-secondary hover:bg-dark-elevated hover:text-red-400
                w-[calc(100%-1rem)]"
              title={collapsed ? "Sign Out" : undefined}
            >
              <LogOut size={20} className="flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium whitespace-nowrap">Sign Out</span>
              )}
            </button>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
              text-content-muted hover:bg-dark-elevated hover:text-content-primary
              w-[calc(100%-1rem)]"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <ChevronRight size={20} className="flex-shrink-0" />
            ) : (
              <>
                <ChevronLeft size={20} className="flex-shrink-0" />
                <span className="font-medium whitespace-nowrap">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

export function DashboardLayout({
  children,
  onSignOut,
}: {
  children: React.ReactNode;
  onSignOut?: () => Promise<void>;
}) {
  const { isMobile, shouldAutoCollapse, isMounted } = useSidebarLayout();
  const [collapsed, setCollapsed] = useState(false);
  const hasInitialized = useRef(false);

  // Only set initial collapse state once on mount
  useEffect(() => {
    if (isMounted && !hasInitialized.current) {
      hasInitialized.current = true;
      setCollapsed(shouldAutoCollapse);
    }
  }, [isMounted, shouldAutoCollapse]);

  // Determine margin - default to desktop (ml-64) for SSR
  const mainMargin =
    isMounted && isMobile ? "ml-0 pt-16" : collapsed ? "ml-16" : "ml-64";

  return (
    <div className="min-h-screen bg-dark">
      <Sidebar onSignOut={onSignOut} />
      <main
        className={`transition-[margin] duration-300 ease-in-out ${mainMargin}`}
      >
        <ApiVersionBanner />
        {children}
      </main>
    </div>
  );
}
