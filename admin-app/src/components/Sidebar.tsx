"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { getAllowedNavigation } from "@/lib/roleUtils";
import Image from "next/image";
import ProfileDropdown from "./ProfileDropdown";
import {
  LayoutDashboard,
  Building2,
  User,
  LogOut,
  X,
  GitBranch,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    route: "dashboard",
  },
  {
    name: "Organization",
    href: "/organization",
    icon: Building2,
    route: "organization",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    route: "analytics",
  },
  {
    name: "Department Structure",
    href: "/tree",
    icon: GitBranch,
    route: "tree",
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { userProfile, signOut } = useAuth();
  const { userRole } = useRolePermissions();
  const pathname = usePathname();
  const router = useRouter();
  const [logoError, setLogoError] = useState(false);

  // Filter navigation items based on user role
  const allowedRoutes = getAllowedNavigation(userRole);
  const filteredNavigationItems = navigationItems.filter((item) =>
    allowedRoutes.includes(item.route)
  );

  const handleEditProfile = () => {
    router.push("/profile");
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] bg-slate-800 transform transition-transform duration-150 ease-out shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm">
                {!logoError ? (
                  <Image
                    src="/Logo.png"
                    alt="Smart Queue Logo"
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain p-1"
                    onError={(e) => {
                      console.error("Logo failed to load:", e);
                      setLogoError(true);
                    }}
                    priority
                    unoptimized
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-primary-500 rounded-lg text-white font-bold text-sm">
                    SQ
                  </div>
                )}
              </div>
              <div>
                <div className="font-semibold text-lg text-white">
                  Smart Queue
                </div>
                <div className="text-white/60 text-xs">
                  Admin Portal
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors duration-150"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Organization Badge */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-3 bg-white/5 rounded-lg p-3 border border-white/10">
              {/* Organization Logo */}
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {userProfile?.organization?.logo_url ? (
                  <img
                    src={userProfile.organization.logo_url}
                    alt="Organization Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-500 rounded-lg flex items-center justify-center text-white text-base font-semibold">
                    {userProfile?.organization?.name?.charAt(0) || "O"}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white truncate">
                  {userProfile?.organization?.name || "Organization"}
                </div>
                <div className="text-white/50 text-xs">Active workspace</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="mb-2">
              <h3 className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3 px-3">
                Navigation
              </h3>
              <ul className="space-y-1">
                {filteredNavigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "nav-item",
                          isActive && "active"
                        )}
                        onClick={onClose}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-white/10">
            <ProfileDropdown
              userProfile={userProfile}
              onEditProfile={handleEditProfile}
              onSignOut={signOut}
            />
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
