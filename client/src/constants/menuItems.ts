import { 
  Home, Users, Package, Weight, 
  MapPin, Plus, Truck 
} from 'lucide-react';
import type { MenuItem } from '../types';


export const adminMenuItems: MenuItem[] = [
  { id: 'admin-dashboard', label: 'لوحة التحكم', icon: Home, path: '/admin-dashboard' },
  { id: 'order-management', label: 'إدارة الطلبات', icon: Package, path: '/order-management' },
  { id: 'user-management', label: 'إدارة المستخدمين', icon: Users, path: '/user-management' },
  { id: 'shipping-types', label: 'إعدادات أنواع الشحن', icon: Truck, path: '/shipping-types' },
  { id: 'weight-settings', label: 'إعدادات الوزن', icon: Weight, path: '/weight-settings' },
  { id: 'regions-management', label: 'إدارة المناطق', icon: MapPin, path: '/regions-management' },
];


export const merchantMenuItems: MenuItem[] = [
  { id: 'merchant-dashboard', label: 'لوحة التحكم', icon: Home, path: '/merchant-dashboard' },
  { id: 'create-order', label: 'إنشاء طلب جديد', icon: Plus, path: '/create-order' },
  { id: 'my-orders', label: 'طلباتي', icon: Package, path: '/my-orders' },
];


export const employeeMenuItems: MenuItem[] = [
  { id: 'employee-dashboard', label: 'لوحة التحكم', icon: Home, path: '/employee-dashboard' },
  { id: 'order-management', label: 'إدارة الطلبات', icon: Package, path: '/order-management' },
  { id: 'create-order', label: 'إنشاء طلب جديد', icon: Plus, path: '/create-order' }
];

export const driverMenuItems: MenuItem[] = [
  { id: 'courier-dashboard', label: 'لوحة التحكم', icon: Home, path: '/courier-dashboard' },
  { id: 'my-deliveries', label: 'توصيلاتي', icon: Truck, path: '/my-deliveries' },
];


export const getMenuItemsByRole = (
	userType: "admin" | "employee" | "merchant" | "courier"
): MenuItem[] => {
	switch (userType) {
		case "admin":
			return adminMenuItems;
		case "employee":
			return employeeMenuItems;
		case "merchant":
			return merchantMenuItems;
		case "courier":
			return driverMenuItems;
		default:
			return [];
	}
};


export const getDefaultPageByRole = (
	userType: "admin" | "employee" | "merchant" | "courier"
): string => {
	return `${userType}-dashboard`;
};