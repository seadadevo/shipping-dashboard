import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export const RegionsManagement: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">إدارة المناطق</h1>
    <Card>
      <CardHeader>
        <CardTitle>قائمة المناطق</CardTitle>
      </CardHeader>
      <CardContent>
        <p>هنا تظهر قائمة المناطق (قريباً)...</p>
      </CardContent>
    </Card>
  </div>
);