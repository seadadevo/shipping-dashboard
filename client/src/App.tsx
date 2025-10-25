import React from "react";
import { LogIn, Package } from "lucide-react";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import DashboardLayout from "./components/Layout/DashboardLayout";
import Login from "../src/components/Auth/Login"
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <Package className="h-16 w-16 text-blue-600 animate-pulse" />
          <p className="text-gray-600 mt-4">جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }

  return user ? <DashboardLayout /> : <Login />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
