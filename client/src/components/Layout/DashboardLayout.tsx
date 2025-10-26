import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getDefaultPageByRole } from "../../constants/menuItems";
import Header from "./Header";

import AdminDashboard from "../dashboards/AdminDashboard";

import { UserManagement } from "../page/UserManagement";
import { OrderManagement } from "../page/OrderManagement";
import { CreateOrder } from "../page/CreateOrder";
import { BranchManagement } from "../page/BranchManagement";
import { WeightSettings } from "../page/WeightSettings";
import { UserGroups } from "../page/UserGroup";
import { RegionsManagement } from "../page/RegionsManagement";
import { MyOrders } from "../page/MyOrders";
import { MyDeliveries } from "../page/MyDeliveries";
import { UserLookup } from "../page/UserLookup";
import { EmployeeDashboard } from "../dashboards/EmplyeeDashboard";
import { MerchantDashboard } from "../dashboards/MerchantDashboard";
import { DriverDashboard } from "../dashboards/DriverDashboard";
import Sidebar from "../Layout/Sidebar";
import { AddUser } from "./../page/AddUser";

const DashboardLayout: React.FC = () => {
	const { user, logout } = useAuth();

	const [currentPage, setCurrentPage] = useState(
		getDefaultPageByRole(user?.userType || "merchant")
	);

	const renderCurrentPage = () => {
		switch (currentPage) {
			case "admin-dashboard":
				return <AdminDashboard />;
			case "employee-dashboard":
				return <EmployeeDashboard />;
			case "merchant-dashboard":
				return <MerchantDashboard />;
			case "driver-dashboard":
				return <DriverDashboard />;

			case "user-management":
				return <UserManagement />;
			case "order-management":
				return <OrderManagement />;
			case "create-order":
				return <CreateOrder />;
			case "branch-management":
				return <BranchManagement />;
			case "weight-settings":
				return <WeightSettings />;
			case "user-groups":
				return <UserGroups />;
			case "regions-management":
				return <RegionsManagement />;
			case "add-user":
				return <AddUser />;
			case "my-orders":
				return <MyOrders />;
			case "my-deliveries":
				return <MyDeliveries />;
			case "user-lookup":
				return <UserLookup />;

			default:
				return <AdminDashboard />;
		}
	};

	if (!user) {
		logout();
		return null;
	}

	return (
		<div className="flex h-screen bg-gray-50" dir="rtl">
			<Sidebar
				userRole={user.userType}
				currentPage={currentPage}
				onPageChange={setCurrentPage}
			/>

			<div className="flex-1 flex flex-col overflow-hidden">
				<Header user={user} onLogout={logout} />

				<main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
					{renderCurrentPage()}
				</main>
			</div>
		</div>
	);
};

export default DashboardLayout;
