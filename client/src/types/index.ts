export interface User {
	_id: string;
	userType: "admin" | "employee" | "merchant" | "courier";
	fullName: string;
	email: string;
	phone: string;
	username: string;
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
  onNavigate: (page: string) => void;
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


export interface OrderProduct {
  _id: string;
  productName: string;
  quantity: number;
  weight: number;
}

/**
 * نوع بيانات الطلب (كما يأتي من الباك إند)
 */
export interface Order {
  _id: string;
  orderType: string;
  customerName: string;
  customerPhone1: string;
  customerPhone2?: string;
  customerEmail?: string;
  governorate: string;
  city: string;
  village?: string;
  street: string;
  isVillageDelivery: boolean;
  shippingType: string;
  paymentType: string;
  branch: string;
  orderCost: number;
  totalWeight: number;
  notes?: string;
  products: OrderProduct[];
  createdBy: User; // اليوزر اللي أنشأ الطلب
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * نوع بيانات استجابة جلب الطلبات
 */
export interface GetOrdersResponse {
  status: string;
  results: number;
  data: {
    orders: Order[];
  };
}

/**
 * نوع بيانات استجابة إنشاء طلب
 */
export interface AddOrderResponse {
  status: string;
  message: string;
  data: {
    order: Order;
  };
}


// --- الإضافات الجديدة لإدارة المناطق ---

/**
 * نوع بيانات المحافظة (من الباك إند)
 */
export interface Governorate {
  _id: string;
  govName: string;
  govCode: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * نوع بيانات المدينة (من الباك إند)
 */
export interface City {
  _id: string;
  cityName: string;
  shippingCost: number;
  governorate: Governorate; // تم عمل Populate لها في الباك إند
  createdAt?: string;
  updatedAt?: string;
}

/**
 * نوع بيانات استجابة جلب المحافظات
 */
export interface GetGovernoratesResponse {
  status: string;
  results: number;
  data: Governorate[];
}

/**
 * نوع بيانات استجابة جلب المدن
 */
export interface GetCitiesResponse {
  status: string;
  results: number;
  data: City[];
}

/**
 * نوع بيانات استجابة إضافة محافظة أو مدينة
 */
export interface AddLocationResponse {
  status: string;
  message: string;
  data: Governorate | City;
}
