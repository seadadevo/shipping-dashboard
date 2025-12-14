import React, { useState, useRef, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Header from "./Header";
import Sidebar from "../Layout/Sidebar";

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close the sidebar when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  if (!user) {
    logout();
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen" dir="rtl">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block">
        <Sidebar userRole={user.userType} />
      </div>

      {/* Sidebar Mobile Drawer */}
      {sidebarOpen && (
        <div
          className="fixed left-0 top-0 h-full z-50 lg:hidden"
          ref={sidebarRef}
        >
          <div className="h-full w-64 bg-background shadow-xl">
            <Sidebar 
              userRole={user.userType}
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          user={user}
          onLogout={logout}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
