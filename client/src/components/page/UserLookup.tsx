import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export const UserLookup: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">استعلام عن مستخدم</h1>
    <Card>
      <CardHeader>
        <CardTitle>البحث عن المستخدمين</CardTitle>
      </CardHeader>
      <CardContent>
        <p>هنا يظهر نموذج البحث عن المستخدمين (قريباً)...</p>
      </CardContent>
    </Card>
  </div>
);