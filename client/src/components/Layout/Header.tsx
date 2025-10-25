import React from 'react';
import { Search, Bell, LogOut } from 'lucide-react';

// استيراد مكونات shadcn/ui
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import type { HeaderProps, User } from '../../types';

/**
 * مكون رأس الصفحة (Header)
 * يحتوي على شريط البحث والإشعارات وقائمة المستخدم
 */
const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  /**
   * دالة لتحويل نوع الصلاحية إلى اسم بالعربية
   */
  const getRoleName = (role: User['userType'] | undefined): string => {
    if (!role) return 'مستخدم';
    
    const roleNames: Record<User['userType'], string> = {
      admin: 'مدير',
      employee: 'موظف',
      merchant: 'تاجر',
      driver: 'سائق',
    };
    return roleNames[role];
  };

  /**
   * دالة للحصول على الأحرف الأولى من الاسم
   */
  const getInitials = (name: string | undefined): string => {
    if (!name) return 'م';
    
    const parts = name.split(' ');
    if (parts.length > 1) {
      return parts[0].charAt(0) + parts[1].charAt(0);
    }
    return name.charAt(0);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 z-10">
      <div className="flex items-center justify-between">
        {/* شريط البحث */}
        <div className="flex items-center flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="البحث في النظام..." 
              className="pl-4 pr-10 w-96 text-right"
            />
          </div>
        </div>

        {/* عناصر التحكم */}
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* زر الإشعارات */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* قائمة المستخدم */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 space-x-reverse h-auto py-1 px-2">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getInitials(user?.fullName)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.fullName || 'المستخدم'}</p>
                  <p className="text-xs text-gray-500">{getRoleName(user?.userType)}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>حسابي</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                إعدادات الحساب
              </DropdownMenuItem>
              <DropdownMenuItem>
                المساعدة والدعم
              </DropdownMenuItem>
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
        </div>
      </div>
    </header>
  );
};

export default Header;