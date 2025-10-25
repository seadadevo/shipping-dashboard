// src/components/dashboards/DriverDashboard.tsx
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export const DriverDashboard: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">لوحة تحكم السائق</h1>
    <Card>
      <CardHeader>
        <CardTitle>التوصيلات المطلوبة</CardTitle>
      </CardHeader>
      <CardContent>
        <p>هنا تظهر قائمة التوصيلات المعينة للسائق...</p>
      </CardContent>
    </Card>
  </div>
);