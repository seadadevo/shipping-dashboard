import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Package,
  Search,
  // Filter, // (غير مستخدم)
  Download,
  RefreshCw,
  MapPin,
  User,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  XCircle,
  Loader2,
  MoreHorizontal,
  Eye,
  Trash2,
  Store,
  DollarSign,
} from "lucide-react";
import api from "../../lib/api";
import { Pagination } from "../ui/pagination";
import type { ApiError, GetOrdersResponse, Order } from "../../types";
import { exportOrdersToExcel } from "../../lib/exportUtils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { useAuth } from "../../hooks/useAuth";
import { toast } from "sonner";
import { orderStateService } from "../../lib/orderStateService";
import {
  getStatusDropdownOptions,
  isStatusSelectDisabled,
  getDisabledSelectTooltip,
} from "../../lib/orderStateManager";
import type { OrderState, UserRole } from "../../types";

const statusLabels: Record<string, string> = {
  Pending: "قيد الانتظار",
  Processing: "قيد المعالجة",
  "On the Way": "في الطريق",
  Delivered: "تم التسليم",
  Cancelled: "ملغي",
  all: "جميع الحالات",
};

const statusOptions = [
  { value: "all", label: "جميع الحالات" },
  { value: "Pending", label: statusLabels.Pending },
  { value: "Processing", label: statusLabels.Processing },
  { value: "On the Way", label: statusLabels["On the Way"] },
  { value: "Delivered", label: statusLabels.Delivered },
  { value: "Cancelled", label: statusLabels.Cancelled },
];

export function OrderManagement() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => {
    // Read initial status from URL query parameter
    const statusParam = searchParams.get("status");
    return statusParam || "all";
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    delivered: 0,
    cancelled: 0,
  });

  const { user } = useAuth();
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // Driver assignment states
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [selectedOrderForDriver, setSelectedOrderForDriver] =
    useState<Order | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<User[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);

  // Fetch all orders stats (without filters)
  const fetchOrderStats = async () => {
    try {
      setStatsLoading(true);
      // Use different endpoint based on user role
      const endpoint =
        user?.userType === "merchant" ? "/api/orders/my-orders" : "/api/orders";

      const response = await api.get<GetOrdersResponse>(endpoint, {
        params: {
          status: "all",
          page: 1,
          limit: 10000, // Get all orders for stats
        },
      });
      const orders = response.data.data.orders;
      setOrderStats({
        total: orders.length,
        pending: orders.filter((o) => o.status === "Pending").length,
        processing: orders.filter((o) => o.status === "Processing").length,
        delivered: orders.filter((o) => o.status === "Delivered").length,
        cancelled: orders.filter((o) => o.status === "Cancelled").length,
      });
    } catch (err) {
      console.error("Failed to fetch order stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // --- (🚀 تعديل: fetchOrders الآن تستخدم الفلاتر لإرسالها للـ API) ---
  const fetchOrders = async (page = currentPage, limit = itemsPerPage) => {
    setLoading(true);
    setError(null);
    try {
      // Use different endpoint based on user role
      const endpoint =
        user?.userType === "merchant" ? "/api/orders/my-orders" : "/api/orders";

      const response = await api.get<GetOrdersResponse>(endpoint, {
        params: {
          status: statusFilter,
          q: searchQuery,
          page,
          limit,
        },
      });
      setAllOrders(response.data.data.orders);
      setCurrentPage(response.data?.meta?.page || page);
      setTotalPages(response.data?.meta?.totalPages || 1);
      setTotalItems(
        response.data?.meta?.total || response.data.data.orders.length
      );
      setItemsPerPage(response.data?.meta?.limit || limit);
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || "فشل في جلب الطلبات.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats once on mount
  useEffect(() => {
    fetchOrderStats();
  }, []);

  // --- (🚀 تعديل: useEffect الآن يراقب الفلاتر) ---
  // (⭐ تعديل): هذا الـ useEffect سيقوم بإعادة جلب البيانات عند تغيير البحث أو الحالة
  useEffect(() => {
    // (Debounce) ننتظر 500ms بعد آخر ضغطة زر قبل إرسال الطلب
    const handler = setTimeout(() => {
      fetchOrders();
    }, 500);

    // (Cleanup) إلغاء الـ timeout القديم إذا قام المستخدم بالكتابة مجدداً
    return () => {
      clearTimeout(handler);
    };
  }, [statusFilter, searchQuery]); // <-- يراقب هذه المتغيرات

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "Shipped":
        return <Truck className="h-4 w-4" />;
      case "Processing":
        return <Clock className="h-4 w-4" />;
      case "Pending":
        return <AlertCircle className="h-4 w-4" />;
      case "Cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "Shipped":
        return "bg-blue-100 text-blue-800";
      case "Processing":
        return "bg-yellow-100 text-yellow-800";
      case "Pending":
        return "bg-orange-100 text-orange-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // --- (🚀 إزالة: filteredOrders) ---
  // (⭐ إزالة): لم نعد بحاجة للفلترة في الفرونت إند
  // الباك إند هو المسؤول الآن عن إرجاع البيانات المفلترة
  // const filteredOrders = allOrders.filter((order) => { ... });

  // (ملحوظة): سنستخدم allOrders مباشرة في الجدول

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (order: Order) => {
    setError(null);
    setOrderToDelete(order);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await api.delete(`/api/orders/${orderToDelete._id}`);
      setOrderToDelete(null);
      fetchOrders();
      fetchOrderStats(); // Update stats after deletion
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || "فشل في حذف الطلب.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const order = allOrders.find((o) => o._id === orderId);
    if (!order) {
      toast.error("الطلب غير موجود");
      return;
    }

    // If changing to Processing, show driver selection dialog
    if (
      newStatus === "Processing" &&
      (user?.userType === "admin" || user?.userType === "employee")
    ) {
      setSelectedOrderForDriver(order);
      setIsDriverDialogOpen(true);
      // Fetch available drivers for this order's city
      await fetchAvailableDrivers(order.governorate, order.city);
      return;
    }

    // For other status changes, proceed normally
    setIsUpdatingStatus(orderId);
    try {
      const previousStatus = order.status;

      await api.patch(`/api/orders/${orderId}/status`, { status: newStatus });

      // Generate and show notification
      const notification = orderStateService.generateNotificationMessage(
        order,
        previousStatus as OrderState,
        newStatus as OrderState,
        user?.userType as UserRole
      );

      if (notification.type === "success") {
        toast.success(notification.title, {
          description: notification.description,
        });
      } else if (notification.type === "warning") {
        toast.warning(notification.title, {
          description: notification.description,
        });
      } else {
        toast.error(notification.title, {
          description: notification.description,
        });
      }

      fetchOrders();
      fetchOrderStats(); // Update stats after status change
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error("فشل تحديث حالة الطلب", {
        description: "حدث خطأ أثناء تحديث حالة الطلب",
      });
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleRefresh = () => {
    fetchOrders();
    fetchOrderStats();
  };

  // Fetch available drivers for a specific city
  const fetchAvailableDrivers = async (governorate: string, city: string) => {
    setIsLoadingDrivers(true);
    try {
      const response = await api.get(
        `/api/drivers/by-city?governorate=${governorate}&city=${city}`
      );
      setAvailableDrivers(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch drivers:", err);
      toast.error("فشل في جلب السائقين المتاحين");
      setAvailableDrivers([]);
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  // Assign driver and update status to Processing
  const handleAssignDriver = async () => {
    if (!selectedOrderForDriver || !selectedDriver) {
      toast.error("يرجى اختيار سائق");
      return;
    }

    setIsAssigningDriver(true);
    try {
      // Update order with driver and status
      await api.patch(
        `/api/orders/${selectedOrderForDriver._id}/assign-driver`,
        {
          driverId: selectedDriver,
          status: "Processing",
        }
      );

      toast.success("تم تعيين السائق بنجاح", {
        description: `تم تحويل الطلب إلى قيد المعالجة وتعيين السائق`,
      });

      // Close dialog and refresh
      setIsDriverDialogOpen(false);
      setSelectedOrderForDriver(null);
      setSelectedDriver("");
      setAvailableDrivers([]);

      fetchOrders();
      fetchOrderStats();
    } catch (err: unknown) {
      console.error("Failed to assign driver:", err);
      const errorMsg =
        (err as any).response?.data?.message || "فشل تعيين السائق";
      toast.error(errorMsg);
    } finally {
      setIsAssigningDriver(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>إدارة الطلبات</h1>
          <p className="text-muted-foreground">
            عرض وإدارة جميع طلبات الشحن في النظام
          </p>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <Button
            variant="outline"
            className="ml-2"
            onClick={() =>
              exportOrdersToExcel(
                allOrders,
                `طلبات-${new Date()
                  .toLocaleDateString("ar-EG")
                  .replace(/\//g, "-")}.csv`
              )
            }
          >
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
          {/* زر التحديث يحدث الطلبات والإحصائيات */}
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            تحديث
          </Button>
        </div>
      </div>

      {/* الإحصائيات السريعة */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">إجمالي الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                orderStats.total
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">قيد الانتظار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
              ) : (
                orderStats.pending
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">قيد المعالجة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
              ) : (
                orderStats.processing
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">تم التسليم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
              ) : (
                orderStats.delivered
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">ملغي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-red-600" />
              ) : (
                orderStats.cancelled
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول الطلبات */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلبات</CardTitle>
          <CardDescription>
            جميع طلبات الشحن مع إمكانية البحث والتصفية
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* أدوات البحث والتصفية */}
          <div className="flex items-center space-x-4 space-x-reverse mb-4">
            <div className="relative flex-1 max-w-sm ml-2">
              <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث (اسم، هاتف، إيميل)..."
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
              <SelectTrigger className="w-48">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* الجدول */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الطلب</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">الوجهة</TableHead>
                  <TableHead className="text-right">الموظف/التاجر</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">التكلفة</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
                      <p className="text-muted-foreground mt-2">
                        جاري تحميل الطلبات...
                      </p>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
                      <p className="text-red-600 mt-2">{error}</p>
                    </TableCell>
                  </TableRow>
                ) : // --- (🚀 تعديل: نستخدم allOrders بدلاً من filteredOrders) ---
                allOrders.length > 0 ? (
                  allOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{order._id.slice(-8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.orderType}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {/* (⭐ هنا) سيعمل الآن عند جلب البيانات الصحيحة */}
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.customerPhone1}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>
                            <strong>{order.governorate}</strong>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.city}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
<<<<<<< HEAD
                            {order.createdBy.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.createdBy.userType}
=======
                            {order.createdBy?.fullName || 'غير معروف'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.createdBy?.userType || '-'}
>>>>>>> 0e3770d5c8feb3fc6883d34cd991b1340a1ea6ff
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getStatusColor(
                            order.status
                          )} flex items-center w-fit`}
                        >
                          {getStatusIcon(order.status)}
                          <span className="mr-1">
                            {statusLabels[order.status] || order.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {/* (⭐ وهنا) سيعمل الآن عند جلب البيانات الصحيحة */}
                        {order.orderCost?.toFixed(2) ?? "-"} جنيه
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                      </TableCell>
                      <TableCell>
                        {/* ... (باقي القائمة المنسدلة كما هي) ... */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            className="bg-background"
                            align="end"
                            dir="rtl"
                          >
                            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleViewOrder(order)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              عرض التفاصيل
                            </DropdownMenuItem>

                            {/* إلغاء الطلب للتاجر */}
                            {(() => {
                              return (
                                user?.userType === "merchant" &&
                                (order.status === "Pending" ||
                                  order.status === "Processing")
                              );
                            })() && (
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() =>
                                  handleStatusChange(order._id, "Cancelled")
                                }
                                disabled={isUpdatingStatus === order._id}
                              >
                                {isUpdatingStatus === order._id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="mr-2 h-4 w-4" />
                                )}
                                إلغاء الطلب
                              </DropdownMenuItem>
                            )}

                            {/* تغيير الحالة للأدمن والموظف */}
                            {user?.userType !== "merchant" && (
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger
                                  disabled={
                                    isUpdatingStatus === order._id ||
                                    isStatusSelectDisabled(
                                      user?.userType as UserRole,
                                      order.status as OrderState
                                    )
                                  }
                                  title={
                                    isStatusSelectDisabled(
                                      user?.userType as UserRole,
                                      order.status as OrderState
                                    )
                                      ? getDisabledSelectTooltip(
                                          user?.userType as UserRole,
                                          order.status as OrderState
                                        )
                                      : undefined
                                  }
                                >
                                  {isUpdatingStatus === order._id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                  )}
                                  تغيير الحالة
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                  <DropdownMenuSubContent
                                    className="bg-background"
                                    dir="rtl"
                                  >
                                    {getStatusDropdownOptions(
                                      user?.userType as UserRole,
                                      order.status as OrderState
                                    ).map((status) => (
                                      <DropdownMenuItem
                                        key={status.value}
                                        onClick={() =>
                                          !status.disabled &&
                                          handleStatusChange(
                                            order._id,
                                            status.value
                                          )
                                        }
                                        disabled={
                                          status.disabled || !!isUpdatingStatus
                                        }
                                        title={status.reason}
                                      >
                                        {status.label}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                              </DropdownMenuSub>
                            )}

                            {user?.userType === "admin" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => handleDeleteClick(order)}
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  حذف الطلب
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        لا توجد طلبات تطابق معايير البحث
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => {
                setCurrentPage(p);
                fetchOrders(p, itemsPerPage);
              }}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onItemsPerPageChange={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
                fetchOrders(1, n);
              }}
            />
          </div>
        </CardContent>
      </Card>
      {/* ... (نافذة عرض تفاصيل الطلب زي ما هي) ... */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className=" bg-background max-w-4xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-blue-600">
              تفاصيل الطلب #{selectedOrder?._id.slice(-8)}
            </DialogTitle>
            <DialogDescription>
              عرض جميع تفاصيل الطلب والحالة الحالية
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              {/* معلومات أساسية */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-blue-200">
                  <CardHeader className="pb-3 bg-blue-50">
                    <CardTitle className="text-sm flex items-center text-blue-800">
                      <User className="h-4 w-4 ml-2" /> معلومات العميل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        الاسم
                      </span>
                      <span className="font-medium">
                        {selectedOrder.customerName}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        الهاتف 1
                      </span>
                      <span className="font-medium">
                        {selectedOrder.customerPhone1}
                      </span>
                    </div>
                    {selectedOrder.customerPhone2 && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          الهاتف 2
                        </span>
                        <span className="font-medium">
                          {selectedOrder.customerPhone2}
                        </span>
                      </div>
                    )}
                    {selectedOrder.customerEmail && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          البريد الإلكتروني
                        </span>
                        <span className="font-medium text-sm">
                          {selectedOrder.customerEmail}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardHeader className="pb-3 bg-green-50">
                    <CardTitle className="text-sm flex items-center text-green-800">
                      <MapPin className="h-4 w-4 ml-2" /> معلومات العنوان
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        المحافظة
                      </span>
                      <span className="font-medium">
                        {selectedOrder.governorate}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        المدينة
                      </span>
                      <span className="font-medium">{selectedOrder.city}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        الشارع
                      </span>
                      <span className="font-medium">
                        {selectedOrder.street}
                      </span>
                    </div>
                    {selectedOrder.village && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          القرية
                        </span>
                        <span className="font-medium">
                          {selectedOrder.village}
                        </span>
                      </div>
                    )}
                    {selectedOrder.isVillageDelivery && (
                      <Badge variant="outline" className="w-fit">
                        توصيل لقرية
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-purple-200">
                  <CardHeader className="pb-3 bg-purple-50">
                    <CardTitle className="text-sm flex items-center text-purple-800">
                      <Store className="h-4 w-4 ml-2" />
                      بيانات التاجر (المرسل)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          اسم التاجر/الموظف
                        </span>
                        <span className="font-medium">
                          {selectedOrder.createdBy.fullName}
                        </span>
                        <Badge variant="secondary" className="mt-1 w-fit">
                          {selectedOrder.createdBy.userType}
                        </Badge>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          البريد الإلكتروني
                        </span>
                        <span className="font-medium text-sm break-all">
                          {selectedOrder.createdBy.email}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          رقم الهاتف
                        </span>
                        <span className="font-medium">
                          {selectedOrder.createdBy.phone || "غير متوفر"}
                        </span>
                      </div>

                      {/* عرض اسم المتجر لو كان تاجر */}
                      {selectedOrder.createdBy.storeName && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            اسم المتجر
                          </span>
                          <span className="font-medium">
                            {selectedOrder.createdBy.storeName}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* تفاصيل الطلب */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-orange-200">
                  <CardHeader className="pb-3 bg-orange-50">
                    <CardTitle className="text-sm flex items-center text-orange-800">
                      <Package className="h-4 w-4 ml-2" />
                      تفاصيل الشحن
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        نوع الطلب
                      </span>
                      <span className="font-medium">
                        {selectedOrder.orderType}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        نوع الشحن
                      </span>
                      <span className="font-medium">
                        {selectedOrder.shippingType}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        الفرع
                      </span>
                      <span className="font-medium">
                        {selectedOrder.branch}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-teal-200">
                  <CardHeader className="pb-3 bg-teal-50">
                    <CardTitle className="text-sm flex items-center text-teal-800">
                      <DollarSign className="h-4 w-4 ml-2" />
                      الدفع والوزن
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        نوع الدفع
                      </span>
                      <span className="font-medium">
                        {selectedOrder.paymentType}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        تكلفة الطلب
                      </span>
                      <span className="font-medium text-lg">
                        {selectedOrder.orderCost.toFixed(2)} جنيه
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        إجمالي الوزن
                      </span>
                      <span className="font-medium">
                        {selectedOrder.totalWeight} كجم
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-indigo-200">
                  <CardHeader className="pb-3 bg-indigo-50">
                    <CardTitle className="text-sm flex items-center text-indigo-800">
                      <Clock className="h-4 w-4 ml-2" />
                      الحالة والتتبع
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        حالة الطلب
                      </span>
                      <Badge
                        className={`${getStatusColor(
                          selectedOrder.status
                        )} w-fit text-sm px-3 py-1`}
                      >
                        {statusLabels[selectedOrder.status] ||
                          selectedOrder.status}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        أنشئ بواسطة
                      </span>
                      <span className="font-medium">
                        {selectedOrder.createdBy.fullName}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        تاريخ الإنشاء
                      </span>
                      <span className="font-medium text-sm">
                        {new Date(selectedOrder.createdAt).toLocaleString(
                          "ar-EG"
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* المنتجات */}
              <Card className="border-slate-200">
                <CardHeader className="bg-slate-50">
                  <CardTitle className="text-sm flex items-center text-slate-800">
                    <Package className="h-4 w-4 ml-2" />
                    المنتجات ({selectedOrder.products.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary">
                          <TableHead className="text-right font-semibold">
                            اسم المنتج
                          </TableHead>
                          <TableHead className="text-center font-semibold">
                            الكمية
                          </TableHead>
                          <TableHead className="text-center font-semibold">
                            الوزن (كجم)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.products.map((product) => (
                          <TableRow key={product._id}>
                            <TableCell className="font-medium">
                              {product.productName}
                            </TableCell>
                            <TableCell className="text-center">
                              {product.quantity}
                            </TableCell>
                            <TableCell className="text-center">
                              {product.weight}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- (إضافة نافذة تأكيد الحذف) --- */}
      <Dialog
        open={!!orderToDelete}
        onOpenChange={(isOpen) => !isOpen && setOrderToDelete(null)}
      >
        <DialogContent className="bg-blue-50">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد أنك تريد حذف الطلب رقم #
              {orderToDelete?._id.slice(-8)}؟
              <br />
              لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <Button
              variant="outline"
              onClick={() => setOrderToDelete(null)}
              disabled={isDeleting}
            >
              إلغاء
            </Button>
            <Button
              className="text-[red] ml-1 border-2"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              تأكيد الحذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Driver Assignment Dialog --- */}
      <Dialog open={isDriverDialogOpen} onOpenChange={setIsDriverDialogOpen}>
        <DialogContent className="bg-secondary" dir="rtl">
          <DialogHeader dir="rtl">
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Truck className="h-5 w-5" />
              تعيين سائق للطلب
            </DialogTitle>
            <DialogDescription className="text-right text-primary">
              اختر السائق المناسب للطلب #{selectedOrderForDriver?._id.slice(-8)}
              <br />
              <span className="text-sm font-medium">
                {selectedOrderForDriver?.governorate} -{" "}
                {selectedOrderForDriver?.city}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoadingDrivers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="mr-2">جاري تحميل السائقين...</span>
              </div>
            ) : availableDrivers.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
                <p className="text-sm text-muted-foreground">
                  لا يوجد سائقين متاحين لهذه المدينة
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  يرجى إضافة مدينة {selectedOrderForDriver?.city} إلى أحد
                  السائقين
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-base">اختر السائق</Label>
                  <Select
                    value={selectedDriver}
                    onValueChange={setSelectedDriver}
                    dir="rtl"
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="اختر سائق من القائمة" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {availableDrivers.map((driver) => (
                        <SelectItem key={driver._id} value={driver._id}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">
                              {driver.fullName}
                            </span>
                            <span className="text-sm text-muted-foreground mr-2">
                              {driver.phoneNumber}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    متاح {availableDrivers.length} سائق لهذه المدينة
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>ملاحظة:</strong> عند تعيين السائق، سيتم تحويل حالة
                    الطلب إلى "قيد المعالجة" تلقائياً
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDriverDialogOpen(false);
                setSelectedOrderForDriver(null);
                setSelectedDriver("");
                setAvailableDrivers([]);
              }}
              disabled={isAssigningDriver}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAssignDriver}
              disabled={
                isAssigningDriver ||
                !selectedDriver ||
                availableDrivers.length === 0
              }
            >
              {isAssigningDriver ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التعيين...
                </>
              ) : (
                <>
                  <CheckCircle className="ml-2 h-4 w-4" />
                  تعيين وتحويل للمعالجة
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
