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
import {useEffect, useState} from "react";
import type {Order, User} from "../../types";
import api from "../../lib/api.ts";

export function EmployeeDashboard() {
    //////////////////////////////////////////////////////////
    function getDayOfLast7Days(dateString: string): boolean {
        const date = new Date(dateString);

        // Start of today (UTC)
        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);  // set to start of today UTC
        start.setUTCDate(start.getUTCDate() - 6); // subtract 14 days

        // End of today (UTC)
        const end = new Date();
        end.setUTCHours(23, 59, 59, 999);

        return date >= start && date <= end;
    }
    // get all orders to processing operations
    const [users, setUsers] = useState<User[]>([]);
    const getUsers = async (): Promise<void> => {
        const res = await api.get<User[]>("api/users/");
        setUsers(res.data);
    };

    useEffect(() => {
        getUsers().catch(console.error);
    }, []);

    const [merchantsCount, setMerchantsCount] = useState<number>(0);
    useEffect(() => {
        let allMerchants = 0;
        users.forEach(user => {
            if(user.userType.toLowerCase() === "merchant")
                allMerchants++;
        })

        setMerchantsCount(allMerchants);
    }, [users]);

    // get all order to processing operations
    const [orders, setOrders] = useState<Order[]>([]);
    const getAllOrders = async (): Promise<void> => {
        const res = await api.get<Order[]>("api/orders/");
        setOrders(res.data.data.orders);
    };

    useEffect(() => {
        getAllOrders().catch(console.error);
    }, []);

    const [ordersRate, setOrdersRate] = useState<number>(0);
    const [allProcessingOrders, setAllProcessingOrders] = useState<number>(0);
    const [orderStatuses, setOrderStatuses] = useState<any>([]);
    const [allPendingOrders, setAllPendingOrders] = useState<number>(0);
    const [allShippedOrders, setAllShippedOrders] = useState<number>(0);
    const [allCancelledOrders, setAllCancelledOrders] = useState<number>(0);
    const [allDeliveredOrders, setAllDeliveredOrders] = useState<number>(0);
    const[allUnreachableOrders, setAllUnreachableOrders] = useState<number>(0);
    const [allPostponedOrders, setAllPostponedOrders] = useState<number>(0);
    const [allRejectedWithPaymentOrders, setAllRejectedWithPaymentOrders] = useState<number>(0);
    const [allRejectedNoPaymentOrders, setAllRejectedNoPaymentOrders] = useState<number>(0);
    const [allRecentOrders, setAllRecentOrders] = useState<Order[]>([]);
    useEffect(() => {
        let successOrders = 0;
        let successOrdersRate = 0;
        let processingOrders = 0;
        let pendingOrders = 0;
        let shippedOrders = 0;
        let cancelledOrders = 0;
        let unreachableOrders = 0;
        let postponedOrders = 0;
        let rejectedWithPaymentOrders = 0;
        let rejectedNoPaymentOrders = 0;
        let recentOrders: Order[] = [];

        setOrderStatuses( [
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
                count: allPendingOrders,
                icon: Clock,
                color: 'bg-yellow-100 text-yellow-800',
                iconColor: 'text-yellow-600'
            },
            {
                id: 'delivered_to_courier',
                name: 'تم التسليم للمندوب',
                count: allShippedOrders,
                icon: Truck,
                color: 'bg-purple-100 text-purple-800',
                iconColor: 'text-purple-600'
            },
            {
                id: 'delivered',
                name: 'تم التسليم',
                count: allDeliveredOrders,
                icon: CheckCircle,
                color: 'bg-green-100 text-green-800',
                iconColor: 'text-green-600'
            },
            {
                id: 'unreachable',
                name: 'لا يمكن الوصول',
                count: allUnreachableOrders,
                icon: XCircle,
                color: 'bg-red-100 text-red-800',
                iconColor: 'text-red-600'
            },
            {
                id: 'postponed',
                name: 'تم التأجيل',
                count: allPostponedOrders,
                icon: Pause,
                color: 'bg-gray-100 text-gray-800',
                iconColor: 'text-gray-600'
            },
            {
                id: 'cancelled_by_recipient',
                name: 'تم الإلغاء من قبل المستلم',
                count: allCancelledOrders,
                icon: XCircle,
                color: 'bg-red-100 text-red-800',
                iconColor: 'text-red-600'
            },
            {
                id: 'rejected_with_payment',
                name: 'تم الرفض مع الدفع',
                count: allRejectedWithPaymentOrders,
                icon: DollarSign,
                color: 'bg-green-100 text-green-800',
                iconColor: 'text-green-600'
            },
            {
                id: 'rejected_no_payment',
                name: 'رفض ولم يتم الدفع',
                count: allRejectedNoPaymentOrders,
                icon: XCircle,
                color: 'bg-red-100 text-red-800',
                iconColor: 'text-red-600'
            }
        ]);

        orders.forEach(order => {
            if(order.status.toLowerCase() === "delivered")
                successOrders++;
            if(order.status.toLowerCase() === "processing")
                processingOrders++;
            if(order.status.toLowerCase() === "pending")
                pendingOrders++;
            if(order.status.toLowerCase() === "shipped")
                shippedOrders++;
            if(order.status.toLowerCase() === "cancelled")
                cancelledOrders++;
            if(order.status.toLowerCase() === "unreachable")
                unreachableOrders++;
            if(order.status.toLowerCase() === "postponed")
                postponedOrders++;
            if(order.status.toLowerCase() === "rejected_with_payment")
                rejectedWithPaymentOrders++;
            if(order.status.toLowerCase() === "rejected_no_payment")
                rejectedNoPaymentOrders++;
            if(getDayOfLast7Days(order.createdAt))
                recentOrders.push(order);
            // if(order.createdBy)
        });

        successOrdersRate = Math.round(successOrders / orders.length * 100);

        setOrdersRate(successOrdersRate);
        setAllProcessingOrders(processingOrders);
        setAllDeliveredOrders(successOrders);
        setAllPendingOrders(pendingOrders);
        setAllShippedOrders(shippedOrders);
        setAllCancelledOrders(cancelledOrders);
        setAllUnreachableOrders(unreachableOrders);
        setAllPostponedOrders(postponedOrders);
        setAllRejectedWithPaymentOrders(rejectedWithPaymentOrders);
        setAllRejectedNoPaymentOrders(rejectedNoPaymentOrders);
        setAllRecentOrders(recentOrders);
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
            <div className="text-2xl font-bold text-orange-600">
                {allProcessingOrders}
              {/*{orderStatuses.filter(s =>
              //   ['new', 'pending', 'unreachable', 'postponed'].includes(s.id)
              // ).reduce((total, status) => total + status.count, 0)*/}
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
            آخر الطلبات المدخلة في النظام
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
                    <p className="text-xs text-muted-foreground">date arrived</p>
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