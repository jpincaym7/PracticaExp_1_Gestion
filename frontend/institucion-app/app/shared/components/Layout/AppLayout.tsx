"use client";

import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { AppLayoutProps, NavItem } from "@/shared/types/layout";
import { ToastProvider } from "@/shared/components/toast";

export default function AppLayout({
  children,
  title = "Sistema de Gestión",
  navItems = [],
  showSidebar = true,
  showFooter = true,
  companyName = "Sistema de Gestión",
}: AppLayoutProps) {
  const defaultNavItems: NavItem[] = [
    { label: "Inicio", href: "/" },
    { label: "Registros", href: "/records" },
    { label: "Configuración", href: "/settings" },
  ];

  const navigation = navItems.length > 0 ? navItems : defaultNavItems;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <Header title={title} navigation={navigation} onToggleMobile={() => setMobileOpen((prev) => !prev)} />

        <div className="flex">
          {/* Sidebar (opcional) */}
          {showSidebar && <Sidebar navigation={navigation} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />}

          {/* Contenido Principal */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>

        {/* Footer (opcional) */}
        {showFooter && <Footer companyName={companyName} />}
      </div>
    </ToastProvider>
  );
}
