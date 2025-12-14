import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export const UserGroups: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">المجموعات والأذونات</h1>
    <Card>
      <CardHeader>
        <CardTitle>إدارة الصلاحيات</CardTitle>
      </CardHeader>
      <CardContent>
        <p>هنا تظهر المجموعات والأذونات (قريباً)...</p>
      </CardContent>
    </Card>
  </div>
);