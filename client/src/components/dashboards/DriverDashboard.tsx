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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { Package, TrendingUp, Clock, CheckCircle, Truck, Search, Eye } from 'lucide-react';
import api from '../../lib/api';
import { Pagination } from '../ui/pagination';
import type { Order, OrderState, UserRole } from '../../types';
import { toast } from 'sonner';
import { orderStateService } from '../../lib/orderStateService';
import { useAuth } from '../../hooks/useAuth';

interface DriverStats {
  todayDeliveries: number;
  weekDeliveries: number;
  totalDelivered: number;
  pendingDeliveries: number;
}

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DriverStats>({
    todayDeliveries: 0,
    weekDeliveries: 0,
    totalDelivered: 0,
    pendingDeliveries: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchStats(), fetchDeliveries()]);
      setInitialLoad(false);
    };
    loadData();
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
  }, [searchQuery]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/drivers/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const params: any = {
        status: statusFilter,
        page: currentPage,
        limit: 10,
      };
      
      if (searchQuery.trim()) {
        params.q = searchQuery;
      }
      
      const res = await api.get('/api/drivers/deliveries', { params });
      
      if (res.data.success) {
        setOrders(res.data.data);
        setTotalPages(res.data.meta.totalPages);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    const previousStatus = selectedOrder.driverStatus;

    try {
      const res = await api.patch(`/api/drivers/deliveries/${selectedOrder._id}/status`, {
        driverStatus: newStatus,
      });

      if (res.data.success) {
        // Show success notification
        const statusLabels: Record<string, string> = {
          'pending': 'قيد الانتظار',
          'picked-up': 'تم الاستلام',
          'on-the-way': 'في الطريق',
          'delivered': 'تم التسليم',
          'failed': 'فشل التسليم'
        };
        
        toast.success('تم تحديث حالة التوصيل', {
          description: `تم تغيير الحالة إلى: ${statusLabels[newStatus] || newStatus}`
        });
        
        setIsDialogOpen(false);
        fetchStats();
        fetchDeliveries();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('فشل تحديث حالة التوصيل', {
        description: 'حدث خطأ أثناء تحديث حالة التوصيل'
      });
    }
  };

  const openStatusDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.driverStatus || 'pending');
    setIsDialogOpen(true);
  };

  const openViewDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'قيد الانتظار', variant: 'secondary' },
      'picked-up': { label: 'تم الاستلام', variant: 'default' },
      'in-transit': { label: 'في الطريق', variant: 'default' },
      delivered: { label: 'تم التوصيل', variant: 'outline' },
    };
    const config = statusMap[status] || statusMap.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">لوحة تحكم السائق</h1>

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
            <CardTitle className="text-sm font-medium">توصيلات هذا الأسبوع</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekDeliveries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التوصيلات</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDelivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد التوصيل</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDeliveries}</div>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الطلبات</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="picked-up">تم الاستلام</SelectItem>
                <SelectItem value="in-transit">في الطريق</SelectItem>
                <SelectItem value="delivered">تم التوصيل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد طلبات توصيل
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>اسم العميل</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">#{order._id.slice(-6)}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.customerPhone1}</TableCell>
                      <TableCell>
                        {order.governorate} - {order.city}
                        <br />
                        <span className="text-sm text-muted-foreground">{order.street}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.driverStatus || 'pending')}</TableCell>
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
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب #{selectedOrder?._id.slice(-6)}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">معلومات العميل</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">الاسم:</span>{' '}
                      {selectedOrder.customerName}
                    </div>
                    <div>
                      <span className="text-muted-foreground">الهاتف 1:</span>{' '}
                      {selectedOrder.customerPhone1}
                    </div>
                    {selectedOrder.customerPhone2 && (
                      <div>
                        <span className="text-muted-foreground">الهاتف 2:</span>{' '}
                        {selectedOrder.customerPhone2}
                      </div>
                    )}
                    {selectedOrder.customerEmail && (
                      <div>
                        <span className="text-muted-foreground">البريد:</span>{' '}
                        {selectedOrder.customerEmail}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">معلومات التوصيل</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">المحافظة:</span>{' '}
                      {selectedOrder.governorate}
                    </div>
                    <div>
                      <span className="text-muted-foreground">المدينة:</span>{' '}
                      {selectedOrder.city}
                    </div>
                    {selectedOrder.village && (
                      <div>
                        <span className="text-muted-foreground">القرية:</span>{' '}
                        {selectedOrder.village}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">العنوان:</span>{' '}
                      {selectedOrder.street}
                    </div>
                    <div>
                      <span className="text-muted-foreground">الحالة:</span>{' '}
                      {getStatusBadge(selectedOrder.driverStatus || 'pending')}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">معلومات الطلب</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">نوع الطلب:</span>{' '}
                    {selectedOrder.orderType}
                  </div>
                  <div>
                    <span className="text-muted-foreground">نوع الشحن:</span>{' '}
                    {selectedOrder.shippingType}
                  </div>
                  <div>
                    <span className="text-muted-foreground">نوع الدفع:</span>{' '}
                    {selectedOrder.paymentType}
                  </div>
                  <div>
                    <span className="text-muted-foreground">الفرع:</span>{' '}
                    {selectedOrder.branch}
                  </div>
                  <div>
                    <span className="text-muted-foreground">التكلفة:</span>{' '}
                    {selectedOrder.orderCost} ج.م
                  </div>
                  <div>
                    <span className="text-muted-foreground">الوزن الكلي:</span>{' '}
                    {selectedOrder.totalWeight} كجم
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h4 className="font-medium mb-2">ملاحظات</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
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
                          <TableHead>المنتج</TableHead>
                          <TableHead>الكمية</TableHead>
                          <TableHead>الوزن</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.products.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell>{product.productName}</TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell>{product.weight} كجم</TableCell>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديث حالة التوصيل</DialogTitle>
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
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="picked-up">تم الاستلام</SelectItem>
                <SelectItem value="in-transit">في الطريق</SelectItem>
                <SelectItem value="delivered">تم التوصيل</SelectItem>
              </SelectContent>
            </Select>
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