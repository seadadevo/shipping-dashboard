import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { HeaderProps, User } from "../../types";
import { useTheme } from "../ui/theme-provider";

import AiButton from "../ui/AiButton";

interface HeaderWithSidebarProps extends HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderWithSidebarProps> = ({
  user,
  onLogout,
  onToggleSidebar,
}) => {
  const navigate = useNavigate();

  const getRoleName = (role: User["userType"] | undefined): string => {
    if (!role) return "مستخدم";
    const roleNames: Record<User["userType"], string> = {
      admin: "مدير",
      employee: "موظف",
      merchant: "تاجر",
      driver: "سائق",
    };
    return roleNames[role];
  };

  const getInitials = (name: string | undefined): string => {
    if (!name) return "م";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return parts[0].charAt(0) + parts[1].charAt(0);
    }
    return name.charAt(0);
  };

  const { theme } = useTheme();

  return (
    <header className="bg-background shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 max-w-lg">
          <img
            src={theme === "dark" ? "/dark-logo.png" : "/light-logo.png"}
            className="w-20"
            alt="flash line logo"
          />
        </div>

        <div className="flex items-center space-x-4 space-x-reverse">
          <AiButton />

          {/* dark mode toggle */}
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 space-x-reverse h-auto py-1 px-2 m-0"
              >
                {/* initials circle */}
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getInitials(user?.fullName)}
                  </span>
                </div>

                {/* name & role in L-screen */}
                <div className="text-right hidden sm:flex flex-col">
                  <p className="text-sm font-medium">
                    {user?.fullName || "المستخدم"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRoleName(user?.userType)}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>حسابي</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/account-settings")}>
                إعدادات الحساب
              </DropdownMenuItem>
              <DropdownMenuItem>المساعدة والدعم</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* menu button for small screens */}
          <button
            className="lg:hidden p-2 rounded-md hover:bg-muted-foreground"
            onClick={onToggleSidebar}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
