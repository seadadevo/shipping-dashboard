import React from 'react';
import { Package } from 'lucide-react';
import { getMenuItemsByRole } from '../../constants/menuItems';
import type { SidebarProps, User } from '../../types';

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, userRole }) => {

  const menuItems = getMenuItemsByRole(userRole);


  const getRoleName = (role: User['userType']): string => {
    const roleNames: Record<User['userType'], string> = {
      admin: 'مدير النظام',
      employee: 'موظف',
      merchant: 'تاجر',
      driver: 'سائق',
    };
    return roleNames[role];
  };

  return (
    <div className="bg-white w-64 shadow-lg border-l border-gray-200 flex flex-col h-full">
     
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

     
      <nav className="mt-6 flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-right transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className={`h-5 w-5 ml-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

    
      <div className="w-full p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xs text-gray-600">
              {getRoleName(userRole).charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {getRoleName(userRole)}
            </p>
            <p className="text-xs text-gray-500">متصل الآن</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;