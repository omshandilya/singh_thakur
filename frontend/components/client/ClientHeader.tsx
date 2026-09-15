"use client";

import React from "react";
import Link from "next/link";
import { Menu, User } from "lucide-react";

interface ClientHeaderProps {
  onOpenMobile: () => void;
}

export function ClientHeader({ onOpenMobile }: ClientHeaderProps) {

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Today:
          </span>
          <span className="text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
            {formattedDate}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Client Status</span>
        </div>

        <Link
          href="/client/profile"
          className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <User className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Account Settings</span>
        </Link>
      </div>
    </header>
  );
}
