import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Download,
  RefreshCw,
  MapPin,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  XCircle
} from 'lucide-react';

const orders = [
  {
    id: '#2024-001',
    customerName: 'أحمد محمد العلي',
    merchantName: 'متجر الإلكترونيات',
    recipient: 'فاطمة سعد',
    from: 'الرياض - حي العليا',
    to: 'جدة - حي الروضة',
    status: 'تم التسليم',
    weight: '1.2 كجم',
    amount: '150 ريال',
    createdDate: '2024-01-15',
    deliveryDate: '2024-01-16',
    trackingNumber: 'SH240001',
    deliveryAgent: 'خالد أحمد'
  },
  {
    id: '#2024-002',
    customerName: 'سارة محمد',
    merchantName: 'متجر الأزياء',
    recipient: 'نورا حسن',
    from: 'الدمام - حي الشاطئ',
    to: 'الرياض - حي النخيل',
    status: 'في الطريق',
    weight: '0.8 كجم',
    amount: '95 ريال',
    createdDate: '2024-01-14',
    deliveryDate: null,
    trackingNumber: 'SH240002',
    deliveryAgent: 'محمد علي'
  },
  {
    id: '#2024-003',
    customerName: 'عبدالله سالم',
    merchantName: 'متجر الكتب',
    recipient: 'أحمد عبدالله',
    from: 'جدة - حي البلد',
    to: 'مكة المكرمة - حي العزيزية',
    status: 'قيد المعالجة',
    weight: '2.1 كجم',
    amount: '220 ريال',
    createdDate: '2024-01-14',
    deliveryDate: null,
    trackingNumber: 'SH240003',
    deliveryAgent: null
  },
  {
    id: '#2024-004',
    customerName: 'مريم أحمد',
    merchantName: 'متجر الهدايا',
    recipient: 'زينب محمد',
    from: 'المدينة المنورة - حي قباء',
    to: 'تبوك - وسط المدينة',
    status: 'ملغي',
    weight: '0.5 كجم',
    amount: '75 ريال',
    createdDate: '2024-01-13',
    deliveryDate: null,
    trackingNumber: 'SH240004',
    deliveryAgent: null
  },
  {
    id: '#2024-005',
    customerName: 'يوسف عمر',
    merchantName: 'متجر الرياضة',
    recipient: 'سلمان خالد',
    from: 'الطائف - حي الشفا',
    to: 'الباحة - وسط المدينة',
    status: 'معلق',
    weight: '3.5 كجم',
    amount: '180 ريال',
    createdDate: '2024-01-13',
    deliveryDate: null,
    trackingNumber: 'SH240005',
    deliveryAgent: 'عمر سعد'
  },
  {
    id: '#2024-006',
    customerName: 'هند فاطمة',
    merchantName: 'متجر العطور',
    recipient: 'ليلى أحمد',
    from: 'الخبر - حي الراكة',
    to: 'الدمام - حي الفيصلية',
    status: 'تم التسليم',
    weight: '0.3 كجم',
    amount: '120 ريال',
    createdDate: '2024-01-12',
    deliveryDate: '2024-01-13',
    trackingNumber: 'SH240006',
    deliveryAgent: 'أحمد محمد'
  }
];

const statusOptions = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'قيد المعالجة', label: 'قيد المعالجة' },
  { value: 'في الطريق', label: 'في الطريق' },
  { value: 'تم التسليم', label: 'تم التسليم' },
  { value: 'معلق', label: 'معلق' },
  { value: 'ملغي', label: 'ملغي' }
];

export function OrderManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'تم التسليم': return <CheckCircle className="h-4 w-4" />;
      case 'في الطريق': return <Truck className="h-4 w-4" />;
      case 'قيد المعالجة': return <Clock className="h-4 w-4" />;
      case 'معلق': return <AlertCircle className="h-4 w-4" />;
      case 'ملغي': return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'تم التسليم': return 'bg-green-100 text-green-800';
      case 'في الطريق': return 'bg-blue-100 text-blue-800';
      case 'قيد المعالجة': return 'bg-yellow-100 text-yellow-800';
      case 'معلق': return 'bg-orange-100 text-orange-800';
      case 'ملغي': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    'قيد المعالجة': orders.filter(o => o.status === 'قيد المعالجة').length,
    'في الطريق': orders.filter(o => o.status === 'في الطريق').length,
    'تم التسليم': orders.filter(o => o.status === 'تم التسليم').length,
    'معلق': orders.filter(o => o.status === 'معلق').length,
    'ملغي': orders.filter(o => o.status === 'ملغي').length
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    console.log('تغيير حالة الطلب:', orderId, 'إلى:', newStatus);
    // هنا يتم تحديث حالة الطلب في قاعدة البيانات
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
        <div className="flex space-x-2 space-x-reverse">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">إجمالي الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">قيد المعالجة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts['قيد المعالجة']}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">في الطريق</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts['في الطريق']}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">تم التسليم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts['تم التسليم']}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">مشاكل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statusCounts['معلق'] + statusCounts['ملغي']}
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
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في الطلبات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8 text-right"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              تصفية متقدمة
            </Button>
          </div>

          {/* الجدول */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الطلب</TableHead>
                  <TableHead className="text-right">التاجر</TableHead>
                  <TableHead className="text-right">المستقبل</TableHead>
                  <TableHead className="text-right">من - إلى</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{order.id}</p>
                        <p className="text-xs text-muted-foreground">{order.trackingNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.merchantName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{order.recipient}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p><strong>من:</strong> {order.from}</p>
                        <p><strong>إلى:</strong> {order.to}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(order.status)} flex items-center w-fit`}>
                        {getStatusIcon(order.status)}
                        <span className="mr-1">{order.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{order.amount}</TableCell>
                    <TableCell>{order.createdDate}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                            <Eye className="mr-2 h-4 w-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            تعديل الطلب
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(order.id, 'قيد المعالجة')}
                            disabled={order.status === 'قيد المعالجة'}
                          >
                            تغيير إلى قيد المعالجة
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(order.id, 'في الطريق')}
                            disabled={order.status === 'في الطريق'}
                          >
                            تغيير إلى في الطريق
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(order.id, 'تم التسليم')}
                            disabled={order.status === 'تم التسليم'}
                          >
                            تغيير إلى تم التسليم
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            إلغاء الطلب
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد طلبات تطابق معايير البحث</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة عرض تفاصيل الطلب */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب {selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              عرض جميع تفاصيل الطلب والحالة الحالية
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* معلومات أساسية */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      معلومات التاجر
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>اسم التاجر:</strong> {selectedOrder.merchantName}</p>
                    <p><strong>اسم العميل:</strong> {selectedOrder.customerName}</p>
                    <p><strong>رقم التتبع:</strong> {selectedOrder.trackingNumber}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      معلومات الشحن
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>المستقبل:</strong> {selectedOrder.recipient}</p>
                    <p><strong>من:</strong> {selectedOrder.from}</p>
                    <p><strong>إلى:</strong> {selectedOrder.to}</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* تفاصيل الطلب */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      تفاصيل الطرد
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>الوزن:</strong> {selectedOrder.weight}</p>
                    <p><strong>المبلغ:</strong> {selectedOrder.amount}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      التواريخ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>تاريخ الإنشاء:</strong> {selectedOrder.createdDate}</p>
                    <p><strong>تاريخ التسليم:</strong> {selectedOrder.deliveryDate || 'لم يتم التسليم بعد'}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      {getStatusIcon(selectedOrder.status)}
                      <span className="mr-2">الحالة الحالية</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge className={`${getStatusColor(selectedOrder.status)} text-base p-2`}>
                      {selectedOrder.status}
                    </Badge>
                    {selectedOrder.deliveryAgent && (
                      <p><strong>مندوب التوصيل:</strong> {selectedOrder.deliveryAgent}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}