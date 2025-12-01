import { useState, useEffect } from "react";
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

const statusLabels: Record<string, string> = {
  Pending: "قيد الانتظار",
  Processing: "قيد المعالجة",
  Shipped: "في الطريق",
  Delivered: "تم التسليم",
  Cancelled: "ملغي",
  all: "جميع الحالات",
};

const statusOptions = [
  { value: "all", label: "جميع الحالات" },
  { value: "Pending", label: statusLabels.Pending },
  { value: "Processing", label: statusLabels.Processing },
  { value: "Shipped", label: statusLabels.Shipped },
  { value: "Delivered", label: statusLabels.Delivered },
  { value: "Cancelled", label: statusLabels.Cancelled },
];

export function OrderManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { user } = useAuth();
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // --- (🚀 تعديل: fetchOrders الآن تستخدم الفلاتر لإرسالها للـ API) ---
  const fetchOrders = async (page = currentPage, limit = itemsPerPage) => {
    setLoading(true);
    setError(null);
    try {
      // (⭐ تعديل): قمنا بإضافة params لإرسال الفلاتر للباك إند
      const response = await api.get<GetOrdersResponse>("/api/orders", {
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
      setTotalItems(response.data?.meta?.total || response.data.data.orders.length);
      setItemsPerPage(response.data?.meta?.limit || limit);
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || "فشل في جلب الطلبات.");
    } finally {
      setLoading(false);
    }
  };

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

  // --- (تعديل: إحصائيات الطلبات) ---
  // (⭐ تعديل): هذه الإحصائيات يجب أن تُحسب من القائمة القادمة من الباك إند
  // إذا أردت إحصائيات *للنظام كله*، ستحتاج لـ endpoint جديد
  // هذا الكود سيحسب الإحصائيات من القائمة المفلترة (مثال: "يوجد 5 طلبات قيد الانتظار تطابق بحثك")
  const statusCounts = {
    Pending: allOrders.filter((o) => o.status === "Pending").length,
    Processing: allOrders.filter((o) => o.status === "Processing").length,
    Shipped: allOrders.filter((o) => o.status === "Shipped").length,
    Delivered: allOrders.filter((o) => o.status === "Delivered").length,
    Cancelled: allOrders.filter((o) => o.status === "Cancelled").length,
  };
  // (ملحوظة: لحساب إحصائيات *كل* الطلبات بغض النظر عن الفلتر، ستحتاج لجلبها بـ API call منفصل)

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
      fetchOrders(); // (⭐ تعديل): نستخدم fetchOrders المحدثة
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || "فشل في حذف الطلب.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(orderId);
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      fetchOrders(); // (⭐ تعديل): نستخدم fetchOrders المحدثة
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setIsUpdatingStatus(null);
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
          <Button variant="outline" className="ml-2" onClick={() => exportOrdersToExcel(allOrders, `طلبات-${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.csv`)}>
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
          {/* (⭐ تعديل): زر التحديث الآن يستدعي fetchOrders المحدثة */}
          <Button variant="outline" onClick={fetchOrders} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            تحديث
          </Button>
        </div>
      </div>

      {/* ... (الإحصائيات السريعة) ... */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">إجمالي الطلبات (المطابقة)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allOrders.length}</div>
          </CardContent>
        </Card>
        {/* ... (باقي كروت الإحصائيات) ... */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">قيد الانتظار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statusCounts["Pending"]}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">قيد المعالجة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts["Processing"]}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">تم التسليم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statusCounts["Delivered"]}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">ملغي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statusCounts["Cancelled"]}
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

            <Select value={statusFilter} onValueChange={setStatusFilter} dir="rtl">
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
                            {order.createdBy.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.createdBy.userType}
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
                          <DropdownMenuContent className="bg-background" align="end" dir="rtl">
                            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleViewOrder(order)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              عرض التفاصيل
                            </DropdownMenuItem>

                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger
                                disabled={isUpdatingStatus === order._id}
                              >
                                {isUpdatingStatus === order._id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                تغيير الحالة
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent className="bg-background" dir="rtl">
                                  {statusOptions
                                    .filter((s) => s.value !== "all")
                                    .map((status) => (
                                      <DropdownMenuItem
                                        key={status.value}
                                        onClick={() =>
                                          handleStatusChange(
                                            order._id,
                                            status.value
                                          )
                                        }
                                        disabled={
                                          order.status === status.value ||
                                          !!isUpdatingStatus
                                        }
                                      >
                                        {status.label}
                                      </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>

                            {user?.userType === "employee" && (
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
      <Dialog  open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
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
            <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
              {/* معلومات أساسية */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <User className="h-5 w-5 mr-2" /> معلومات العميل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>
                      <strong>الاسم:</strong> {selectedOrder.customerName}
                    </p>
                    <p>
                      <strong>الهاتف 1:</strong> {selectedOrder.customerPhone1}
                    </p>
                    {selectedOrder.customerPhone2 && (
                      <p>
                        <strong>الهاتف 2:</strong>{" "}
                        {selectedOrder.customerPhone2}
                      </p>
                    )}
                    {selectedOrder.customerEmail && (
                      <p>
                        <strong>الإيميل:</strong> {selectedOrder.customerEmail}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <MapPin className="h-5 w-5 mr-2" /> معلومات العنوان
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>
                      <strong>المحافظة:</strong> {selectedOrder.governorate}
                    </p>
                    <p>
                      <strong>المدينة:</strong> {selectedOrder.city}
                    </p>
                    <p>
                      <strong>الشارع:</strong> {selectedOrder.street}
                    </p>
                    {selectedOrder.village && (
                      <p>
                        <strong>القرية:</strong> {selectedOrder.village}
                      </p>
                    )}
                    {selectedOrder.isVillageDelivery && (
                      <Badge variant="outline">توصيل لقرية</Badge>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-blue-200">
        <CardHeader className="pb-3 bg-blue-100/50 rounded-t-lg">
          <CardTitle className="text-base flex items-center text-blue-800">
             <User className="h-5 w-5 mr-2" /> 
             بيانات التاجر (المرسل)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 pt-4">
          <div>
             <p className="text-sm text-muted-foreground">اسم التاجر/الموظف</p>
             <p className="font-medium">{selectedOrder.createdBy.fullName}</p>
             <Badge variant="secondary" className="mt-1">{selectedOrder.createdBy.userType}</Badge>
          </div>
          
          <div>
             <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
             <p className="font-medium">{selectedOrder.createdBy.email}</p>
          </div>

          <div>
             <p className="text-sm text-muted-foreground">رقم الهاتف</p>
             <p className="font-medium">{selectedOrder.createdBy.phone || "غير متوفر"}</p>
          </div>

          {/* عرض اسم المتجر لو كان تاجر */}
          {selectedOrder.createdBy.storeName && (
            <div>
               <p className="text-sm text-muted-foreground">اسم المتجر</p>
               <p className="font-medium">{selectedOrder.createdBy.storeName}</p>
            </div>
          )}
        </CardContent>
      </Card>
              </div>

              {/* تفاصيل الطلب */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">تفاصيل الشحن</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>
                      <strong>نوع الطلب:</strong> {selectedOrder.orderType}
                    </p>
                    <p>
                      <strong>نوع الشحن:</strong> {selectedOrder.shippingType}
                    </p>
                    <p>
                      <strong>الفرع:</strong> {selectedOrder.branch}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">الدفع والوزن</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>
                      <strong>نوع الدفع:</strong> {selectedOrder.paymentType}
                    </p>
                    <p>
                      <strong>تكلفة الطلب:</strong>{" "}
                      {selectedOrder.orderCost.toFixed(2)} جنيه
                    </p>
                    <p>
                      <strong>إجمالي الوزن:</strong> {selectedOrder.totalWeight}{" "}
                      كجم
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">الحالة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge
                      className={`${getStatusColor(
                        selectedOrder.status
                      )} text-base p-2`}
                    >
                      {statusLabels[selectedOrder.status] ||
                        selectedOrder.status}
                    </Badge>
                    <p>
                      <strong>أنشئ بواسطة:</strong>{" "}
                      {selectedOrder.createdBy.fullName}
                    </p>
                    <p>
                      <strong>تاريخ الإنشاء:</strong>{" "}
                      {new Date(selectedOrder.createdAt).toLocaleString(
                        "ar-EG"
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* المنتجات */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    المنتجات ({selectedOrder.products.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم المنتج</TableHead>
                        <TableHead className="text-center">الكمية</TableHead>
                        <TableHead className="text-center">
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
    </div>
  );
}