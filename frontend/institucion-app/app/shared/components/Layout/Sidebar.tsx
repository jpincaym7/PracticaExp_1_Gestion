"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarProps } from "@/shared/types/layout";
import { X } from "lucide-react";

export default function Sidebar({ navigation, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const navLinks = navigation.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={onMobileClose}
      className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        pathname === item.href
          ? "bg-gray-100 text-gray-900"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {item.icon && <span className="mr-3">{item.icon}</span>}
      {item.label}
    </Link>
  ));

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden lg:block w-64 bg-white border-r min-h-[calc(100vh-73px)]">
        <nav className="p-4 space-y-1">{navLinks}</nav>
      </aside>

      {/* Overlay móvil */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={onMobileClose}
          />
          {/* Panel */}
          <aside className="relative z-50 w-64 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-16 border-b">
              <span className="font-semibold text-gray-900">Menú</span>
              <button
                onClick={onMobileClose}
                className="p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1 flex-1">{navLinks}</nav>
          </aside>
        </div>
      )}
    </>
  );
}
