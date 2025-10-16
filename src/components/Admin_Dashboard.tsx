import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const chartData = [
  { day: 'السبت', orders: 45 },
  { day: 'الأحد', orders: 52 },
  { day: 'الاثنين', orders: 38 },
  { day: 'الثلاثاء', orders: 67 },
  { day: 'الأربعاء', orders: 71 },
  { day: 'الخميس', orders: 58 },
  { day: 'الجمعة', orders: 43 },
];
const Admin_Dashboard = () => {
    
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>حجم الطلبات خلال الأسبوع</CardTitle>
            <CardDescription>
              إجمالي الطلبات المسجلة في آخر 7 أيام
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        </div>
  )
}

export default Admin_Dashboard
