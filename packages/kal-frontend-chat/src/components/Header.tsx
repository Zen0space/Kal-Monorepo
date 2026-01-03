"use client";

import { LogIn, LogOut, Menu } from "react-feather";
import { trpc } from "@/lib/trpc";

interface HeaderProps {
  user?: {
    name?: string;
    email?: string;
  } | null;
  isAuthenticated: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onMenuToggle?: () => void;
}

export function Header({ user, isAuthenticated, onSignIn, onSignOut, onMenuToggle }: HeaderProps) {
  const { data: userInfo, isLoading } = trpc.apiKeys.getMe.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const displayName = userInfo?.name || user?.name || user?.email || "User";
  const displayInitial = (displayName[0] || "U").toUpperCase();

  return (
    <header className="h-16 bg-dark-surface border-b border-dark-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-2">
        {/* Mobile menu toggle */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 text-content-secondary hover:text-content-primary hover:bg-white/5 rounded-lg transition-colors mr-1"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="w-3 h-3 rounded-full bg-accent" />
        <span className="text-xl font-bold text-content-primary">Kal AI</span>
      </div>
      
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent-muted flex items-center justify-center text-white text-xs font-bold">
                {isLoading ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  displayInitial
                )}
              </div>
              <span className="text-sm text-content-secondary">
                {isLoading ? "..." : displayName}
              </span>
            </div>
            <button
              onClick={onSignOut}
              className="p-2 text-content-secondary hover:text-content-primary hover:bg-dark-elevated rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            onClick={onSignIn}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors font-medium text-sm"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
