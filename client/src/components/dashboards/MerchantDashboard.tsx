import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Package,
  Plus,
  CheckCircle,
  Clock,
  Truck,
  Eye,
  XCircle,
  DollarSign,
  TrendingUp,
  Activity,
  Loader2, 
} from "lucide-react";
import api from "../../lib/api";
import type { Order, GetOrdersResponse, ApiError } from "../../types"; 

const statusLabels: Record<string, string> = {
  Pending: "قيد الانتظار",
  Processing: "قيد المعالجة",
  "On the Way": "في الطريق",
  Delivered: "تم التسليم",
  Cancelled: "ملغي",
};

export function MerchantDashboard() {
  const navigate = useNavigate();
  
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<GetOrdersResponse>("/api/orders/my-orders");
      setAllOrders(response.data.data.orders);
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || "فشل في جلب الطلبات.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const getTotalOrders = () => allOrders.length;

  const getSuccessRate = () => {
    const delivered = allOrders.filter((o) => o.status === "Delivered").length;
    const total = getTotalOrders();
    return total > 0 ? Math.round((delivered / total) * 100) : 0;
  };

  const getActiveOrders = () => {
    return allOrders.filter((o) =>
      ["Pending", "Processing", "On the Way"].includes(o.status)
    ).length;
  };

  const getTotalSales = () => {
    return allOrders
      .filter((o) => o.status === "Delivered")
      .reduce((total, order) => total + order.orderCost, 0);
  };

  const statusCounts = {
    Pending: allOrders.filter((o) => o.status === "Pending").length,
    Processing: allOrders.filter((o) => o.status === "Processing").length,
    "On the Way": allOrders.filter((o) => o.status === "On the Way").length,
    Delivered: allOrders.filter((o) => o.status === "Delivered").length,
    Cancelled: allOrders.filter((o) => o.status === "Cancelled").length,
  };
  
  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "On the Way":
        return <Truck className="h-5 w-5 text-purple-600" />;
      case "Processing":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "Pending":
        return <Package className="h-5 w-5 text-blue-600" />;
      case "Cancelled":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "On the Way":
        return "bg-purple-100 text-purple-800";
      case "Processing":
        return "bg-yellow-100 text-yellow-800";
      case "Pending":
        return "bg-blue-100 text-blue-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">حدث خطأ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">{error}</p>
          <Button onClick={fetchMyOrders} className="mt-4">
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>لوحة تحكم التاجر</h1>
          <p className="text-muted-foreground">
            متابعة شحناتك وإدارة طلباتك
          </p>
        </div>
        <Button 
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => navigate('/create-order')}
        >
          <Plus className="h-4 w-4 mr-2" />
          إنشاء طلب جديد
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalOrders()}</div>
            <p className="text-xs text-muted-foreground">جميع الطلبات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getSuccessRate()}%
            </div>
            <p className="text-xs text-muted-foreground">من إجمالي الطلبات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلبات النشطة</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getActiveOrders()}</div>
            <p className="text-xs text-muted-foreground">قيد المعالجة والشحن</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي المبيعات (المكتملة)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getTotalSales().toFixed(2)} جنيه
            </div>
            <p className="text-xs text-muted-foreground">
              فقط من الطلبات التي "تم تسليمها"
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تقرير حالات الطلبات</CardTitle>
          <CardDescription>
            عرض تفصيلي لجميع حالات الطلبات الحالية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <StatusCard
              icon={Package}
              title="قيد الانتظار"
              count={statusCounts.Pending}
              color="bg-orange-100 text-orange-800"
              iconColor="text-orange-600"
            />
            <StatusCard
              icon={Clock}
              title="قيد المعالجة"
              count={statusCounts.Processing}
              color="bg-yellow-100 text-yellow-800"
              iconColor="text-yellow-600"
            />
            <StatusCard
              icon={Truck}
              title="في الطريق"
              count={statusCounts["On the Way"]}
              color="bg-blue-100 text-blue-800"
              iconColor="text-blue-600"
            />
            <StatusCard
              icon={CheckCircle}
              title="تم التسليم"
              count={statusCounts.Delivered}
              color="bg-green-100 text-green-800"
              iconColor="text-green-600"
            />
            <StatusCard
              icon={XCircle}
              title="ملغي"
              count={statusCounts.Cancelled}
              color="bg-red-100 text-red-800"
              iconColor="text-red-600"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800">إنشاء طلب شحن جديد</CardTitle>
          <CardDescription className="text-orange-700">
            ابدأ بإنشاء طلب شحن جديد بخطوات بسيطة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            size="lg" 
            className="w-full bg-orange-600 hover:bg-orange-700"
            onClick={() => navigate('/create-order')}
          >
            <Plus className="h-5 w-5 mr-2" />
            إنشاء طلب جديد
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>أحدث طلباتي</CardTitle>
          <CardDescription>آخر 5 طلبات شحن قمت بإنشائها</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allOrders.length === 0 ? (
              <p className="text-center text-muted-foreground">
                لا توجد طلبات لعرضها.
              </p>
            ) : (
              allOrders.slice(0, 5).map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-4 border rounded-lg text-primary hover:bg-gray-200 hover:text-black transition-colors"
                >
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="h-10 w-10 ml-2 rounded-full flex items-center justify-center bg-white shadow">
                      {getOrderStatusIcon(order.status)}
                    </div>
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.governorate}, {order.city}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        رقم الطلب: #{order._id.slice(-8)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="text-left">
                      <Badge className={getOrderStatusColor(order.status)}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                      <p className="text-sm font-medium mt-1">
                        {order.orderCost.toFixed(2)} جنيه
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                      </p>
                    </div>

                    <Button className="mr-2" variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

const StatusCard = ({ icon: Icon, title, count, color, iconColor }: any) => (
  <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-full bg-gray-50`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="text-2xl font-bold">{count}</div>
    </div>
    <h3 className="font-medium text-sm mb-1">{title}</h3>
    <Badge variant="secondary" className={color}>
      {count} طلب
    </Badge>
  </div>
);