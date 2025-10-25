import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export const MyDeliveries: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">توصيلاتي</h1>
    <Card>
      <CardHeader>
        <CardTitle>قائمة التوصيلات</CardTitle>
      </CardHeader>
      <CardContent>
        <p>هنا تظهر قائمة توصيلات السائق (قريباً)...</p>
      </CardContent>
    </Card>
  </div>
);