"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Code, 
  Home, 
  Key, 
  LogOut, 
  Settings 
} from "react-feather";

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
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-dark">
      <SidebarWithState collapsed={collapsed} setCollapsed={setCollapsed} onSignOut={onSignOut} />
      <main
        className={`
          transition-all duration-300 ease-in-out
          ${collapsed ? "ml-16" : "ml-64"}
        `}
      >
        {children}
      </main>
    </div>
  );
}

function SidebarWithState({ 
  collapsed, 
  setCollapsed,
  onSignOut 
}: { 
  collapsed: boolean; 
  setCollapsed: (v: boolean) => void;
  onSignOut?: () => Promise<void>;
}) {
  const pathname = usePathname();

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
