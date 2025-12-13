import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  Package,
  TrendingUp,
  CheckCircle,
  Truck,
  Search,
  Eye,
  History,
  Loader2,
} from "lucide-react";
import api from "../../lib/api";
import { Pagination } from "../ui/pagination";
import type { Order } from "../../types";
import { toast } from "sonner";

interface DriverStats {
  todayDeliveries: number;
  weekDeliveries: number;
  totalDelivered: number;
  pendingDeliveries: number;
}

export const DriverDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DriverStats>({
    todayDeliveries: 0,
    weekDeliveries: 0,
    totalDelivered: 0,
    pendingDeliveries: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchStats(), fetchDeliveries()]);
      setInitialLoad(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, currentPage]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchDeliveries();
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/drivers/stats");
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        status: statusFilter === "all" ? "Processing,On the Way" : statusFilter, // استبعاد Delivered
        page: currentPage,
        limit: 10,
      };

      if (searchQuery.trim()) {
        params.q = searchQuery;
      }

      const res = await api.get("/api/drivers/deliveries", { params });

      if (res.data.success) {
        // تصفية إضافية لضمان عدم ظهور الطلبات المكتملة
        const activeOrders = res.data.data.filter(
          (order: Order) => order.status !== "Delivered"
        );
        setOrders(activeOrders);
        setTotalPages(res.data.meta.totalPages);
        setTotalOrders(res.data.meta.totalOrders || activeOrders.length);
      }
    } catch (error) {
      console.error("Error fetching deliveries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      const res = await api.patch(`/api/orders/${selectedOrder._id}/status`, {
        status: newStatus,
      });

      if (res.data.success) {
        // Show success notification
        const statusLabels: Record<string, string> = {
          Processing: "قيد المعالجة",
          "On the Way": "في الطريق",
          Delivered: "تم التسليم",
          Cancelled: "ملغي",
        };

        // رسالة خاصة عند التسليم
        if (newStatus === "Delivered") {
          toast.success(" تم التسليم بنجاح!", {
            description: 'تم نقل الطلب إلى صفحة "توصيلاتي"',
          });
        } else if (newStatus === "Cancelled") {
          toast.success("تم إلغاء الطلب", {
            description: "تم تحديث حالة الطلب إلى: ملغي",
          });
        } else {
          toast.success("تم تحديث حالة التوصيل", {
            description: `تم تغيير الحالة إلى: ${
              statusLabels[newStatus] || newStatus
            }`,
          });
        }

        setIsDialogOpen(false);
        fetchStats();
        fetchDeliveries();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("فشل تحديث حالة التوصيل", {
        description: "حدث خطأ أثناء تحديث حالة التوصيل",
      });
    }
  };

  const openStatusDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsDialogOpen(true);
  };

  const openViewDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      Pending: { label: "قيد الانتظار", variant: "secondary" },
      Processing: { label: "قيد المعالجة", variant: "default" },
      "On the Way": { label: "في الطريق", variant: "default" },
      Delivered: { label: "تم التسليم", variant: "outline" },
      Cancelled: { label: "ملغي", variant: "destructive" },
    };
    const config = statusMap[status] || statusMap["Processing"];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">لوحة تحكم السائق</h1>
        <Button
          variant="outline"
          onClick={() => navigate("/my-deliveries")}
          className="gap-2"
        >
          <History className="h-4 w-4" />
          توصيلاتي المكتملة
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">توصيلات اليوم</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayDeliveries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              توصيلات هذا الأسبوع
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekDeliveries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي التوصيلات
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDelivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              الطلبات النشطة
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDeliveries}</div>
            <p className="text-xs text-muted-foreground mt-1">
              قيد المعالجة والتوصيل
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>طلبات التوصيل</CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن طلب (اسم العميل أو رقم الهاتف)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8 text-right"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              dir="rtl"
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الطلبات النشطة</SelectItem>
                <SelectItem value="Processing">قيد المعالجة</SelectItem>
                <SelectItem value="On the Way">في الطريق</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد طلبات توصيل
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الطلب</TableHead>
                    <TableHead className="text-right">اسم العميل</TableHead>
                    <TableHead className="text-right">رقم الهاتف</TableHead>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">
                        #{order._id.slice(-6)}
                      </TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.customerPhone1}</TableCell>
                      <TableCell>
                        {order.governorate} - {order.city}
                        <br />
                        <span className="text-sm text-muted-foreground">
                          {order.street}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openViewDialog(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => openStatusDialog(order)}
                          >
                            <Truck className="h-4 w-4 mr-1" />
                            تحديث
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={10}
                    totalItems={totalOrders}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto bg-secondary"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle className="text-right text-blue-600">
              تفاصيل الطلب #
              {selectedOrder?.orderNumber || selectedOrder?._id.slice(-6)}
            </DialogTitle>
            <DialogDescription className="text-right">
              عرض كامل تفاصيل الطلب ومعلومات العميل
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-right">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">معلومات العميل</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">الاسم:</span>{" "}
                      <span className="font-medium">
                        {selectedOrder.customerName}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الهاتف 1:</span>{" "}
                      <span className="font-medium">
                        {selectedOrder.customerPhone1}
                      </span>
                    </div>
                    {selectedOrder.customerPhone2 && (
                      <div>
                        <span className="text-muted-foreground">الهاتف 2:</span>{" "}
                        <span className="font-medium">
                          {selectedOrder.customerPhone2}
                        </span>
                      </div>
                    )}
                    {selectedOrder.customerEmail && (
                      <div>
                        <span className="text-muted-foreground">البريد:</span>{" "}
                        <span className="font-medium">
                          {selectedOrder.customerEmail}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">معلومات التوصيل</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">المحافظة:</span>{" "}
                      <span className="font-medium">
                        {selectedOrder.governorate}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">المدينة:</span>{" "}
                      <span className="font-medium">{selectedOrder.city}</span>
                    </div>
                    {selectedOrder.village && (
                      <div>
                        <span className="text-muted-foreground">القرية:</span>{" "}
                        <span className="font-medium">
                          {selectedOrder.village}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">العنوان:</span>{" "}
                      <span className="font-medium">
                        {selectedOrder.street}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الحالة:</span>{" "}
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">معلومات الطلب</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">نوع الطلب:</span>{" "}
                    <span className="font-medium">
                      {selectedOrder.orderType}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">نوع الشحن:</span>{" "}
                    <span className="font-medium">
                      {selectedOrder.shippingType}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">نوع الدفع:</span>{" "}
                    <span className="font-medium">
                      {selectedOrder.paymentType}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الفرع:</span>{" "}
                    <span className="font-medium">{selectedOrder.branch}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">التكلفة:</span>{" "}
                    <span className="font-medium">
                      {selectedOrder.orderCost} ج.م
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الوزن الكلي:</span>{" "}
                    <span className="font-medium">
                      {selectedOrder.totalWeight} كجم
                    </span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h4 className="font-medium mb-2">ملاحظات</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg text-right">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              {selectedOrder.products && selectedOrder.products.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">المنتجات</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">المنتج</TableHead>
                          <TableHead className="text-right">الكمية</TableHead>
                          <TableHead className="text-right">الوزن</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.products.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-right">
                              {product.productName}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.weight} كجم
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto bg-secondary"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle className="text-right text-blue-600">
              تحديث حالة التوصيل
            </DialogTitle>
            <DialogDescription className="text-right text-primary">
              اختر الحالة الجديدة للطلب
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                الطلب: #{selectedOrder?._id.slice(-6)}
              </p>
              <p className="text-sm text-muted-foreground">
                العميل: {selectedOrder?.customerName}
              </p>
            </div>

            <Select value={newStatus} onValueChange={setNewStatus} dir="rtl">
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                {selectedOrder?.status === "Processing" && (
                  <>
                    <SelectItem value="On the Way">في الطريق</SelectItem>
                    <SelectItem value="Delivered">تم التسليم</SelectItem>
                    <SelectItem value="Cancelled">ملغي</SelectItem>
                  </>
                )}
                {selectedOrder?.status === "On the Way" && (
                  <>
                    <SelectItem value="Processing">قيد المعالجة</SelectItem>
                    <SelectItem value="Delivered">تم التسليم</SelectItem>
                    <SelectItem value="Cancelled">ملغي</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            <p className="text-xs text-muted-foreground">
              {selectedOrder?.status === "Processing" &&
                'يمكنك نقل الطلب إلى "في الطريق"، "تم التسليم" أو "ملغي"'}
              {selectedOrder?.status === "On the Way" &&
                'يمكنك إرجاع الطلب إلى "قيد المعالجة"، إتمام "التسليم" أو "إلغاء" الطلب'}
              {selectedOrder?.status === "Delivered" &&
                "الطلب تم تسليمه بالفعل"}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateStatus}>تحديث</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
