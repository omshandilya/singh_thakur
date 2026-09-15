"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  FileText,
  CalendarCheck,
  Receipt,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ClientSidebarProps {
  onCloseMobile?: () => void;
}

export function ClientSidebar({ onCloseMobile }: ClientSidebarProps) {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();

  const navItems = [
    {
      label: "Dashboard",
      href: "/client/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/client/dashboard",
      badge: null,
    },
    {
      label: "My Profile",
      href: "/client/profile",
      icon: User,
      active: pathname === "/client/profile",
      badge: null,
    },
    {
      label: "Documents",
      href: "/client/documents",
      icon: FileText,
      active: pathname.startsWith("/client/documents"),
      badge: null,
      disabled: false,
    },
    {
      label: "Tasks & Compliance",
      href: "#",
      icon: CalendarCheck,
      active: false,
      badge: "Soon",
      disabled: true,
    },
    {
      label: "Billing & Invoices",
      href: "#",
      icon: Receipt,
      active: false,
      badge: "Soon",
      disabled: true,
    },
  ];

  const getInitials = (name?: string | null, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "CL";
  };

  return (
    <aside className="w-64 h-full bg-slate-900 text-slate-200 flex flex-col justify-between border-r border-slate-800 select-none">
      {/* Top Section */}
      <div>
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800/80">
          <Link href="/client/dashboard" className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-amber-500 rounded-lg flex items-center justify-center text-slate-950 font-bold text-lg shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
              S&T
            </div>
            <div>
              <span className="block font-bold text-white text-base tracking-tight leading-tight">
                Singh & Thakur
              </span>
              <span className="block text-xs text-amber-400 font-medium tracking-wide">
                Client Portal
              </span>
            </div>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              if (item.disabled) {
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-400 cursor-not-allowed opacity-75"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-slate-400" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    item.active
                      ? "bg-amber-500 text-slate-950 font-semibold shadow-sm shadow-amber-500/10"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 ${
                        item.active ? "text-slate-950" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-amber-400 shrink-0">
            {getInitials(currentUser?.full_name, currentUser?.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">
              {currentUser?.full_name || "Client"}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {currentUser?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
            <ShieldCheck className="w-3 h-3" />
            Verified Client
          </span>
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded hover:bg-rose-950/30 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
