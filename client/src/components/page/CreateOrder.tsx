import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  AlertCircle, 
  CheckCircleIcon, 
  Search, 
  X, 
  Package, 
  User as UserIcon, 
  MapPin, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Store,
  Edit2,
  DollarSign,
  Weight,
  Loader2
} from 'lucide-react';
import api from '../../lib/api';
import type { 
  ApiError, 
  AddOrderResponse,
  Governorate,
  City,
  ShippingType as ShippingTypeData,
} from '../../types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { useAuth } from '../../hooks/useAuth';

const branches = ["القاهرة", "الجيزة", "الاسكندرية", "الشرقية", "اسوان"];
const paymentTypes = ["واجبة التحصيل", "دفع مقدم", "طرد مقابل طرد"];
const orderTypes = ["استلام من المتجر", "من الباب للباب", "من المستودع"];

interface Product {
  id: string;
  name: string;
  quantity: number;
  weight: number;
}

interface MerchantResult {
    _id: string;
    fullName: string;
    storeName?: string;
    phone: string;
}

export function CreateOrder() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  
  const [governoratesList, setGovernoratesList] = useState<Governorate[]>([]);
  const [shippingTypesList, setShippingTypesList] = useState<ShippingTypeData[]>([]);
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  
  // Driver selection
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);


 
  const [merchantSearchQuery, setMerchantSearchQuery] = useState("");
  const [merchantResults, setMerchantResults] = useState<MerchantResult[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantResult | null>(null);
  const [isSearchingMerchant, setIsSearchingMerchant] = useState(false);
  const [showMerchantList, setShowMerchantList] = useState(false);

  const [formData, setFormData] = useState({
    type: '',
    customerName: '',
    phone: '',
    phone2: '',
    email: '',
    governorateName: '',
    cityName: '',
    village: '',
    street: '',
    villageDelivery: false,
    shippingType: '',
    paymentType: '',
    totalWeight: '0',
    notes: '',
    assignedDriver: ''
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 1, weight: 0 });

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingLists(true);
      try {
        const [govRes, shipRes] = await Promise.all([
          api.get('/api/locations/governorates'),
          api.get('/api/shipping-types')
        ]);
        setGovernoratesList(govRes.data.data.filter((g: Governorate) => g.isActive));
        setShippingTypesList(shipRes.data.data.filter((s: ShippingTypeData) => s.isActive));
      } catch (err) {
        setError('فشل في تحميل البيانات الأساسية.');
      } finally {
        setIsLoadingLists(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (merchantSearchQuery.trim().length > 1 && !selectedMerchant) {
        setIsSearchingMerchant(true);
        try {
            const res = await api.get(`/api/users/merchants/search?q=${merchantSearchQuery}`);
            setMerchantResults(res.data.data);
            setShowMerchantList(true);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearchingMerchant(false);
        }
      } else {
        setMerchantResults([]);
        setShowMerchantList(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [merchantSearchQuery, selectedMerchant]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGovernorateChange = async (governorateName: string) => {
    handleInputChange('governorateName', governorateName);
    handleInputChange('cityName', '');
    setAvailableDrivers([]);
    setAvailableCities([]);
    const selectedGov = governoratesList.find(g => g.govName === governorateName);
    if (!selectedGov) return;
    try {
      const res = await api.get(`/api/locations/governorates/${selectedGov._id}/cities`);
      setAvailableCities(res.data.data);
    } catch (err) { setError('فشل في تحميل المدن'); }
  };

  const handleCityChange = async (cityName: string) => {
    handleInputChange('cityName', cityName);
    
    // Fetch available drivers for this city
    if (formData.governorateName && cityName) {
      try {
        const res = await api.get(`/api/drivers/by-city?governorate=${formData.governorateName}&city=${cityName}`);
        setAvailableDrivers(res.data.data);
      } catch (err) {
        console.error('Failed to fetch drivers:', err);
        setAvailableDrivers([]);
      }
    }
  };

  const calculateTotalWeight = () => products.reduce((t, p) => t + (p.quantity * p.weight), 0);

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.quantity > 0 && newProduct.weight > 0) {
      const product: Product = {
        id: Date.now().toString(),
        name: newProduct.name,
        quantity: newProduct.quantity,
        weight: newProduct.weight
      };
      setProducts([...products, product]);
      handleInputChange('totalWeight', (calculateTotalWeight() + (newProduct.quantity * newProduct.weight)).toString());
      setNewProduct({ name: '', quantity: 1, weight: 0 });
      setIsAddingProduct(false);
    }
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    const newWeight = updated.reduce((t, p) => t + (p.quantity * p.weight), 0);
    handleInputChange('totalWeight', newWeight.toString());
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (['admin', 'employee'].includes(user?.userType || '') && !selectedMerchant) {
        setError('يجب تحديد التاجر صاحب الطلب أولاً');
        return;
    }

    const requiredFields = ['type', 'customerName', 'phone', 'governorateName', 'cityName', 'street', 'shippingType', 'paymentType'];
    const missing = requiredFields.filter(f => !formData[f as keyof typeof formData]);
    
    if (missing.length > 0) return setError(`يرجى ملء الحقول المطلوبة: ${missing.join(', ')}`);
    if (products.length === 0) return setError('يجب إضافة منتج واحد على الأقل');

    setLoading(true);
    try {
      const payload = {
        orderType: formData.type,
        customerName: formData.customerName,
        customerPhone1: formData.phone,
        customerPhone2: formData.phone2,
        customerEmail: formData.email,
        governorate: formData.governorateName,
        city: formData.cityName, 
        village: formData.village,
        street: formData.street,
        isVillageDelivery: formData.villageDelivery,
        shippingType: formData.shippingType,
        paymentType: formData.paymentType,
        totalWeight: calculateTotalWeight(),
        notes: formData.notes,
        products: products.map(p => ({ productName: p.name, quantity: p.quantity, weight: p.weight })),
        merchantId: selectedMerchant ? selectedMerchant._id : undefined,
        assignedDriver: (formData.assignedDriver && formData.assignedDriver !== 'none') ? formData.assignedDriver : undefined
      };
      
      await api.post<AddOrderResponse>('/api/orders/add', payload);
      setSuccess('تم إنشاء الطلب بنجاح!');
      setLoading(false);
    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || 'خطأ في إنشاء الطلب');
      setLoading(false);
    }
  };

  const handleSelectMerchant = (merchant: MerchantResult) => {
      setSelectedMerchant(merchant);
      setMerchantSearchQuery(""); 
      setShowMerchantList(false);
  };

  const handleClearMerchant = () => {
      setSelectedMerchant(null);
      setMerchantSearchQuery("");
      setMerchantResults([]);
  };

  if (isLoadingLists) return (
    <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-muted-foreground">جاري تحميل البيانات...</p>
    </div>
  );

  return (
   
    <div className="space-y-8  mx-auto pb-12">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-blue-600">إنشاء طلب جديد</h1>
        <p className="text-gray-500">قم بملء البيانات التالية لإنشاء طلب شحن جديد وإضافته للنظام.</p>
      </div>

      {success && (
        <Alert className='bg-green-50 border-green-200 text-green-800'>
            <CheckCircleIcon className='h-4 w-4' />
            <AlertTitle>تم بنجاح</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      
      {['admin', 'employee'].includes(user?.userType || '') && (
          <Card className={`border-2 shadow-sm transition-all ${selectedMerchant ? 'border-green-500 bg-green-50/30' : 'border-secondary'}`}>
            <CardHeader className='pb-4 border-b mb-4 bg-secondary'>
                <CardTitle className="text-lg flex items-center ">
                    <Store className="h-5 w-5 mx-2 text-blue-800" />
                    1. تحديد التاجر (المرسل) <span className="text-red-500 mr-1 text-sm">*</span>
                </CardTitle>
                <CardDescription>ابحث واختر التاجر الذي سيتم تسجيل الطلب باسمه.</CardDescription>
            </CardHeader>
            <CardContent>
                {selectedMerchant ? (
                    <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                        <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="bg-green-100 p-3 rounded-full">
                                <Store className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-800">{selectedMerchant.fullName}</h4>
                                <div className="flex text-sm text-muted-foreground space-x-3 space-x-reverse mt-1">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded">{selectedMerchant.phone}</span>
                                    {selectedMerchant.storeName && (
                                        <span className="text-blue-600 font-medium">{selectedMerchant.storeName}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleClearMerchant} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Edit2 className="h-4 w-4 mr-2" />
                            تغيير
                        </Button>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="relative">
                            <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                            <Input 
                                placeholder="ابحث بالاسم، اسم المتجر، أو الهاتف (مثال: أحمد مجدي)"
                                className="pr-10 text-right h-12 text-lg border-gray-300 focus:border-blue-500"
                                value={merchantSearchQuery}
                                onChange={(e) => setMerchantSearchQuery(e.target.value)}
                            />
                        </div>

                        {showMerchantList && (
                            <div className="absolute w-full z-50 mt-2 bg-white border rounded-md shadow-xl max-h-60 overflow-auto">
                                {merchantResults.length > 0 ? (
                                    merchantResults.map((merchant) => (
                                        <div 
                                            key={merchant._id}
                                            onClick={() => handleSelectMerchant(merchant)}
                                            className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between items-center group transition-colors"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium group-hover:text-blue-700">{merchant.fullName}</span>
                                                {merchant.storeName && <span className="text-xs text-muted-foreground">{merchant.storeName}</span>}
                                            </div>
                                            <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">{merchant.phone}</span>
                                        </div>
                                    ))
                                ) : (
                                    !isSearchingMerchant && merchantSearchQuery.length > 1 && (
                                        <div className="p-4 text-center text-muted-foreground">لا يوجد تاجر بهذا الاسم</div>
                                    )
                                )}
                                {isSearchingMerchant && (
                                    <div className="p-4 text-center text-blue-600 flex items-center justify-center">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> جاري البحث...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
          </Card>
      )}

     
      <Card className="shadow-sm">
          <CardHeader className="bg-secondary border-b pb-4 mb-4">
              <CardTitle className='flex items-center text-lg'><UserIcon className='h-5 w-5 mx-2 text-blue-600'/> 2. معلومات العميل (المستلم)</CardTitle>
          </CardHeader>
          <CardContent className='space-y-5'>
              <div className='grid gap-6 md:grid-cols-2'>
                  <div className='space-y-2'>
                      <Label className="text-base">نوع الطلب <span className="text-red-500">*</span></Label>
                      <Select value={formData.type} onValueChange={(v) => handleInputChange('type', v)} dir="rtl">
                          <SelectTrigger className="h-11"><SelectValue placeholder="اختر نوع الطلب" /></SelectTrigger>
                          <SelectContent className='bg-background'>{orderTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
                  <div className='space-y-2'>
                      <Label className="text-base">اسم العميل (المستلم) <span className="text-red-500">*</span></Label>
                      <Input 
                          value={formData.customerName} 
                          onChange={(e)=>handleInputChange('customerName', e.target.value)} 
                          className='text-right h-11' 
                          placeholder='مثال: محمد أحمد محمود'
                      />
                  </div>
              </div>
              <div className='grid gap-6 md:grid-cols-3'>
                  <div className='space-y-2'>
                      <Label className="text-base">رقم الهاتف <span className="text-red-500">*</span></Label>
                      <Input 
                          value={formData.phone} 
                          onChange={(e)=>handleInputChange('phone', e.target.value)} 
                          className='text-right h-11' 
                          placeholder='010xxxxxxxxx'
                      />
                  </div>
                  <div className='space-y-2'>
                      <Label className="text-base">رقم هاتف 2 (اختياري)</Label>
                      <Input 
                          value={formData.phone2} 
                          onChange={(e)=>handleInputChange('phone2', e.target.value)} 
                          className='text-right h-11' 
                          placeholder='011xxxxxxxxx'
                      />
                  </div>
                  <div className='space-y-2'>
                      <Label className="text-base">البريد الإلكتروني (اختياري)</Label>
                      <Input 
                          value={formData.email} 
                          onChange={(e)=>handleInputChange('email', e.target.value)} 
                          className='text-right h-11' 
                          placeholder='client@example.com'
                      />
                  </div>
              </div>
          </CardContent>
      </Card>

     
      <Card className="shadow-sm">
          <CardHeader className="bg-secondary border-b pb-4 mb-4">
              <CardTitle className='flex items-center text-lg'><MapPin className='h-5 w-5 mx-2 text-orange-600'/> 3. عنوان التوصيل</CardTitle>
          </CardHeader>
          <CardContent className='space-y-5'>
              <div className='grid gap-6 md:grid-cols-2'>
                  <div className='space-y-2'>
                      <Label className="text-base">المحافظة <span className="text-red-500">*</span></Label>
                      <Select value={formData.governorateName} onValueChange={handleGovernorateChange} dir='rtl'>
                          <SelectTrigger className="h-11"><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                          <SelectContent className='bg-background'>{governoratesList.map(g => <SelectItem key={g._id} value={g.govName}>{g.govName}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
                  <div className='space-y-2'>
                      <Label className="text-base">المدينة <span className="text-red-500">*</span></Label>
                      <Select value={formData.cityName} onValueChange={handleCityChange} disabled={availableCities.length===0} dir="rtl">
                          <SelectTrigger className="h-11"><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                          <SelectContent className='bg-background'>
                              {availableCities.map(c => (
                                  <SelectItem key={c._id} value={c.cityName}>
                                      <div className="flex justify-between w-full gap-4">
                                          <span>{c.cityName}</span>
                                          <Badge variant="secondary" className="text-xs">{c.shippingCost} ج.م</Badge>
                                      </div>
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <div className='grid gap-6 md:grid-cols-3'>
                <div className='space-y-2'>
                    <Label className="text-base">القرية (اختياري)</Label>
                    <Input 
                        value={formData.village} 
                        onChange={(e)=>handleInputChange('village', e.target.value)} 
                        className='text-right h-11'
                        placeholder="اسم القرية إن وجدت"
                        disabled={!formData.villageDelivery} // هنا نمنع الكتابة إذا لم يتم تفعيل checkbox
                    />
                </div>
                <div className='space-y-2 md:col-span-2'>
                    <Label className="text-base">الشارع / العنوان بالتفصيل <span className="text-red-500">*</span></Label>
                    <Input 
                        value={formData.street} 
                        onChange={(e)=>handleInputChange('street', e.target.value)} 
                        className='text-right h-11'
                        placeholder="مثال: 15 شارع الجمهورية، بجوار المسجد الكبير، الدور الثاني"
                    />
                </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse bg-orange-50 p-4 rounded-md border border-orange-100">
                <Checkbox 
                    id="villageDelivery" 
                    className='ml-2 border-orange-500' 
                    checked={formData.villageDelivery} 
                    onCheckedChange={(c) => handleInputChange('villageDelivery', c as boolean)} 
                />
                <Label htmlFor="villageDelivery" className="cursor-pointer font-medium text-orange-800">
                    هل هذا العنوان يقع في قرية؟ (تطبق رسوم توصيل إضافية)
                </Label>
            </div>

          </CardContent>
      </Card>

      
      <Card className="shadow-sm">
        <CardHeader className="bg-secondary border-b pb-4 mb-4">
            <CardTitle className='flex items-center text-lg'><DollarSign className='h-5 w-5 mx-2 text-green-600'/> 4. تفاصيل الشحن والدفع</CardTitle>
        </CardHeader>
        <CardContent className='space-y-5'>
            <div className="grid gap-6 md:grid-cols-3">
                <div className='space-y-2'>
                    <Label className="text-base">نوع الشحن <span className="text-red-500">*</span></Label>
                    <Select value={formData.shippingType} onValueChange={(v) => handleInputChange('shippingType', v)} dir="rtl">
                        <SelectTrigger className="h-11"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                        <SelectContent className='bg-background'>
                            {shippingTypesList.map(t => (
                                <SelectItem key={t._id} value={t.name}>
                                    <div className="flex justify-between w-full gap-2">
                                        <span>{t.name}</span>
                                        <Badge variant={t.adjustmentAmount > 0 ? "destructive" : "secondary"}>
                                            {t.adjustmentAmount > 0 ? `+${t.adjustmentAmount}` : t.adjustmentAmount} ج
                                        </Badge>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className='space-y-2'>
                    <Label className="text-base">نوع الدفع <span className="text-red-500">*</span></Label>
                    <Select value={formData.paymentType} onValueChange={(v) => handleInputChange('paymentType', v)} dir="rtl">
                        <SelectTrigger className="h-11"><SelectValue placeholder="اختر الطريقة" /></SelectTrigger>
                        <SelectContent className='bg-background'>{paymentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className='space-y-2'>
                    <Label className="text-base">السائق المختص (اختياري)</Label>
                    <Select 
                        value={formData.assignedDriver} 
                        onValueChange={(v) => handleInputChange('assignedDriver', v)} 
                        disabled={availableDrivers.length === 0}
                        dir="rtl"
                    >
                        <SelectTrigger className="h-11">
                            <SelectValue placeholder={
                                availableDrivers.length === 0 
                                    ? "لا يوجد سائقين متاحين لهذه المدينة"
                                    : "اختر سائق"
                            } />
                        </SelectTrigger>
                        <SelectContent className='bg-background'>
                            <SelectItem value="none">لا يوجد</SelectItem>
                            {availableDrivers.map(driver => (
                                <SelectItem key={driver._id} value={driver._id}>
                                    {driver.fullName} - {driver.phoneNumber}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {availableDrivers.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            متاح {availableDrivers.length} سائق لهذه المدينة
                        </p>
                    )}
                </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
                <div className='space-y-2'>
                    <Label className="flex items-center text-base"><Weight className="h-4 w-4 mr-1"/> إجمالي الوزن (كجم)</Label>
                    <Input 
                        value={formData.totalWeight} 
                        readOnly 
                        className='bg-gray-100 text-right font-bold text-lg border-gray-300 h-12' 
                    />
                    <p className="text-xs text-muted-foreground">يتم حسابه تلقائياً بناءً على المنتجات المضافة.</p>
                </div>
                <div className='space-y-2'>
                    <Label className="text-base">ملاحظات إضافية</Label>
                    <Textarea 
                        value={formData.notes} 
                        onChange={(e)=>handleInputChange('notes', e.target.value)} 
                        className='text-right min-h-[50px]'
                        placeholder="أي تعليمات خاصة للتوصيل، مثال: الاتصال قبل الوصول بساعة..."
                    />
                </div>
            </div>
        </CardContent>
      </Card>

      
      <Card className="shadow-sm">
        <CardHeader className="bg-secondary border-b pb-4 mb-4">
            <div className="flex items-center justify-between">
                <CardTitle className='flex items-center text-lg'><Package className='h-5 w-5 mx-2 text-purple-600'/> 5. محتويات الشحنة</CardTitle>
                <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
                    <DialogTrigger asChild>
                        <Button className='bg-blue-600 hover:bg-blue-700'> 
                            <Plus className='mr-2 h-4 w-4'/> إضافة منتج
                        </Button>
                    </DialogTrigger>
                    <DialogContent className='bg-background' dir='rtl'>
                        <DialogHeader><DialogTitle className='text-blue-600'>إضافة منتج جديد</DialogTitle></DialogHeader>
                        <div className='space-y-4 py-4'>
                            <div className='space-y-2'>
                                <Label>اسم المنتج <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={newProduct.name} 
                                    onChange={(e)=>setNewProduct({...newProduct, name:e.target.value})} 
                                    className='text-right'
                                    placeholder="مثال: قميص قطني، حذاء رياضي..."
                                />
                            </div>
                            <div className='grid gap-4 grid-cols-2'>
                                <div className='space-y-2'>
                                    <Label>الكمية <span className="text-red-500">*</span></Label>
                                    <Input 
                                        type="number" 
                                        value={newProduct.quantity} 
                                        onChange={(e)=>setNewProduct({...newProduct, quantity: +e.target.value})} 
                                        className='text-right'
                                        min={1}
                                    />
                                </div>
                                <div className='space-y-2'>
                                    <Label>وزن القطعة (كجم) <span className="text-red-500">*</span></Label>
                                    <Input 
                                        type="number" 
                                        step="0.1" 
                                        value={newProduct.weight} 
                                        onChange={(e)=>setNewProduct({...newProduct, weight: +e.target.value})} 
                                        className='text-right'
                                        min={0.1}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddProduct} className="w-full sm:w-auto">إضافة للقائمة</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </CardHeader>
        <CardContent>
            {products.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-background">
                            <TableRow>
                                <TableHead className='text-right'>الاسم</TableHead>
                                <TableHead className='text-center'>الكمية</TableHead>
                                <TableHead className='text-center'>وزن الوحدة</TableHead>
                                <TableHead className='text-center'>الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell className='text-center'>{p.quantity}</TableCell>
                                    <TableCell className='text-center'>{p.weight} كجم</TableCell>
                                    <TableCell className='text-center'>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={()=>handleDeleteProduct(p.id)}>
                                            <Trash2 className='h-4 w-4'/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className='flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg text-muted-foreground bg-secondary'>
                    <div className="bg-foreground p-4 rounded-full mb-3 shadow-sm">
                        <Package className="h-10 w-10 text-gray-300" />
                    </div>
                    <p className="font-medium">لا يوجد منتجات مضافة بعد</p>
                    <p className="text-sm mt-1 text-gray-500">اضغط على زر "إضافة منتج" بالأعلى للبدء</p>
                </div>
            )}
        </CardContent>
      </Card>

      
      <Card className="bg-secondary border-t bottom-4 shadow-lg ">
        <CardContent className="p-4 flex justify-between items-center">
            <Button variant="ghost" size="lg" onClick={() => window.history.back()} disabled={loading} className="text-gray-600">
                إلغاء ورجوع
            </Button>
            <Button 
                onClick={handleSubmit} 
                size="lg"
                className="bg-green-600 hover:bg-green-700 min-w-[200px] text-base font-bold shadow-md" 
                disabled={products.length === 0 || loading}
            >
                {loading ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin"/> جاري الحفظ...</> 
                ) : (
                    <><CheckCircle className="h-5 w-5 mr-2"/> تأكيد وإنشاء الطلب</>
                )}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}