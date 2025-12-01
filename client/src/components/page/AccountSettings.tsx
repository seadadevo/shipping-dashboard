import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
// import Swal from 'sweetalert2'

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  userType: "admin" | "employee" | "merchant" | "courier";
}

interface PasswordFields {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

const API_URL = 'http://localhost:5000/api/users'; // العنوان الأساسي

export function AccountSettings() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [passwords, setPasswords] = useState<PasswordFields>({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async () => {
        const token = localStorage.getItem('token'); // الحصول على الرمز من التخزين المحلي
        if (!token) {
            setError('تسجيل الدخول مطلوب.');
            setIsLoading(false);
            return;
        }

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`, 
                },
            };
            
            const response = await axios.get(`${API_URL}/profile`, config);
            setProfile(response.data);
            setIsLoading(false);
        } catch (err: any) {
            const statusCode = err.response?.status;
            console.error("Failed to fetch profile. Status:", statusCode, "Error:", err.response?.data?.message);
            setError('فشل في تحميل بيانات الملف الشخصي. (Error: ' + statusCode + ')');
            setIsLoading(false);
            
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
if (passwords.newPassword.length < 8) {
    return setError('يجب أن تكون كلمة المرور الجديدة مكونة من 8 أحرف على الأقل.');
}
        if (passwords.newPassword !== passwords.confirmNewPassword) {
            return setError('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
        }

        const token = localStorage.getItem('token');
        if (!token) return setError('مطلوب المصادقة.');
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            
            await axios.put(`${API_URL}/password`, {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            }, config);
            
            Swal.fire({
            text: "تم تحديث كلمة المرور بنجاح!",
            icon: "success"
            });
            setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (err: any) {
            const errMsg = err.response?.data?.message || 'فشل في تحديث كلمة المرور.';
            setError(errMsg);
        }
    };

    if (isLoading) return <div>Loading Profile...</div>;
    if (error && !profile) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <h2>إعدادات الحساب</h2>

            {/* عرض معلومات المستخدم */}
            <Card>
                <CardHeader><CardTitle>بيانات المستخدم</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <p><strong>الاسم بالكامل:</strong> {profile?.fullName}</p>
                    <p><strong>البريد الإلكتروني:</strong> {profile?.email}</p>
                    <p><strong>الدور:</strong> <Badge>{profile?.userType}</Badge></p>
                </CardContent>
            </Card>

            {/* نموذج تعديل كلمة المرور */}
            <Card>
                <CardHeader><CardTitle>تعديل كلمة المرور</CardTitle></CardHeader>
                <CardContent>
                    {error && <div className="text-red-500 mb-4">{error}</div>}
                    {message && <div className="text-green-500 mb-4">{message}</div>}
                    
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                            <Input id="currentPassword" type="password" required 
                                value={passwords.currentPassword}
                                onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                            <Input id="newPassword" type="password" required 
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmNewPassword">تأكيد كلمة المرور الجديدة</Label>
                            <Input id="confirmNewPassword" type="password" required 
                                value={passwords.confirmNewPassword}
                                onChange={(e) => setPasswords({...passwords, confirmNewPassword: e.target.value})}
                            />
                        </div>
                        <Button type="submit">تحديث كلمة المرور</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}