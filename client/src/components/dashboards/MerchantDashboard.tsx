import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export const MerchantDashboard: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">لوحة تحكم التاجر</h1>
    <Card>
      <CardHeader>
        <CardTitle>ملخص طلباتي</CardTitle>
      </CardHeader>
      <CardContent>
        <p>هنا يظهر ملخص لطلبات التاجر...</p>
      </CardContent>
    </Card>
  </div>
);