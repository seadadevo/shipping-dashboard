
import React, { useState } from 'react';
import { Package, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';


// استيراد مكونات shadcn/ui
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { ApiError, LoginResponse } from '../../types';

/**
 * مكون صفحة تسجيل الدخول
 */
const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  /**
   * معالج إرسال نموذج تسجيل الدخول
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // استدعاء API تسجيل الدخول
      const response = await api.post<LoginResponse>("/api/v1/auth/login", {
        email,
        password,
      });

      // الباك إند يرجع: { status, token, data: { user } }
      const { user, token } = response.data.data;
      
      // استدعاء دالة login من الـ Context لحفظ البيانات
      login(user, token);
      
      // (لا حاجة للتوجيه، الـ App component سيتولى ذلك)

    } catch (err) {
      setLoading(false);
      const error = err as ApiError;
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.");
      }
      console.error(err);
    }
    // (لا تقم بـ setLoading(false) عند النجاح لأن الصفحة ستتغير)
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Package className="h-12 w-12 text-blue-600 mx-auto" />
          <CardTitle className="text-2xl font-bold mt-4">نظام الشحن</CardTitle>
          <CardDescription>تسجيل الدخول إلى لوحة التحكم</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* حقل البريد الإلكتروني */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pr-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* حقل كلمة المرور */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  className="pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 ml-2" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* زر تسجيل الدخول */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "جاري التحقق..." : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;