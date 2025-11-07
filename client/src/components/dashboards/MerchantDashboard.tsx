import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Package, 
  Plus, 
  CheckCircle, 
  Clock, 
  Truck,
  Eye,
  XCircle,
  AlertTriangle,
  Pause,
  RotateCcw,
  DollarSign,
  TrendingUp,
  Activity,
  Users
} from 'lucide-react';

// حالات الطلبات مع الألوان والأيقونات
const orderStatuses = [
  {
    id: 'new',
    name: 'الطلبات الجديدة',
    count: 12,
    icon: Package,
    color: 'bg-blue-100 text-blue-800',
    iconColor: 'text-blue-600'
  },
  {
    id: 'pending',
    name: 'قيد الانتظار',
    count: 8,
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
    iconColor: 'text-yellow-600'
  },
  {
    id: 'delivered_to_courier',
    name: 'تم التسليم للمندوب',
    count: 15,
    icon: Truck,
    color: 'bg-purple-100 text-purple-800',
    iconColor: 'text-purple-600'
  },
  {
    id: 'delivered',
    name: 'تم التسليم',
    count: 156,
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
    iconColor: 'text-green-600'
  },
  {
    id: 'unreachable',
    name: 'لا يمكن الوصول',
    count: 3,
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    iconColor: 'text-red-600'
  },
  {
    id: 'postponed',
    name: 'تم التأجيل',
    count: 5,
    icon: Pause,
    color: 'bg-gray-100 text-gray-800',
    iconColor: 'text-gray-600'
  },
  {
    id: 'partial_delivered',
    name: 'تم التسليم جزئياً',
    count: 2,
    icon: AlertTriangle,
    color: 'bg-orange-100 text-orange-800',
    iconColor: 'text-orange-600'
  },
  {
    id: 'cancelled_by_recipient',
    name: 'تم الإلغاء من قبل المستلم',
    count: 7,
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    iconColor: 'text-red-600'
  },
  {
    id: 'rejected_with_payment',
    name: 'تم الرفض مع الدفع',
    count: 4,
    icon: DollarSign,
    color: 'bg-green-100 text-green-800',
    iconColor: 'text-green-600'
  },
  {
    id: 'rejected_partial_payment',
    name: 'رفض مع سداد جزء',
    count: 2,
    icon: RotateCcw,
    color: 'bg-yellow-100 text-yellow-800',
    iconColor: 'text-yellow-600'
  },
  {
    id: 'rejected_no_payment',
    name: 'رفض ولم يتم الدفع',
    count: 6,
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    iconColor: 'text-red-600'
  }
];

const myOrders = [
  { 
    id: '#M2024-001', 
    recipient: 'سارة أحمد', 
    destination: 'الرياض، حي النخيل', 
    status: 'تم التسليم', 
    date: '2024-01-15',
    amount: '85 ريال'
  },
  { 
    id: '#M2024-002', 
    recipient: 'محمد عبدالله', 
    destination: 'جدة، حي الروضة', 
    status: 'تم التسليم للمندوب', 
    date: '2024-01-14',
    amount: '125 ريال'
  },
  { 
    id: '#M2024-003', 
    recipient: 'فاطمة سعد', 
    destination: 'الدمام، حي الشاطئ', 
    status: 'قيد الانتظار', 
    date: '2024-01-14',
    amount: '95 ريال'
  },
  { 
    id: '#M2024-004', 
    recipient: 'أحمد علي', 
    destination: 'المدينة المنورة، حي قباء', 
    status: 'تم التسليم', 
    date: '2024-01-13',
    amount: '110 ريال'
  },
  { 
    id: '#M2024-005', 
    recipient: 'نورا حسن', 
    destination: 'مكة المكرمة، حي العزيزية', 
    status: 'طلب جديد', 
    date: '2024-01-13',
    amount: '75 ريال'
  },
];

export function MerchantDashboard() {
  const getTotalOrders = () => orderStatuses.reduce((total, status) => total + status.count, 0);
  const getSuccessRate = () => {
    const delivered = orderStatuses.find(s => s.id === 'delivered')?.count || 0;
    const total = getTotalOrders();
    return total > 0 ? Math.round((delivered / total) * 100) : 0;
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'تم التسليم': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'تم التسليم للمندوب': return <Truck className="h-5 w-5 text-purple-600" />;
      case 'قيد الانتظار': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'طلب جديد': return <Package className="h-5 w-5 text-blue-600" />;
      default: return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'تم التسليم': return 'bg-green-100 text-green-800';
      case 'تم التسليم للمندوب': return 'bg-purple-100 text-purple-800';
      case 'قيد الانتظار': return 'bg-yellow-100 text-yellow-800';
      case 'طلب جديد': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>لوحة تحكم التاجر</h1>
          <p className="text-muted-foreground">
            متابعة شحناتك وإدارة طلباتك
          </p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          إنشاء طلب جديد
        </Button>
      </div>

      {/* إحصائيات عامة */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalOrders()}</div>
            <p className="text-xs text-muted-foreground">
              جميع الطلبات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{getSuccessRate()}%</div>
            <p className="text-xs text-muted-foreground">
              من إجمالي الطلبات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلبات النشطة</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orderStatuses.filter(s => 
                ['new', 'pending', 'delivered_to_courier'].includes(s.id)
              ).reduce((total, status) => total + status.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              قيد المعالجة والشحن
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18,450 ريال</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15%</span> من الشهر الماضي
            </p>
          </CardContent>
        </Card>
      </div>

      {/* تقرير حالات الطلبات */}
      <Card>
        <CardHeader>
          <CardTitle>تقرير حالات الطلبات</CardTitle>
          <CardDescription>
            عرض تفصيلي لجميع حالات الطلبات الحالية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {orderStatuses.map((status) => {
              const Icon = status.icon;
              return (
                <div key={status.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-full bg-gray-50`}>
                      <Icon className={`h-5 w-5 ${status.iconColor}`} />
                    </div>
                    <div className="text-2xl font-bold">{status.count}</div>
                  </div>
                  <h3 className="font-medium text-sm mb-1">{status.name}</h3>
                  <Badge variant="secondary" className={status.color}>
                    {status.count} طلب
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* إنشاء طلب جديد */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800">إنشاء طلب شحن جديد</CardTitle>
          <CardDescription className="text-orange-700">
            ابدأ بإنشاء طلب شحن جديد بخطوات بسيطة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" className="w-full bg-orange-600 hover:bg-orange-700">
            <Plus className="h-5 w-5 mr-2" />
            إنشاء طلب جديد
          </Button>
        </CardContent>
      </Card>

      {/* أحدث الطلبات */}
      <Card>
        <CardHeader>
          <CardTitle>أحدث طلباتي</CardTitle>
          <CardDescription>
            آخر 5 طلبات شحن قمت بإنشائها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-50">
                    {getOrderStatusIcon(order.status)}
                  </div>
                  <div>
                    <p className="font-medium">{order.recipient}</p>
                    <p className="text-sm text-muted-foreground">{order.destination}</p>
                    <p className="text-xs text-muted-foreground">رقم الطلب: {order.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="text-left">
                    <Badge className={getOrderStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <p className="text-sm font-medium mt-1">{order.amount}</p>
                    <p className="text-xs text-muted-foreground">{order.date}</p>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <Button variant="outline">عرض جميع الطلبات</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}