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
  Users,
  Phone,
  MapPin
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

// حالات الطلبات مع الألوان والأيقونات
const orderStatuses = [
  {
    id: 'new',
    name: 'الطلبات الجديدة',
    count: 18,
    icon: Package,
    color: 'bg-blue-100 text-blue-800',
    iconColor: 'text-blue-600'
  },
  {
    id: 'pending',
    name: 'قيد الانتظار',
    count: 12,
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
    iconColor: 'text-yellow-600'
  },
  {
    id: 'delivered_to_courier',
    name: 'تم التسليم للمندوب',
    count: 25,
    icon: Truck,
    color: 'bg-purple-100 text-purple-800',
    iconColor: 'text-purple-600'
  },
  {
    id: 'delivered',
    name: 'تم التسليم',
    count: 342,
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
    iconColor: 'text-green-600'
  },
  {
    id: 'unreachable',
    name: 'لا يمكن الوصول',
    count: 8,
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    iconColor: 'text-red-600'
  },
  {
    id: 'postponed',
    name: 'تم التأجيل',
    count: 11,
    icon: Pause,
    color: 'bg-gray-100 text-gray-800',
    iconColor: 'text-gray-600'
  },
  {
    id: 'partial_delivered',
    name: 'تم التسليم جزئياً',
    count: 5,
    icon: AlertTriangle,
    color: 'bg-orange-100 text-orange-800',
    iconColor: 'text-orange-600'
  },
  {
    id: 'cancelled_by_recipient',
    name: 'تم الإلغاء من قبل المستلم',
    count: 14,
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    iconColor: 'text-red-600'
  },
  {
    id: 'rejected_with_payment',
    name: 'تم الرفض مع الدفع',
    count: 9,
    icon: DollarSign,
    color: 'bg-green-100 text-green-800',
    iconColor: 'text-green-600'
  },
  {
    id: 'rejected_partial_payment',
    name: 'رفض مع سداد جزء',
    count: 4,
    icon: RotateCcw,
    color: 'bg-yellow-100 text-yellow-800',
    iconColor: 'text-yellow-600'
  },
  {
    id: 'rejected_no_payment',
    name: 'رفض ولم يتم الدفع',
    count: 13,
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    iconColor: 'text-red-600'
  }
];

const recentOrders = [
  { 
    id: '#E2024-001', 
    merchant: 'متجر الأزياء الحديثة',
    recipient: 'سارة أحمد', 
    destination: 'القاهرة، وسط المدينة', 
    status: 'تم التسليم', 
    date: '2024-01-15',
    amount: '85 جنيه',
    phone: '01512345678'
  },
  { 
    id: '#E2024-002', 
    merchant: 'متجر الإلكترونيات',
    recipient: 'محمد عبدالله', 
    destination: 'الإسكندرية، حي المنتزه', 
    status: 'تم التسليم للمندوب', 
    date: '2024-01-14',
    amount: '125 جنيه',
    phone: '01598765432'
  },
  { 
    id: '#E2024-003', 
    merchant: 'متجر المنزل والحديقة',
    recipient: 'فاطمة سعد', 
    destination: 'الجيزة، حي الهرم', 
    status: 'قيد الانتظار', 
    date: '2024-01-14',
    amount: '95 جنيه',
    phone: '01112345678'
  },
  { 
    id: '#E2024-004', 
    merchant: 'مكتبة المعرفة',
    recipient: 'أحمد علي', 
    destination: 'القليوبية، شبرا الخيمة', 
    status: 'تم التسليم', 
    date: '2024-01-13',
    amount: '110 جنيه',
    phone: '01118138288'
  },
  { 
    id: '#E2024-005', 
    merchant: 'متجر التوحيد للملابس',
    recipient: 'نورا حسن', 
    destination: 'المنوفيه ، حي السلام', 
    status: 'طلب جديد', 
    date: '2024-01-13',
    amount: '75 جنيه',
    phone: '01155667788'
  },
];

export function EmployeeDashboard() {
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
          <h1>لوحة تحكم الموظف</h1>
          <p className="text-muted-foreground">
            متابعة ومعالجة طلبات الشحن
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          معالجة طلب جديد
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
            <CardTitle className="text-sm font-medium">طلبات تحتاج معالجة</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {orderStatuses.filter(s => 
                ['new', 'pending', 'unreachable', 'postponed'].includes(s.id)
              ).reduce((total, status) => total + status.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              تحتاج تدخل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التجار النشطين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">
              تاجر نشط اليوم
            </p>
          </CardContent>
        </Card>
      </div>

      {/* تقرير حالات الطلبات */}
      <Card>
        <CardHeader>
          <CardTitle>تقرير حالات الطلبات</CardTitle>
          <CardDescription>
            عرض تفصيلي لجميع حالات الطلبات الحالية في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {orderStatuses.map((status) => {
              const Icon = status.icon;
              return (
                <div key={status.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
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

      {/* الطلبات الحديثة */}
      <Card>
        <CardHeader>
          <CardTitle>الطلبات الحديثة</CardTitle>
          <CardDescription>
            آخر الطلبات المدخلة في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary transition-colors">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="h-10 w-10 ml-3 rounded-full flex items-center justify-center bg-gray-50">
                    {getOrderStatusIcon(order.status)}
                  </div>
                  <div>
                    <p className="font-medium">{order.recipient}</p>
                    <p className="text-sm text-blue-600">{order.merchant}</p>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {order.destination}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <span>رقم الطلب: {order.id}</span>
                      <span className="mx-2">•</span>
                      <Phone className="h-3 w-3 mr-1" />
                      {order.phone}
                    </div>
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

      {/* إجراءات سريعة */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">معالجة الطلبات الجديدة</CardTitle>
            <CardDescription className="text-blue-700">
              ابدأ بمعالجة الطلبات الجديدة التي تحتاج تأكيد
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
              <Package className="h-5 w-5 mr-2" />
              معالجة {orderStatuses.find(s => s.id === 'new')?.count} طلب جديد
            </Button>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">متابعة الطلبات المعلقة</CardTitle>
            <CardDescription className="text-orange-700">
              مراجعة الطلبات التي تحتاج متابعة خاصة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="w-full bg-orange-600 hover:bg-orange-700">
              <AlertTriangle className="h-5 w-5 mr-2" />
              متابعة {orderStatuses.filter(s => 
                ['unreachable', 'postponed', 'partial_delivered'].includes(s.id)
              ).reduce((total, status) => total + status.count, 0)} طلب
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}