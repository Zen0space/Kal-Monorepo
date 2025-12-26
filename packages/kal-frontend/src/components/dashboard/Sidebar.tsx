"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Code, 
  Home, 
  Key, 
  LogOut, 
  Menu,
  Settings,
  X
} from "react-feather";

import { useSidebarLayout } from "@/hooks/useBreakpoint";

interface SidebarProps {
  onSignOut?: () => Promise<void>;
}

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
  { href: "/dashboard/setup", label: "Setup", icon: Code },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ onSignOut }: SidebarProps) {
  const { isMobile, shouldAutoCollapse, isMounted } = useSidebarLayout();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Auto-collapse on tablet, auto-close on mobile when navigating
  useEffect(() => {
    if (isMounted && shouldAutoCollapse) {
      setCollapsed(true);
    }
    // Close mobile menu when route changes
    setMobileOpen(false);
  }, [pathname, shouldAutoCollapse, isMounted]);

  // Update collapsed state when breakpoint changes
  useEffect(() => {
    if (isMounted) {
      setCollapsed(shouldAutoCollapse);
    }
  }, [shouldAutoCollapse, isMounted]);

  // Mobile: Show hamburger menu and overlay (only after hydration)
  if (isMounted && isMobile) {
    return (
      <>
        {/* Mobile Header Bar */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-dark-surface border-b border-dark-border z-50 flex items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
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
              <Link href="/" className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-xl font-bold text-content-primary">Kal</span>
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
                      transition-all duration-200
                      ${isActive 
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

            {/* Sign Out */}
            {onSignOut && (
              <div className="border-t border-dark-border py-4">
                <button
                  onClick={onSignOut}
                  className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
                    text-content-secondary hover:bg-dark-elevated hover:text-red-400
                    transition-all duration-200 w-[calc(100%-1rem)]"
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
        fixed left-0 top-0 h-full bg-dark-surface border-r border-dark-border
        transition-all duration-300 ease-in-out z-40
        ${collapsed ? "w-16" : "w-64"}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-dark-border">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-3 h-3 rounded-full bg-accent group-hover:scale-110 transition-transform flex-shrink-0" />
            {!collapsed && (
              <span className="text-xl font-bold text-content-primary">Kal</span>
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
                  transition-all duration-200
                  ${isActive 
                    ? "bg-accent/10 text-accent border border-accent/30" 
                    : "text-content-secondary hover:bg-dark-elevated hover:text-content-primary"
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-dark-border py-4">
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
                text-content-secondary hover:bg-dark-elevated hover:text-red-400
                transition-all duration-200 w-[calc(100%-1rem)]"
              title={collapsed ? "Sign Out" : undefined}
            >
              <LogOut size={20} className="flex-shrink-0" />
              {!collapsed && <span className="font-medium">Sign Out</span>}
            </button>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
              text-content-muted hover:bg-dark-elevated hover:text-content-primary
              transition-all duration-200 w-[calc(100%-1rem)]"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <ChevronRight size={20} className="flex-shrink-0" />
            ) : (
              <>
                <ChevronLeft size={20} className="flex-shrink-0" />
                <span className="font-medium">Collapse</span>
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
  onSignOut
}: { 
  children: React.ReactNode;
  onSignOut?: () => Promise<void>;
}) {
  const { isMobile, shouldAutoCollapse, isMounted } = useSidebarLayout();
  const [collapsed, setCollapsed] = useState(false);

  // Sync collapse state with breakpoint
  useEffect(() => {
    if (isMounted) {
      setCollapsed(shouldAutoCollapse);
    }
  }, [shouldAutoCollapse, isMounted]);

  // Determine margin - default to desktop (ml-64) for SSR
  const mainMargin = isMounted && isMobile 
    ? "ml-0 pt-16" 
    : collapsed 
      ? "ml-16" 
      : "ml-64";

  return (
    <div className="min-h-screen bg-dark">
      <Sidebar onSignOut={onSignOut} />
      <main
        className={`
          transition-all duration-300 ease-in-out
          ${mainMargin}
        `}
      >
        {children}
      </main>
    </div>
  );
}
