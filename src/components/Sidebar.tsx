import { 
  Home, 
  Users, 
  Package, 
  Settings, 
  MapPin,
  Plus,
  BarChart3,
  Shield,
  Building,
  Weight
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: any) => void;
  userRole: 'admin' | 'merchant' | 'delivery' | 'employee';
}

 function Sidebar({ currentPage, onPageChange, userRole }: SidebarProps) {
  const adminMenuItems = [
    { id: 'admin-dashboard', label: 'لوحة التحكم', icon: Home },
    { id: 'order-management', label: 'إدارة الطلبات', icon: Package },
    { id: 'user-management', label: 'إدارة المستخدمين', icon: Users },
    { id: 'branch-management', label: 'إدارة الفروع', icon: Building },
    { id: 'weight-settings', label: 'إعدادات الوزن والتكلفة', icon: Weight },
    { id: 'user-groups', label: 'المجموعات والأذونات', icon: Shield },
    { id: 'regions-management', label: 'إدارة المناطق', icon: MapPin },
  ];

  const merchantMenuItems = [
    { id: 'merchant-dashboard', label: 'لوحة التحكم', icon: Home },
    { id: 'create-order', label: 'إنشاء طلب جديد', icon: Plus },
  ];

  const employeeMenuItems = [
    { id: 'employee-dashboard', label: 'لوحة التحكم', icon: Home },
    { id: 'order-management', label: 'إدارة الطلبات', icon: Package },
    { id: 'create-order', label: 'إنشاء طلب جديد', icon: Plus },
  ];

  const getMenuItems = () => {
    switch (userRole) {
      case 'admin':
        return adminMenuItems;
      case 'employee':
        return employeeMenuItems;
      case 'merchant':
        return merchantMenuItems;
      default:
        return merchantMenuItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="bg-white w-64 shadow-lg border-l border-gray-200 " >
      <div className="p-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">نظام الشحن</h2>
            <p className="text-sm text-gray-500">إدارة الشحنات</p>
          </div>
        </div>
      </div>

      <nav className="mt-6">
        <div className="px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-right mb-1 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-5 w-5 ml-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xs text-gray-600">م</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {userRole === 'admin' ? 'مدير النظام' : userRole === 'employee' ? 'موظف' : 'تاجر'}
            </p>
            <p className="text-xs text-gray-500">متصل الآن</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;