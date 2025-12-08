import React from "react";
import { Package } from "lucide-react";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { AppRoutes } from "./routes";
import { Toaster } from "sonner";
import './App.css'

const AppContent: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-color-muted-foreground">
        <div className="flex flex-col items-center">
          <Package className="h-16 w-16 text-blue-600 animate-pulse" />
          <p className="text-foreground mt-4">جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }

  return <AppRoutes />;
};

const App: React.FC = () => {
  return (
    <AuthProvider dir="rtl">
      <AppContent />
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
};

export default App;
