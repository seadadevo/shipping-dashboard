import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDefaultPageByRole } from '../../constants/menuItems';
import Header from './Header';

import AdminDashboard from '../dashboards/AdminDashboard';

import { UserManagement } from '../page/UserManagement';
import { OrderManagement } from '../page/OrderManagement';
import { CreateOrder } from '../page/CreateOrder';
import { BranchManagement } from '../page/BranchManagement';
import { WeightSettings } from '../page/WeightSettings';
import { UserGroups } from '../page/UserGroup';
import { RegionsManagement } from '../page/RegionsManagement';
import { MyOrders } from '../page/MyOrders';
import { MyDeliveries } from '../page/MyDeliveries';
import { UserLookup } from '../page/UserLookup';
import { EmployeeDashboard } from '../dashboards/EmplyeeDashboard';
import { MerchantDashboard } from '../dashboards/MerchantDashboard';
import { DriverDashboard } from '../dashboards/DriverDashboard';
import Sidebar from '../Layout/Sidebar';

// استيراد الصفحات


/**
 * مكون هيكل لوحة التحكم الرئيسي
 * يحتوي على Sidebar و Header والمحتوى الرئيسي
 */
const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  
  // حالة لتتبع الصفحة الحالية المعروضة
  const [currentPage, setCurrentPage] = useState(
    getDefaultPageByRole(user?.userType || 'merchant')
  );

  /**
   * دالة لعرض المكون المناسب بناءً على الصفحة الحالية
   */
  const renderCurrentPage = () => {
    switch (currentPage) {
      // لوحات التحكم
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'employee-dashboard':
        return <EmployeeDashboard />;
      case 'merchant-dashboard':
        return <MerchantDashboard />;
      case 'driver-dashboard':
        return <DriverDashboard />;

      // الصفحات
      case 'user-management':
        return <UserManagement />;
      case 'order-management':
        return <OrderManagement />;
      case 'create-order':
        return <CreateOrder />;
      case 'branch-management':
        return <BranchManagement />;
      case 'weight-settings':
        return <WeightSettings />;
      case 'user-groups':
        return <UserGroups />;
      case 'regions-management':
        return <RegionsManagement />;
      case 'my-orders':
        return <MyOrders />;
      case 'my-deliveries':
        return <MyDeliveries />;
      case 'user-lookup':
        return <UserLookup />;

      // الافتراضي
      default:
        return <AdminDashboard />;
    }
  };

  // حماية إضافية: إذا لم يكن هناك مستخدم، قم بتسجيل الخروج
  if (!user) {
    logout();
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50" dir="rtl">
      {/* القائمة الجانبية */}
      <Sidebar 
        userRole={user.userType}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      
      {/* منطقة المحتوى الرئيسية */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* رأس الصفحة */}
        <Header 
          user={user}
          onLogout={logout}
        />
        
        {/* محتوى الصفحة */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;