export interface User {
  _id: string;
  userType: 'admin' | 'employee' | 'merchant' | 'driver';
  fullName: string;
  email: string;
  phone: string;
  // أضف أي بيانات أخرى تحتاجها من الموديل
}

/**
 * نوع بيانات الـ Authentication Context
 */
export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

/**
 * نوع بيانات عنصر القائمة في Sidebar
 */
export interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * نوع بيانات Props للـ Sidebar
 */
export interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  userRole: User['userType'];
}

/**
 * نوع بيانات Props للـ Header
 */
export interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

/**
 * نوع بيانات استجابة API تسجيل الدخول
 */
export interface LoginResponse {
  status: string;
  token: string;
  data: {
    user: User;
  };
}

/**
 * نوع بيانات رسالة الخطأ
 */
export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}