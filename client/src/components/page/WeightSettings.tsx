import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export const WeightSettings: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">إعدادات الوزن والتكلفة</h1>
    <Card>
      <CardHeader>
        <CardTitle>إعدادات التسعير</CardTitle>
      </CardHeader>
      <CardContent>
        <p>هنا تظهر إعدادات الوزن والتكلفة (قريباً)...</p>
      </CardContent>
    </Card>
  </div>
);