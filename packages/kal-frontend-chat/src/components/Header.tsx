"use client";

import { LogIn, LogOut, User } from "react-feather";

interface HeaderProps {
  user?: {
    name?: string;
    email?: string;
  } | null;
  isAuthenticated: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function Header({ user, isAuthenticated, onSignIn, onSignOut }: HeaderProps) {
  return (
    <header className="h-14 border-b border-dark-border flex items-center justify-between px-4">
      <h1 className="text-lg font-semibold text-content-primary flex items-center gap-2">
        <span className="text-accent">🍃</span> Kalori Chat
      </h1>
      
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-2 text-sm text-content-secondary">
              <User className="w-4 h-4" />
              <span>{user?.name || user?.email || "User"}</span>
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-content-secondary hover:text-content-primary hover:bg-dark-elevated rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
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
