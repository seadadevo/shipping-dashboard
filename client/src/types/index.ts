/**
 * حالات الطلبات المسموحة
 */
export type OrderState = 'Pending' | 'Processing' | 'On the Way' | 'Delivered' | 'Cancelled';

/**
 * أدوار المستخدمين
 */
export type UserRole = 'admin' | 'employee' | 'merchant' | 'courier';

export interface User {
	_id: string;
	userType: UserRole;
	fullName: string;
	email: string;
	phone: string;
	username: string;
	assignedCities?: { governorate: string; city: string }[];
	isAvailable?: boolean;
	storeName?: string;
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
  path: string;
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
  orderNumber?: string;
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
  assignedDriver?: User | string; // Can be populated or just ID
  driverStatus?: 'pending' | 'picked-up' | 'in-transit' | 'delivered';
  stateHistory?: OrderStateHistory[];
  createdAt: string;
  updatedAt: string;
}

/**
 * نوع بيانات تاريخ حالات الطلب
 */
export interface OrderStateHistory {
  _id?: string;
  previousState?: string;
  newState: string;
  changedBy: User;
  changeReason?: string;
  changedAt: string;
}

/**
 * نوع بيانات طلب تغيير حالة الطلب
 */
export interface OrderStateChangeRequest {
  orderId: string;
  newState: OrderState;
  userRole: UserRole;
  userId: string;
  changeReason?: string;
} 

/**
 * نوع بيانات استجابة تغيير حالة الطلب
 */
export interface OrderStateChangeResponse {
  success: boolean;
  message: string;
  data?: {
    orderId: string;
    previousState: string;
    newState: string;
    stateHistory: string;
  };
  error?: string;
}
/**
 * نوع بيانات استجابة جلب الطلبات
 */
export interface GetOrdersResponse {
  status: string;
  results: number;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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
  isActive?: boolean;
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
  isActive?: boolean;
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
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: Governorate[];
}

/**
 * نوع بيانات استجابة جلب المدن
 */
export interface GetCitiesResponse {
  status: string;
  results: number;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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
