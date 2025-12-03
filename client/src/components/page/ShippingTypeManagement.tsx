import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import { Pagination } from "../ui/pagination";
import type { ApiError } from "../../types"; // افترض أن لديك هذا النوع

// --- استيراد مكونات UI ---
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";

// --- استيراد الأيقونات ---
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Truck,
  DollarSign,
  FileText,
} from "lucide-react";

// --- تعريف نوع البيانات ---
interface ShippingType {
  _id: string;
  name: string;
  adjustmentAmount: number;
  description?: string;
  isActive: boolean;
}

// --- بيانات الفورم المبدئية ---
const initialState = {
  name: "",
  adjustmentAmount: 0,
  description: "",
};

export function ShippingTypeManagement() {
  const [types, setTypes] = useState<ShippingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- حالات لإدارة الـ Dialog ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ShippingType | null>(null);
  const [formData, setFormData] = useState(initialState);

  // --- حالات لتأكيد الحذف ---
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<string | null>(null);

  // --- 1. جلب البيانات ---
  const fetchTypes = async (page = 1, limit = itemsPerPage) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/shipping-types?page=${page}&limit=${limit}`);
      const payload = res.data?.data || [];
      setTypes(Array.isArray(payload) ? payload : payload);
      setCurrentPage(res.data?.meta?.page || page);
      setTotalPages(res.data?.meta?.totalPages || 1);
      setTotalItems(res.data?.meta?.total || payload.length);
      setItemsPerPage(res.data?.meta?.limit || limit);
    } catch (err) {
      setError("فشل جلب أنواع الشحن.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes(currentPage, itemsPerPage);
  }, []);

  // --- 2. فتح الـ Dialog (إما للإضافة أو التعديل) ---
  const handleOpenDialog = (type: ShippingType | null = null) => {
    setError(null);
    setSuccess(null);
    if (type) {
      // وضع التعديل
      setEditingType(type);
      setFormData({
        name: type.name,
        adjustmentAmount: type.adjustmentAmount,
        description: type.description || "",
      });
    } else {
      // وضع الإضافة
      setEditingType(null);
      setFormData(initialState);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingType(null);
  };

  // --- 3. حفظ التغييرات (إضافة أو تعديل) ---
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingType) {
        // --- تحديث (PUT) ---
        const res = await api.put(
          `/api/shipping-types/${editingType._id}`,
          formData
        );
        // تحديث العنصر في القائمة محلياً
        setTypes(
          types.map((t) => (t._id === editingType._id ? res.data.data : t))
        );
        setSuccess("تم تحديث النوع بنجاح");
      } else {
        // --- إضافة (POST) ---
        const res = await api.post("/api/shipping-types", formData);
        // إضافة العنصر الجديد للقائمة محلياً
        setTypes([...types, res.data.data]);
        setSuccess("تم إضافة النوع بنجاح");
      }
      handleCloseDialog();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setLoading(false);
    }
  };

  // --- 4. تفعيل / تعطيل (Toggle) ---
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    // تحديث الواجهة أولاً (Optimistic Update)
    setTypes(
      (
        prevTypes // <-- بدلاً من (types)
      ) =>
        prevTypes.map((t) =>
          t._id === id ? { ...t, isActive: !currentStatus } : t
        )
    );

    try {
      await api.patch(`/api/shipping-types/toggle/${id}`);
    } catch (err) {
      // إعادة الحالة عند الفشل
      setTypes(
        (
          prevTypes // <-- بدلاً من (types)
        ) =>
          prevTypes.map((t) =>
            t._id === id ? { ...t, isActive: currentStatus } : t
          )
      );
      setError("فشل تحديث الحالة. يرجى المحاولة مرة أخرى.");
    }
  };

  // --- 5. الحذف ---
  const openDeleteConfirm = (id: string) => {
    setTypeToDelete(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!typeToDelete) return;

    setLoading(true);
    try {
      await api.delete(`/api/shipping-types/${typeToDelete}`);
      setTypes(types.filter((t) => t._id !== typeToDelete));
      setSuccess("تم الحذف بنجاح");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || "فشل الحذف");
    } finally {
      setLoading(false);
      setIsDeleteAlertOpen(false);
      setTypeToDelete(null);
    }
  };

  // --- دالة مساعدة لتنسيق السعر ---
  const formatAdjustment = (amount: number) => {
    if (amount > 0) {
      return (
        <Badge variant="destructive" className="text-xs text-black">
          +{amount.toFixed(2)} جنيه
        </Badge>
      );
    }
    if (amount < 0) {
      return (
        <Badge variant="default" className="text-xs bg-green-600">
          {amount.toFixed(2)} جنيه
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        مجاني
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* --- العنوان --- */}
      <div>
        <h1>إدارة أنواع الشحن</h1>
        <p className="text-muted-foreground">
          إضافة وتعديل أنواع الشحن (عادي، سريع، إلخ) وقيمة التعديل الخاصة بها
        </p>
      </div>

      {/* --- رسائل الخطأ والنجاح --- */}
      {success && (
        <Alert
          variant="default"
          className="bg-green-50 border-green-200 text-green-800"
        >
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>نجاح</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>خطأ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* --- جدول العرض --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Truck className="h-5 w-5 ml-2" />
              أنواع الشحن الحالية
            </CardTitle>
            <CardDescription>
              عرض وتعديل الأنواع المتاحة في النظام
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog(null)}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة نوع جديد
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-center">قيمة التعديل</TableHead>
                  <TableHead className="text-center">مفعل</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      جاري تحميل البيانات...
                    </TableCell>
                  </TableRow>
                ) : types.length > 0 ? (
                  types.map((type) => (
                    <TableRow key={type._id}>
                      <TableCell className="font-medium text-primary">{type.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {type.description || "لا يوجد وصف"}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAdjustment(type.adjustmentAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={type.isActive}
                          onCheckedChange={() =>
                            handleToggleStatus(type._id, type.isActive)
                          }
                          aria-label="Toggle status"
                        />
                      </TableCell>
                      <TableCell className="text-center space-x-2 space-x-reverse">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                        className="mr-2"
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteConfirm(type._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      لم يتم العثور على أي أنواع شحن.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <div className="p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => {
              setCurrentPage(p);
              fetchTypes(p, itemsPerPage);
            }}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
              fetchTypes(1, n);
            }}
          />
        </div>
      </Card>

      {/* --- Dialog للإضافة والتعديل --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-background"  dir="rtl">
          <DialogHeader className="text-center">
            <DialogTitle className='text-primary text-center text-blue-600'>
              {editingType ? "تعديل نوع الشحن" : "إضافة نوع شحن جديد"}
            </DialogTitle>
            <DialogDescription className='text-center text-primary'>
              {editingType
                ? "قم بتحديث بيانات نوع الشحن."
                : "أدخل بيانات نوع الشحن الجديد."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4" dir="rtl">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center">
                <Truck className="h-4 w-4 mr-2" />
                اسم النوع
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="مثال: شحن سريع (24 ساعة)"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustmentAmount" className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                قيمة التعديل (جنيه)
              </Label>
              <Input
                id="adjustmentAmount"
                type="number"
                step="0.5"
                value={formData.adjustmentAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    adjustmentAmount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                className="text-right"
              />
              <p className="text-xs text-muted-foreground">
                أدخل قيمة موجبة للإضافة (مثل 50) أو سالبة للخصم (مثل -20) أو 0
                للنوع العادي.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                الوصف (اختياري)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="مثال: توصيل خلال 24 ساعة للمناطق المحددة"
                className="text-right"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading
                ? "جاري الحفظ..."
                : editingType
                ? "حفظ التعديلات"
                : "إضافة النوع"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- AlertDialog لتأكيد الحذف --- */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent  className="bg-background"  dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary text-right text-blue-600">هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription className='text-right text-primary'>
              هل تريد بالتأكيد حذف نوع الشحن هذا؟ لا يمكن التراجع عن هذا
              الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
