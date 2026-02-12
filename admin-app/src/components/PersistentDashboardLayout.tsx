"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import Image from "next/image";

interface PersistentDashboardLayoutProps {
  children: React.ReactNode;
}

// Routes that should show the sidebar
const DASHBOARD_ROUTES = [
  "/dashboard",
  "/tree",
  "/profile",
  "/organization",
  "/analytics",
  "/manage",
];

export function PersistentDashboardLayout({
  children,
}: PersistentDashboardLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mobileLogoError, setMobileLogoError] = useState(false);

  // Check if current route should show sidebar
  const shouldShowSidebar = DASHBOARD_ROUTES.some((route) =>
    pathname?.startsWith(route)
  );

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Sidebar Component - Persists across all dashboard routes */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="lg:pl-[280px] transition-all duration-150">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-150"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* Mobile Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                {!mobileLogoError ? (
                  <Image
                    src="/Logo.png"
                    alt="Smart Queue Logo"
                    width={32}
                    height={32}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      console.error("Mobile logo failed to load:", e);
                      setMobileLogoError(true);
                    }}
                    priority
                    unoptimized
                  />
                ) : (
                  <span className="text-primary-600 font-bold text-xs">SQ</span>
                )}
              </div>
              <span className="font-semibold text-base text-gray-900">
                Smart Queue
              </span>
            </div>
            <div className="w-10 h-10"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page Content */}
        <main className="transition-opacity duration-200">{children}</main>
      </div>
    </div>
  );
}
