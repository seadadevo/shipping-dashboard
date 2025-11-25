import { 
  Package,
  CheckCircle, 
  Clock, 
  Truck,
  Eye,
  XCircle,
  AlertTriangle,
  Pause,
  DollarSign,
  TrendingUp,
  Activity,
  Users,
  Phone,
  MapPin
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {useEffect, useMemo, useState} from "react";
import type {Order, User, GetOrdersResponse} from "../../types";
import api from "../../lib/api";

export function EmployeeDashboard() {
    // get day of last 7 days
    function getDayOfLast7Days(dateString: string): boolean {
        const date = new Date(dateString);

        // Start of today (UTC)
        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);  // set to start of today UTC
        start.setUTCDate(start.getUTCDate() - 6); // subtract number of days

        // End of today (UTC)
        const end = new Date();
        end.setUTCHours(23, 59, 59, 999);

        return date >= start && date <= end;
    }

    // get all users
    const [users, setUsers] = useState<User[]>([]);
    const getUsers = async (): Promise<void> => {
        const res = await api.get<User[]>("api/users/");
        setUsers(res.data);
    };

    useEffect(() => {
        getUsers().catch(console.error);
    }, []);

    // merchant count derived from users
    const merchantsCount = useMemo(() => {
        return users.reduce((acc, u) => acc + (u.userType === "merchant" ? 1 : 0), 0);
    }, [users]);

    // get all order to processing operations
    const [orders, setOrders] = useState<Order[]>([]);
    const getAllOrders = async (): Promise<void> => {
        const res = await api.get<GetOrdersResponse>("api/orders/");
        setOrders(res.data.data.orders);
    };

    useEffect(() => {
        getAllOrders().catch(console.error);
    }, []);

    type StatusSummary = {
        id: string;
        name: string;
        count: number;
        icon: LucideIcon;
        color: string;
        iconColor: string;
    };

    const {
        ordersRate,
        allProcessingOrders,
        allRecentOrders,
        orderStatuses
    } = useMemo(() => {
        let delivered = 0;
        let processing = 0;
        let pending = 0;
        let shipped = 0;
        let cancelled = 0;
        let unreachable = 0;
        let postponed = 0;
        let rejectedWithPayment = 0;
        let rejectedNoPayment = 0;
        const recent: Order[] = [];

        for (const order of orders) {
            const status = order.status?.toLowerCase();
            if (status === "delivered") delivered++;
            else if (status === "processing") processing++;
            else if (status === "pending") pending++;
            else if (status === "shipped") shipped++;
            else if (status === "cancelled") cancelled++;
            else if (status === "unreachable") unreachable++;
            else if (status === "postponed") postponed++;
            else if (status === "rejected_with_payment") rejectedWithPayment++;
            else if (status === "rejected_no_payment") rejectedNoPayment++;

            if (getDayOfLast7Days(order.createdAt)) recent.push(order);
        }

        const rate = orders.length ? Math.round((delivered / orders.length) * 100) : 0;

        // Sort recent orders by date desc for stable display
        recent.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const statuses: StatusSummary[] = [
            {
                id: 'new',
                name: 'الطلبات الجديدة',
                count: orders.length,
                icon: Package,
                color: 'bg-blue-100 text-blue-800',
                iconColor: 'text-blue-600'
            },
            {
                id: 'pending',
                name: 'قيد الانتظار',
                count: pending,
                icon: Clock,
                color: 'bg-yellow-100 text-yellow-800',
                iconColor: 'text-yellow-600'
            },
            {
                id: 'delivered_to_courier',
                name: 'تم التسليم للمندوب',
                count: shipped,
                icon: Truck,
                color: 'bg-purple-100 text-purple-800',
                iconColor: 'text-purple-600'
            },
            {
                id: 'delivered',
                name: 'تم التسليم',
                count: delivered,
                icon: CheckCircle,
                color: 'bg-green-100 text-green-800',
                iconColor: 'text-green-600'
            },
            {
                id: 'unreachable',
                name: 'لا يمكن الوصول',
                count: unreachable,
                icon: XCircle,
                color: 'bg-red-100 text-red-800',
                iconColor: 'text-red-600'
            },
            {
                id: 'postponed',
                name: 'تم التأجيل',
                count: postponed,
                icon: Pause,
                color: 'bg-gray-100 text-gray-800',
                iconColor: 'text-gray-600'
            },
            {
                id: 'cancelled_by_recipient',
                name: 'تم الإلغاء من قبل المستلم',
                count: cancelled,
                icon: XCircle,
                color: 'bg-red-100 text-red-800',
                iconColor: 'text-red-600'
            },
            {
                id: 'rejected_with_payment',
                name: 'تم الرفض مع الدفع',
                count: rejectedWithPayment,
                icon: DollarSign,
                color: 'bg-green-100 text-green-800',
                iconColor: 'text-green-600'
            },
            {
                id: 'rejected_no_payment',
                name: 'رفض ولم يتم الدفع',
                count: rejectedNoPayment,
                icon: XCircle,
                color: 'bg-red-100 text-red-800',
                iconColor: 'text-red-600'
            }
        ];

        return {
            ordersRate: rate,
            allProcessingOrders: processing,
            allRecentOrders: recent,
            orderStatuses: statuses
        };
    }, [orders]);

    ///////////////////////////////////////////////////////////
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
        {/*<Button className="bg-blue-600 hover:bg-blue-700">*/}
        {/*  <Plus className="h-4 w-4 mr-2" />*/}
        {/*  معالجة طلب جديد*/}
        {/*</Button>*/}
      </div>

      {/* إحصائيات عامة */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
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
            <div className="text-2xl font-bold text-green-600">{ordersRate}%</div>
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
            <div className="text-2xl font-bold text-orange-600">{allProcessingOrders}</div>
            <p className="text-xs text-muted-foreground">
              تحتاج تدخل النظام
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التجار النشطين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{merchantsCount}</div>
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
            آخر خمس طلبات تم ادخالها في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allRecentOrders.slice(0, 5).map((order) => (
              <div key={order._id.slice(-8)} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-50">
                    {getOrderStatusIcon(order.status)}
                  </div>
                  <div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-blue-600">{order.orderType}</p>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {order.governorate + ", " + order.city + ", " + order.street}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <span>رقم الطلب: {order._id.slice(-8)} </span>
                      <span className="mx-2">•</span>
                      <Phone className="h-3 w-3 mr-1" /> . {order.customerPhone1}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="text-left">
                    <Badge className={
                        order.status.toLowerCase() === "delivered"
                            ? getOrderStatusColor("تم التسليم")
                            : order.status.toLowerCase() === "pending"
                                ? getOrderStatusColor("قيد الانتظار")
                                : order.status.toLowerCase() === "shipped"
                                    ?getOrderStatusColor("تم التسليم للمندوب")
                                    :getOrderStatusColor("طلب جديد")
                    }>
                        {
                            order.status.toLowerCase() === "delivered"
                                ? "تم التسليم"
                                : order.status.toLowerCase() === "pending"
                                    ? "قيد الانتظار"
                                    : order.status.toLowerCase() === "shipped"
                                        ?"تم التسليم للمندوب"
                                        :"طلب جديد"
                        }
                    </Badge>
                    <p className="text-sm font-medium mt-1">{order.orderCost} جنية </p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>

                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/*<div className="mt-4 text-center">*/}
          {/*  <Button variant="outline">عرض جميع الطلبات</Button>*/}
          {/*</div>*/}
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