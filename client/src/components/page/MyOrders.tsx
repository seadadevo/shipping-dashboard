import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export const MyOrders: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">طلباتي</h1>
    <Card>
      <CardHeader>
        <CardTitle>قائمة طلباتي</CardTitle>
      </CardHeader>
      <CardContent>
        <p>هنا تظهر قائمة طلبات التاجر (قريباً)...</p>
      </CardContent>
    </Card>
  </div>
);