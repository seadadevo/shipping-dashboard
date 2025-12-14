import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  Package, 
  Search, 
  MapPin, 
  User, 
  Calendar,
  CheckCircle2,
  Eye,
  Filter,
  Download,
  Clock
} from 'lucide-react';
import api from '../../lib/api';
import { Pagination } from '../ui/pagination';
import type { Order } from '../../types';
import { toast } from 'sonner';

interface DeliveryStats {
  todayDeliveries: number;
  weekDeliveries: number;
  monthDeliveries: number;
  totalDeliveries: number;
}

export const MyDeliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDeliveriesCount, setTotalDeliveriesCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [stats, setStats] = useState<DeliveryStats>({
    todayDeliveries: 0,
    weekDeliveries: 0,
    monthDeliveries: 0,
    totalDeliveries: 0,
  });

  useEffect(() => {
    fetchDeliveries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, dateFilter]);

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

  // Helper function to get week start (Saturday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 6 ? 0 : day + 1; // Saturday is 6
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Helper function to format date
  const formatDate = (date: Date, formatStr: string) => {
    const months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 
                    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = d.getHours() >= 12 ? 'م' : 'ص';
    const hours12 = d.getHours() % 12 || 12;

    if (formatStr === 'dd MMM yyyy') {
      return `${day} ${month} ${year}`;
    } else if (formatStr === 'hh:mm a') {
      return `${hours12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    } else if (formatStr === 'dd/MM/yyyy HH:mm') {
      return `${day}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${year} ${hours}:${minutes}`;
    }
    return date.toLocaleString('ar-EG');
  };

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page: currentPage,
        limit: 10,
        status: 'Delivered',
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      const res = await api.get('/api/drivers/my-orders', { params });
      
      if (res.data.success) {
        const orders = res.data.data || [];
        let filteredDeliveries = Array.isArray(orders) ? orders : [];

        // Apply date filter
        if (dateFilter !== 'all') {
          const now = new Date();
          filteredDeliveries = filteredDeliveries.filter((order: Order) => {
            const deliveryDate = new Date(order.updatedAt);
            
            switch (dateFilter) {
              case 'today':
                return deliveryDate.toDateString() === now.toDateString();
              case 'week': {
                const weekStart = getWeekStart(now);
                return deliveryDate >= weekStart && deliveryDate <= now;
              }
              case 'month': {
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                return deliveryDate >= monthStart && deliveryDate <= now;
              }
              default:
                return true;
            }
          });
        }

        setDeliveries(filteredDeliveries);
        setTotalPages(res.data.meta?.totalPages || 1);
        setTotalDeliveriesCount(res.data.meta?.total || filteredDeliveries.length);
        
        // Calculate statistics
        calculateStats(filteredDeliveries);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      // Don't show error toast on first load if no deliveries yet
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageDeliveryTime = (orders: Order[]): number => {
    if (orders.length === 0) return 0;
    const totalHours = orders.reduce((sum, order) => sum + calculateDeliveryTime(order), 0);
    return Math.round(totalHours / orders.length);
  };

  const calculateStats = (orders: Order[]) => {
    const now = new Date();
    const weekStart = getWeekStart(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayDeliveries = orders.filter(order => 
      new Date(order.updatedAt).toDateString() === now.toDateString()
    ).length;

    const weekDeliveries = orders.filter(order => {
      const orderDate = new Date(order.updatedAt);
      return orderDate >= weekStart && orderDate <= now;
    }).length;

    const monthDeliveries = orders.filter(order => {
      const orderDate = new Date(order.updatedAt);
      return orderDate >= monthStart && orderDate <= now;
    }).length;

    setStats({
      todayDeliveries,
      weekDeliveries,
      monthDeliveries,
      totalDeliveries: orders.length,
    });
  };

  const calculateDeliveryTime = (order: Order) => {
    const created = new Date(order.createdAt);
    
    // Try to get delivery date from stateHistory
    let deliveredDate = new Date(order.updatedAt);
    
    if (order.stateHistory && order.stateHistory.length > 0) {
      // Find the last "Delivered" state change
      const deliveredState = order.stateHistory
        .filter((h) => h.newState === 'Delivered')
        .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())[0];
      
      if (deliveredState) {
        deliveredDate = new Date(deliveredState.changedAt);
      }
    }
    
    const hoursDiff = (deliveredDate.getTime() - created.getTime()) / (1000 * 60 * 60);
    return Math.round(hoursDiff);
  };

  const formatDeliveryTime = (hours: number): string => {
    if (hours < 24) {
      return `${hours} ساعة`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (remainingHours === 0) {
      return days === 1 ? 'يوم واحد' : `${days} ${days === 2 ? 'يومان' : 'أيام'}`;
    }
    
    const daysText = days === 1 ? 'يوم' : days === 2 ? 'يومان' : `${days} أيام`;
    const hoursText = remainingHours === 1 ? 'ساعة' : remainingHours === 2 ? 'ساعتان' : `${remainingHours} ساعة`;
    
    return `${daysText} و ${hoursText}`;
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const exportDeliveries = () => {
    try {
      // Simple CSV export
      const headers = ['رقم الطلب', 'العميل', 'المدينة', 'التكلفة', 'تاريخ التسليم'];
      const rows = deliveries.map(order => [
        order.orderNumber,
        order.customerName,
        order.city,
        order.orderCost.toFixed(2),
        formatDate(new Date(order.updatedAt), 'dd/MM/yyyy HH:mm')
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      link.download = `my-deliveries-${dateStr}.csv`;
      link.click();

      toast.success('تم تصدير التوصيلات بنجاح');
    } catch {
      toast.error('فشل في تصدير التوصيلات');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحميل التوصيلات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">توصيلاتي المكتملة</h1>
          <p className="text-muted-foreground mt-1">
            سجل كامل لجميع التوصيلات التي قمت بها
          </p>
        </div>
        <Button onClick={exportDeliveries} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          تصدير التقرير
        </Button>
      </div>

      {/* Period Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-green-200 bg-secondary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي التوصيلات</p>
                <h3 className="text-3xl font-bold text-green-700 mt-2">{stats.totalDeliveries}</h3>
                <p className="text-xs text-green-600 mt-1">طلب مكتمل</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-secondary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">توصيلات اليوم</p>
                <h3 className="text-3xl font-bold text-blue-700 mt-2">{stats.todayDeliveries}</h3>
                <p className="text-xs text-blue-600 mt-1">طلب</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-secondary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">هذا الأسبوع</p>
                <h3 className="text-3xl font-bold text-purple-700 mt-2">{stats.weekDeliveries}</h3>
                <p className="text-xs text-purple-600 mt-1">طلب</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-secondary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">هذا الشهر</p>
                <h3 className="text-3xl font-bold text-orange-700 mt-2">{stats.monthDeliveries}</h3>
                <p className="text-xs text-orange-600 mt-1">طلب</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-secondary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">متوسط مدة التوصيل</p>
                <h3 className="text-2xl font-bold text-indigo-700 mt-2">
                  {formatDeliveryTime(calculateAverageDeliveryTime(deliveries))}
                </h3>
                <p className="text-xs text-indigo-600 mt-1">الوقت المتوقع</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-indigo-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>سجل التوصيلات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="ابحث برقم الطلب أو اسم العميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter} dir="rtl">
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="تصفية حسب التاريخ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل التوصيلات</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">هذا الأسبوع</SelectItem>
                <SelectItem value="month">هذا الشهر</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {deliveries.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد توصيلات مكتملة</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-right font-semibold">رقم الطلب</TableHead>
                      <TableHead className="text-right font-semibold">العميل</TableHead>
                      <TableHead className="text-right font-semibold">المدينة</TableHead>
                      <TableHead className="text-right font-semibold">التكلفة</TableHead>
                      <TableHead className="text-right font-semibold">تاريخ التسليم</TableHead>
                      <TableHead className="text-right font-semibold">مدة التوصيل</TableHead>
                      <TableHead className="text-center font-semibold">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.map((order) => {
                      const deliveredDate = new Date(order.updatedAt);
                      const hoursDiff = calculateDeliveryTime(order);
                      const isFast = hoursDiff < 24;

                      return (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {order.customerName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {order.city}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-semibold">
                              {order.orderCost.toFixed(2)} ج.م
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {formatDate(deliveredDate, 'dd MMM yyyy')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(deliveredDate, 'hh:mm a')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={isFast ? "default" : "secondary"}
                              className={isFast ? "bg-green-100 text-green-800" : ""}
                            >
                              {formatDeliveryTime(hoursDiff)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(order)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              عرض
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={10}
                    totalItems={totalDeliveriesCount}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl text-right text-blue-600">تفاصيل التوصيل #{selectedOrder?.orderNumber || selectedOrder?._id.slice(-6)}</DialogTitle>
            <DialogDescription className="text-right text-primary">
              معلومات كاملة عن التوصيل المكتمل
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 text-right">
              {/* Delivery Timeline */}
              <Card className="border-green-200 ">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-green-500 ">
                    <CheckCircle2 className="h-4 w-4" />
                    تم التسليم بنجاح
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">تاريخ الإنشاء</span>
                      <span className="font-medium">
                        {formatDate(new Date(selectedOrder.createdAt), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">تاريخ التسليم</span>
                      <span className="font-medium">
                        {formatDate(new Date(selectedOrder.updatedAt), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-semibold">إجمالي الوقت</span>
                      <Badge className="bg-green-600">
                        {formatDeliveryTime(calculateDeliveryTime(selectedOrder))}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-blue-200">
                  <CardHeader className="pb-3 bg-blue-50">
                    <CardTitle className="text-sm flex items-center text-blue-800">
                      <User className="h-4 w-4 ml-2" /> معلومات العميل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">الاسم</span>
                      <span className="font-medium">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">الهاتف</span>
                      <span className="font-medium">{selectedOrder.customerPhone1}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardHeader className="pb-3 bg-green-50">
                    <CardTitle className="text-sm flex items-center text-green-800">
                      <MapPin className="h-4 w-4 ml-2" /> العنوان
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">المحافظة</span>
                      <span className="font-medium">{selectedOrder.governorate}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">المدينة</span>
                      <span className="font-medium">{selectedOrder.city}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">الشارع</span>
                      <span className="font-medium">{selectedOrder.street}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Details */}
              <Card className="border-orange-200">
                <CardHeader className="pb-3 bg-orange-50">
                  <CardTitle className="text-sm flex items-center text-orange-800">
                    <Package className="h-4 w-4 ml-2" /> تفاصيل الطلب
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">نوع الطلب</span>
                      <span className="font-medium">{selectedOrder.orderType}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">نوع الشحن</span>
                      <span className="font-medium">{selectedOrder.shippingType}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">التكلفة</span>
                      <span className="font-medium text-lg">{selectedOrder.orderCost.toFixed(2)} جنيه</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">الوزن الإجمالي</span>
                      <span className="font-medium">{selectedOrder.totalWeight} كجم</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products */}
              {selectedOrder.products && selectedOrder.products.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">المنتجات ({selectedOrder.products.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedOrder.products.map((product) => (
                        <div key={product._id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{product.productName}</p>
                            <p className="text-sm text-muted-foreground">الكمية: {product.quantity}</p>
                          </div>
                          <Badge variant="outline">{product.weight} كجم</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
