"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderProps } from "@/shared/types/layout";
import { GraduationCap, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export default function Header({ title, navigation, onToggleMobile }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y Título */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground leading-tight">
                {title}
              </h1>
              <p className="text-xs text-muted-foreground">Sistema de Gestión Académica</p>
            </div>
          </div>

          {/* Navegación */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.icon && (
                    <span className={cn(
                      "transition-transform duration-200",
                      isActive && "scale-110"
                    )}>
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Menú móvil */}
          <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-foreground" onClick={onToggleMobile}>
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
