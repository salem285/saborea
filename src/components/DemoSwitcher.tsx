"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";

export function DemoSwitcher() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const activeRole = pathname.startsWith("/cashier")
    ? "cashier"
    : pathname.startsWith("/admin")
      ? "admin"
      : "customer";

  const liftOnMobile =
    pathname.startsWith("/admin") || pathname.startsWith("/menu")
      ? "bottom-20 right-3 sm:bottom-5 sm:right-5"
      : "bottom-4 right-4 sm:bottom-5 sm:right-5";

  return (
    <div className={`fixed ${liftOnMobile} z-50 no-print`}>
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-1.5 rounded-full bg-[#FDFBF7]/95 backdrop-blur-md border border-[#C49A45] px-3.5 py-2 text-[12px] font-medium text-[#231F1E] shadow-[0_6px_20px_rgba(88,65,24,0.16)] hover:bg-[#F7EFE0] transition cursor-pointer"
          aria-label="Open Demo Switcher"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#B58938]" />
          <span className="capitalize">{activeRole}</span>
          <ChevronUp className="w-3.5 h-3.5 text-[#8B6A2B]" />
        </button>
      ) : (
        <div className="flex items-center gap-1 rounded-full bg-[#FDFBF7]/95 backdrop-blur-md border border-[#DECBA4] p-1 shadow-[0_8px_24px_rgba(88,65,24,0.16)]">
          <span className="hidden sm:inline-flex items-center gap-1 pl-2.5 pr-1 text-[11px] font-medium uppercase tracking-wider text-[#8B6A2B]">
            <Sparkles className="w-3 h-3 text-[#C49A45]" />
            Demo
          </span>
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition ${
              activeRole === "customer"
                ? "saborea-gold-btn text-white"
                : "text-[#6E655F] hover:text-[#231F1E] hover:bg-[#F3ECE0]"
            }`}
          >
            Customer
          </Link>
          <Link
            href="/cashier"
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition ${
              activeRole === "cashier"
                ? "saborea-gold-btn text-white"
                : "text-[#6E655F] hover:text-[#231F1E] hover:bg-[#F3ECE0]"
            }`}
          >
            Cashier
          </Link>
          <Link
            href="/admin"
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition ${
              activeRole === "admin"
                ? "saborea-gold-btn text-white"
                : "text-[#6E655F] hover:text-[#231F1E] hover:bg-[#F3ECE0]"
            }`}
          >
            Admin
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-full text-[#8B6A2B] hover:bg-[#F3ECE0] transition cursor-pointer"
            aria-label="Collapse Demo Switcher"
            title="Collapse"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
