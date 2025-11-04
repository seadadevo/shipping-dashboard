import { 
  Home, Users, Package, Building, Weight, Shield, 
  MapPin, Plus, Truck 
} from 'lucide-react';
import type { MenuItem } from '../types';


export const adminMenuItems: MenuItem[] = [
  { id: 'admin-dashboard', label: 'لوحة التحكم', icon: Home },
  { id: 'order-management', label: 'إدارة الطلبات', icon: Package },
  { id: 'user-management', label: 'إدارة المستخدمين', icon: Users },
  { id: 'weight-settings', label: 'إعدادات الوزن والتكلفة', icon: Weight },
  { id: 'user-groups', label: 'المجموعات والأذونات', icon: Shield },
  { id: 'regions-management', label: 'إدارة المناطق', icon: MapPin },
];


export const merchantMenuItems: MenuItem[] = [
  { id: 'merchant-dashboard', label: 'لوحة التحكم', icon: Home },
  { id: 'create-order', label: 'إنشاء طلب جديد', icon: Plus },
  { id: 'my-orders', label: 'طلباتي', icon: Package },
];


export const employeeMenuItems: MenuItem[] = [
  { id: 'employee-dashboard', label: 'لوحة التحكم', icon: Home },
  { id: 'order-management', label: 'إدارة الطلبات', icon: Package },
  { id: 'create-order', label: 'إنشاء طلب جديد', icon: Plus }
];

export const driverMenuItems: MenuItem[] = [
  { id: 'driver-dashboard', label: 'لوحة التحكم', icon: Home },
  { id: 'my-deliveries', label: 'توصيلاتي', icon: Truck },
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