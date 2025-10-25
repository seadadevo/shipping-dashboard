import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export const OrderManagement: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">إدارة الطلبات</h1>
    <Card>
      <CardHeader>
        <CardTitle>قائمة الطلبات</CardTitle>
      </CardHeader>
      <CardContent>
        <p>هنا تظهر قائمة الطلبات (قريباً)...</p>
      </CardContent>
    </Card>
  </div>
);