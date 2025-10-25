import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export const EmployeeDashboard: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">لوحة تحكم الموظف</h1>
    <Card>
      <CardHeader>
        <CardTitle>مهام اليوم</CardTitle>
      </CardHeader>
      <CardContent>
        <p>هنا تظهر المهام الموكلة للموظف...</p>
      </CardContent>
    </Card>
  </div>
);
