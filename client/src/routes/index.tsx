import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Login from "../components/Auth/Login";
import DashboardLayout from "../components/Layout/DashboardLayout";
import AdminDashboard from "../components/dashboards/AdminDashboard";
import { EmployeeDashboard } from "../components/dashboards/EmplyeeDashboard";
import { MerchantDashboard } from "../components/dashboards/MerchantDashboard";
import { DriverDashboard } from "../components/dashboards/DriverDashboard";
import { MyDeliveries } from "../components/page/MyDeliveries";
import { UserManagement } from "../components/page/UserManagement";
import { OrderManagement } from "../components/page/OrderManagement";
import { CreateOrder } from "../components/page/CreateOrder";
import { WeightSettings } from "../components/page/WeightSettings";
import { UserGroups } from "../components/page/UserGroup";
import { RegionsManagement } from "../components/page/RegionsManagement";
import { MyOrders } from "../components/page/MyOrders";
import { ShippingTypeManagement } from "../components/page/ShippingTypeManagement";
import { AddUser } from "../components/page/AddUser";
import { AccountSettings } from "../components/page/AccountSettings";
import DriverManagement from "../components/page/DriverManagement";
import AiMode from "../components/page/AiMode";

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Role-based route protection
const RoleProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.userType)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard Routes */}
        <Route
          index
          element={
            user?.userType === "courier" ? (
              <Navigate to="/driver-dashboard" replace />
            ) : (
              <Navigate to={`/${user?.userType}-dashboard`} replace />
            )
          }
        />

        <Route
          path="admin-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="employee-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["employee"]}>
              <EmployeeDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="merchant-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["merchant"]}>
              <MerchantDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="driver-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={["courier"]}>
              <DriverDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="my-deliveries"
          element={
            <RoleProtectedRoute allowedRoles={["courier"]}>
              <MyDeliveries />
            </RoleProtectedRoute>
          }
        />

        {/* Admin & Employee Routes */}
        <Route
          path="user-management"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <UserManagement />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="add-user"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AddUser />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="order-management"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "employee"]}>
              <OrderManagement />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="weight-settings"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <WeightSettings />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="user-groups"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <UserGroups />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="regions-management"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <RegionsManagement />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="driver-management"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <DriverManagement />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="shipping-types"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <ShippingTypeManagement />
            </RoleProtectedRoute>
          }
        />

        {/* Merchant & Employee Routes */}
        <Route
          path="create-order"
          element={
            <RoleProtectedRoute allowedRoles={["merchant", "employee"]}>
              <CreateOrder />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="my-orders"
          element={
            <RoleProtectedRoute allowedRoles={["merchant"]}>
              <MyOrders />
            </RoleProtectedRoute>
          }
        />

        <Route path="ai-mode" element={<AiMode />} />

        {/* Common Routes */}
        <Route path="account-settings" element={<AccountSettings />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
