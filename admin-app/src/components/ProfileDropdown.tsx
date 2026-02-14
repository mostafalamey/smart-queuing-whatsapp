"use client";

import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut } from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";

interface ProfileDropdownProps {
  userProfile: any;
  onEditProfile: () => void;
  onSignOut: () => void;
  variant?: "sidebar" | "titlebar";
}

export default function ProfileDropdown({
  userProfile,
  onEditProfile,
  onSignOut,
  variant = "sidebar",
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isTitlebar = variant === "titlebar";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEditProfile = () => {
    setIsOpen(false);
    onEditProfile();
  };

  const handleSignOutClick = () => {
    setIsOpen(false);
    setShowSignOutConfirm(true);
  };

  const handleConfirmSignOut = () => {
    onSignOut();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={
          isTitlebar
            ? "w-full flex items-center space-x-2 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors duration-150"
            : "w-full flex items-center space-x-6 p-3 rounded-xl bg-gray-700/50 border border-gray-600 hover:bg-gray-700 transition-colors duration-150"
        }
      >
        <div className="relative">
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt="Profile"
              className={
                isTitlebar
                  ? "w-9 h-9 rounded-md object-cover shadow-sm"
                  : "w-16 h-16 rounded-xl object-cover shadow-lg"
              }
            />
          ) : (
            <div
              className={
                isTitlebar
                  ? "w-9 h-9 bg-primary-500 rounded-md flex items-center justify-center shadow-sm"
                  : "w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg"
              }
            >
              <User
                className={
                  isTitlebar ? "w-4 h-4 text-white" : "w-8 h-8 text-white"
                }
              />
            </div>
          )}
          <div
            className={
              isTitlebar
                ? "absolute -bottom-1 -right-1 w-3 h-3 bg-success-400 rounded-full border-2 border-white"
                : "absolute -bottom-1 -right-1 w-4 h-4 bg-success-400 rounded-full border-2 border-gray-800"
            }
          ></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col items-start">
            <p
              className={
                isTitlebar
                  ? "text-gray-900 text-sm font-semibold truncate"
                  : "text-white text-sm font-semibold truncate"
              }
            >
              {userProfile?.name || "User"}
            </p>
            {!isTitlebar && (
              <span className="text-gray-400 text-xs capitalize bg-gray-700 px-2 py-1 rounded-md mt-1">
                {userProfile?.role || "Role"}
              </span>
            )}
            {!isTitlebar && (
              <p className="text-white/60 text-xs mt-2">
                {userProfile?.email || "user@example.com"}
              </p>
            )}
          </div>
        </div>
      </button>

      {isOpen && (
        <div
          className={
            isTitlebar
              ? "absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
              : "absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
          }
        >
          <button
            onClick={handleEditProfile}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors duration-150"
          >
            <Settings className="w-4 h-4" />
            Edit Profile
          </button>
          <button
            onClick={handleSignOutClick}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors duration-150"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleConfirmSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to log in again to access the admin dashboard."
        confirmText="Sign Out"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}
