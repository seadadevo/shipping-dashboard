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
      courier: 'سائق',
    };
    return roleNames[role];
  };

  return (
    <div className=" w-64 flex flex-col h-full border-x border-border">

      {/* logo / system title */}
      <div className="p-6 flex justify-center ">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div>
            <h2 className="font-bold text-xl">Flash Line</h2>
          </div>
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
            <Package className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* menu items */}
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
                  ? ' text-blue-700 font-semibold'
                  : ' hover:bg-gray-200 hover:text-black'
              }`}
            >
              <Icon className={`h-5 w-5 ml-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* user info at the bottom */}
      <div className="w-full p-4 border-t border-border ">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center ml-2">
            <span className="text-xs text-black">
              {getRoleName(userRole).charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium ">
              {getRoleName(userRole)}
            </p>
            <p className="text-xs ">متصل الآن</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
