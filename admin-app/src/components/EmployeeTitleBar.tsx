'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, ChevronDown, RefreshCw, Building2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import ConfirmationModal from './ConfirmationModal';

// Custom event name for dashboard refresh
export const EMPLOYEE_REFRESH_EVENT = 'employee-dashboard-refresh';

export function EmployeeTitleBar() {
  const { userProfile, signOut } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEditProfile = () => {
    setIsDropdownOpen(false);
    router.push('/profile');
  };

  const handleSignOutClick = () => {
    setIsDropdownOpen(false);
    setShowSignOutConfirm(true);
  };

  const handleConfirmSignOut = () => {
    signOut();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Dispatch custom event for dashboard to listen to
    window.dispatchEvent(new CustomEvent(EMPLOYEE_REFRESH_EVENT));
    // Reset refreshing state after a short delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const organizationName = userProfile?.organization?.name || 'Organization';

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Organization Logo and Name */}
            <div className="flex items-center min-w-0 gap-3">
              {/* Organization Logo */}
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {userProfile?.organization?.logo_url ? (
                  <img
                    src={userProfile.organization.logo_url}
                    alt={organizationName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-100 rounded-lg flex items-center justify-center">
                    {userProfile?.organization?.name ? (
                      <span className="text-primary-600 font-semibold text-base">
                        {userProfile.organization.name.charAt(0)}
                      </span>
                    ) : (
                      <Building2 className="w-5 h-5 text-primary-600" />
                    )}
                  </div>
                )}
              </div>
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {organizationName}
              </h1>
            </div>

            {/* Right side: Refresh button + User Card */}
            <div className="flex items-center space-x-3">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                aria-label="Refresh dashboard"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* User Card Dropdown */}
              <div className="relative flex-shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center ring-2 ring-gray-100">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>

                {/* Name and Role - hidden on mobile */}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                    {userProfile?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userProfile?.role || 'Employee'}
                  </p>
                </div>

                {/* Chevron */}
                <ChevronDown 
                  className={`w-4 h-4 text-gray-500 transition-transform duration-150 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {userProfile?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {userProfile?.email || 'user@example.com'}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={handleEditProfile}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-150"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      Profile Settings
                    </button>
                    <button
                      onClick={handleSignOutClick}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors duration-150"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleConfirmSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to log in again to access the dashboard."
        confirmText="Sign Out"
        cancelText="Cancel"
        type="warning"
      />
    </>
  );
}
