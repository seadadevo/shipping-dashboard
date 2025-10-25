import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export const BranchManagement: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">إدارة الفروع</h1>
    <Card>
      <CardHeader>
        <CardTitle>قائمة الفروع</CardTitle>
      </CardHeader>
      <CardContent>
        <p>هنا تظهر قائمة الفروع (قريباً)...</p>
      </CardContent>
    </Card>
  </div>
);