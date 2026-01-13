"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart3,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'App Users', href: '/users', icon: Users },
  { name: 'Platform Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] h-screen bg-card border-r flex flex-col fixed left-0 top-0 z-50 transition-all duration-300">
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <div className="w-8 h-8 bg-foreground rounded-lg"></div>
        <span className="text-xl font-bold tracking-tight text-foreground">Kal Admin</span>
      </div>
      
      <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md shadow-primary/25" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground">
          SA
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">Super Admin</span>
          <span className="text-xs text-muted-foreground">Administrator</span>
        </div>
        <Button variant="ghost" size="icon" className="ml-auto text-muted-foreground">
          <LogOut size={16} />
        </Button>
      </div>
    </aside>
  );
}
