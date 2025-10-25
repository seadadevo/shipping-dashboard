import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export const CreateOrder: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">إنشاء طلب جديد</h1>
    <Card>
      <CardHeader>
        <CardTitle>نموذج الطلب</CardTitle>
      </CardHeader>
      <CardContent>
        <p>هنا يظهر نموذج إنشاء طلب جديد (قريباً)...</p>
      </CardContent>
    </Card>
  </div>
);