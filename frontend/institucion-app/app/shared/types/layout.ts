import { ReactNode } from "react";

// ========================================
// Tipos de Navegación
// ========================================

/**
 * Representa un item de navegación en el menú
 */
export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  children?: NavItem[];
}

/**
 * Configuración de navegación para el layout
 */
export interface NavigationConfig {
  items: NavItem[];
  showInHeader?: boolean;
  showInSidebar?: boolean;
}

// ========================================
// Tipos de Componentes de Layout
// ========================================

/**
 * Props para el componente Header
 */
export interface HeaderProps {
  title: string;
  navigation: NavItem[];
  logo?: ReactNode;
  actions?: ReactNode;
  onToggleMobile?: () => void;
}

/**
 * Props para el componente Sidebar
 */
export interface SidebarProps {
  navigation: NavItem[];
  header?: ReactNode;
  footer?: ReactNode;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/**
 * Props para el componente Footer
 */
export interface FooterProps {
  companyName?: string;
  year?: number;
  links?: NavItem[];
  showSocial?: boolean;
}

/**
 * Props para el componente principal AppLayout
 */
export interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  navItems?: NavItem[];
  showSidebar?: boolean;
  showFooter?: boolean;
  showHeader?: boolean;
  companyName?: string;
  logo?: ReactNode;
  headerActions?: ReactNode;
}

// ========================================
// Tipos de Configuración de Módulos
// ========================================

/**
 * Configuración de un módulo de la aplicación
 */
export interface ModuleConfig {
  name: string;
  path: string;
  icon?: ReactNode;
  description?: string;
  permissions?: string[];
  navigation?: NavItem[];
}

/**
 * Configuración general del layout de la aplicación
 */
export interface LayoutConfig {
  title: string;
  companyName: string;
  modules: ModuleConfig[];
  showSidebar?: boolean;
  showFooter?: boolean;
  showHeader?: boolean;
  defaultNavigation?: NavItem[];
}

// ========================================
// Tipos de Tema y Estilos
// ========================================

/**
 * Opciones de tema para el layout
 */
export interface ThemeConfig {
  mode: "light" | "dark" | "auto";
  primaryColor?: string;
  accentColor?: string;
}

/**
 * Configuración de espaciado y dimensiones
 */
export interface LayoutDimensions {
  sidebarWidth?: string;
  headerHeight?: string;
  footerHeight?: string;
  contentMaxWidth?: string;
}
