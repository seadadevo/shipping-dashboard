import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export const UserManagement: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
    <Card>
      <CardHeader>
        <CardTitle>قائمة المستخدمين</CardTitle>
      </CardHeader>
      <CardContent>
        <p>هنا تظهر قائمة المستخدمين (قريباً)...</p>
      </CardContent>
    </Card>
  </div>
);