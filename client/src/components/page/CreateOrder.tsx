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
  Loader2,
  Clock,
  Info
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
import { toast } from 'sonner';

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
  const [weightSettings, setWeightSettings] = useState<any>(null);
  
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
    notes: ''
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 1, weight: 0 });
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  const [isCalculatingCost, setIsCalculatingCost] = useState(false);
  const [costBreakdown, setCostBreakdown] = useState<{
    baseCost: number;
    extraWeightCost: number;
    shippingTypeAdjustment: number;
    villageCost: number;
    total: number;
    details: string;
  } | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingLists(true);
      try {
        const [govRes, shipRes, weightRes] = await Promise.all([
          api.get('/api/locations/governorates?limit=100'),
          api.get('/api/shipping-types?limit=100'),
          api.get('/api/weight-settings')
        ]);
        setGovernoratesList(govRes.data.data.filter((g: Governorate) => g.isActive));
        setShippingTypesList(shipRes.data.data.filter((s: ShippingTypeData) => s.isActive));
        // Weight settings response is directly in data, not data.data
        setWeightSettings(weightRes.data);
        console.log('✅ Weight settings loaded:', weightRes.data);
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
    setAvailableCities([]);
    const selectedGov = governoratesList.find(g => g.govName === governorateName);
    console.log('🔍 Selected Governorate:', { governorateName, selectedGov });
    if (!selectedGov) {
      console.error('❌ No governorate found');
      toast.error('المحافظة غير موجودة');
      return;
    }
    try {
      console.log(`📡 Fetching cities for governorate ID: ${selectedGov._id}`);
      const res = await api.get(`/api/locations/governorates/${selectedGov._id}/cities?limit=100`);
      console.log('✅ API Response:', res.data);
      console.log('✅ Cities loaded:', res.data.data);
      
      if (!res.data.data || res.data.data.length === 0) {
        console.warn('⚠️ No cities found for this governorate');
        toast.warning(`لا توجد مدن مضافة لمحافظة ${governorateName} حتى الآن`);
        setAvailableCities([]);
        return;
      }
      
      const activeCities = res.data.data.filter((c: City) => c.isActive !== false);
      setAvailableCities(activeCities);
      console.log('📍 Available cities set:', activeCities.length);
      
      if (activeCities.length === 0) {
        toast.warning('جميع المدن في هذه المحافظة غير نشطة');
      }
    } catch (err) { 
      console.error('❌ Failed to load cities:', err);
      toast.error('فشل في تحميل المدن');
      setError('فشل في تحميل المدن'); 
    }
  };

  const handleCityChange = async (cityName: string) => {
    handleInputChange('cityName', cityName);
  };

  const calculateTotalWeight = () => products.reduce((t, p) => t + (p.quantity * p.weight), 0);

  const calculateOrderCost = async () => {
    const totalWeight = calculateTotalWeight();
    if (!formData.governorateName || !formData.cityName || !formData.shippingType || totalWeight <= 0) {
      setCalculatedCost(null);
      setCostBreakdown(null);
      return;
    }

    setIsCalculatingCost(true);
    try {
      const response = await api.post('/api/orders/calculate-cost', {
        governorate: formData.governorateName,
        city: formData.cityName,
        shippingType: formData.shippingType,
        totalWeight,
        isVillageDelivery: formData.villageDelivery
      });
      setCalculatedCost(response.data.data.calculatedCost);
      
      // حساب التفاصيل يدوياً
      const selectedCity = availableCities.find(c => c.cityName === formData.cityName);
      const selectedShippingType = shippingTypesList.find(st => st.name === formData.shippingType);
      
      console.log(' Cost Breakdown :', {
        selectedCity,
        selectedShippingType,
        weightSettings,
        availableCities,
        shippingTypesList,
        cityName: formData.cityName,
        shippingType: formData.shippingType
      });
      
      if (selectedCity && selectedShippingType && weightSettings) {
        const baseCost = selectedCity.shippingCost || 0;
        const extraWeight = Math.max(0, totalWeight - weightSettings.defaultWeightLimit);
        const extraWeightCost = Math.round(extraWeight * weightSettings.extraKgCost * 100) / 100;
        const shippingTypeAdjustment = selectedShippingType.adjustmentAmount || 0;
        const villageCost = formData.villageDelivery ? weightSettings.villageDeliveryCost : 0;
        
        setCostBreakdown({
          baseCost,
          extraWeightCost,
          shippingTypeAdjustment,
          villageCost,
          total: response.data.data.calculatedCost,
          details: `${baseCost} + ${extraWeightCost} + ${shippingTypeAdjustment} + ${villageCost}`
        });
        
        console.log('✅ Cost Breakdown Set:', {
          baseCost,
          extraWeightCost,
          shippingTypeAdjustment,
          villageCost,
          total: response.data.data.calculatedCost
        });
      } else {
        console.warn('⚠️ Cost breakdown not set - missing data:', {
          hasCity: !!selectedCity,
          hasShippingType: !!selectedShippingType,
          hasWeightSettings: !!weightSettings
        });
      }
    } catch (error) {
      console.error('Failed to calculate cost:', error);
      setCalculatedCost(null);
      setCostBreakdown(null);
    } finally {
      setIsCalculatingCost(false);
    }
  };

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

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      calculateOrderCost();
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.governorateName, formData.cityName, formData.shippingType, formData.villageDelivery, products]);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (['admin', 'employee'].includes(user?.userType || '') && !selectedMerchant) {
        toast.error('يجب تحديد التاجر صاحب الطلب أولاً');
        return;
    }

    const requiredFields = ['type', 'customerName', 'phone', 'governorateName', 'cityName', 'street', 'shippingType', 'paymentType'];
    const missing = requiredFields.filter(f => !formData[f as keyof typeof formData]);
    
    if (missing.length > 0) {
      toast.error(`يرجى ملء الحقول المطلوبة: ${missing.join(', ')}`);
      return;
    }
    if (products.length === 0) {
      toast.error('يجب إضافة منتج واحد على الأقل');
      return;
    }

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
        // assignedDriver removed - will be assigned by employee when status changes to Processing
      };
      
      await api.post<AddOrderResponse>('/api/orders/add', payload);
      toast.success('تم إنشاء الطلب بنجاح!');
      setTimeout(() => window.location.reload(), 2000);
      setLoading(false);
    } catch (err) {
      const error = err as ApiError;
      toast.error(error.response?.data?.message || 'خطأ في إنشاء الطلب');
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
                    <Store className="h-5 w-5 mx-2 text-blue-800" /> تحديد التاجر (المرسل)<span className="text-red-500 mr-1 text-sm">*</span>
                </CardTitle>
                <CardDescription>ابحث واختر التاجر الذي سيتم تسجيل الطلب باسمه.</CardDescription>
            </CardHeader>
            <CardContent>
                {selectedMerchant ? (
                    <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                        <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="bg-green-100 p-3 m-2 rounded-full">
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
                            <div className="absolute w-full z-50 mt-2 bg-secondary border rounded-md shadow-xl max-h-60 overflow-auto">
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
              <CardTitle className='flex items-center text-lg'><UserIcon className='h-5 w-5 mx-2 text-blue-600'/>  معلومات العميل (المستلم)</CardTitle>
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
              <CardTitle className='flex items-center text-lg'><MapPin className='h-5 w-5 mx-2 text-orange-600'/> عنوان التوصيل</CardTitle>
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
                      <Select 
                          value={formData.cityName} 
                          onValueChange={handleCityChange} 
                          disabled={!formData.governorateName || availableCities.length === 0} 
                          dir="rtl"
                      >
                          <SelectTrigger className="h-11">
                              <SelectValue placeholder={
                                  !formData.governorateName 
                                      ? "اختر المحافظة أولاً" 
                                      : availableCities.length === 0 
                                          ? "لا توجد مدن متاحة" 
                                          : "اختر المدينة"
                              } />
                          </SelectTrigger>
                          <SelectContent className='bg-background'>
                              {availableCities.length > 0 ? (
                                  availableCities.map(c => (
                                      <SelectItem key={c._id} value={c.cityName}>
                                          <div className="flex justify-between w-full gap-4">
                                              <span>{c.cityName}</span>
                                              <Badge variant="secondary" className="text-xs">{c.shippingCost} ج.م</Badge>
                                          </div>
                                      </SelectItem>
                                  ))
                              ) : (
                                  <div className="p-2 text-center text-muted-foreground text-sm">
                                      {!formData.governorateName ? "اختر المحافظة أولاً" : "جاري تحميل المدن..."}
                                  </div>
                              )}
                          </SelectContent>
                      </Select>
                      {availableCities.length > 0 && (
                          <p className="text-xs text-green-600">✓ {availableCities.length} مدينة متاحة</p>
                      )}
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
                    هل تريد التوصيل إلى قرية؟ {weightSettings && (
                        <span className="text-orange-600">(تطبق رسوم توصيل إضافية وقدرها <strong>{weightSettings.villageDeliveryCost || 0} جنيه</strong>)</span>
                    )}
                </Label>
            </div>

          </CardContent>
      </Card>

      
      <Card className="shadow-sm">
        <CardHeader className="bg-secondary border-b pb-4 mb-4">
            <CardTitle className='flex items-center text-lg'><DollarSign className='h-5 w-5 mx-2 text-green-600'/> تفاصيل الشحن والدفع</CardTitle>
        </CardHeader>
        <CardContent className='space-y-5'>
            <div className="grid gap-6 md:grid-cols-2">
                <div className='space-y-2'>
                    <Label className="text-base">نوع الشحن <span className="text-red-500">*</span></Label>
                    <Select
                        value={formData.shippingType}
                        onValueChange={(v) => handleInputChange('shippingType', v)}
                        dir="rtl"
                        >
                        <SelectTrigger className="h-11">
                            <SelectValue>
                            {formData.shippingType && (() => {
                                const selected = shippingTypesList.find(t => t.name === formData.shippingType);
                                return selected ? `${selected.name}` : "";
                            })()}
                            </SelectValue>
                        </SelectTrigger>

                        <SelectContent className='bg-background'>
                            {shippingTypesList.map(t => (
                            <SelectItem key={t._id} value={t.name}>
                                <div className="flex flex-col gap-1">
                                <div className="flex justify-between w-full">
                                    <span className="font-medium text-blue-600">{t.name}</span>
                                    <Badge variant={t.adjustmentAmount > 0 ? "destructive" : "secondary"}>
                                    {t.adjustmentAmount > 0 ? `+${t.adjustmentAmount}` : t.adjustmentAmount} ج
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-500">{t.description}</p>
                                </div>
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    {/* معلومات نوع الشحن المحدد */}
                    {formData.shippingType && (() => {
                        const selectedShipping = shippingTypesList.find(t => t.name === formData.shippingType);
                        return selectedShipping && selectedShipping.minDeliveryDays && selectedShipping.maxDeliveryDays ? (
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mt-2">
                                <div className="flex items-start gap-2">
                                    <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-blue-900">
                                        <p className="font-bold mb-1">مدة التوصيل المتوقعة:</p>
                                        <p className="text-blue-800">
                                            من <strong>{selectedShipping.minDeliveryDays}</strong> إلى <strong>{selectedShipping.maxDeliveryDays}</strong> يوم
                                        </p>
                                        {selectedShipping.adjustmentAmount > 0 && (
                                            <p className="text-xs text-blue-700 mt-1">
                                                رسوم إضافية: <strong>+{selectedShipping.adjustmentAmount} جنيه</strong>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null;
                    })()}
                </div>
                <div className='space-y-2'>
                    <Label className="text-base">نوع الدفع <span className="text-red-500">*</span></Label>
                    <Select value={formData.paymentType} onValueChange={(v) => handleInputChange('paymentType', v)} dir="rtl">
                        <SelectTrigger className="h-11"><SelectValue placeholder="اختر الطريقة" /></SelectTrigger>
                        <SelectContent className='bg-background'>{paymentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>
            
            <div className='space-y-2'>
                <Label className="text-base">ملاحظات إضافية</Label>
                <Textarea 
                    value={formData.notes} 
                    onChange={(e)=>handleInputChange('notes', e.target.value)} 
                    className='text-right min-h-[80px]'
                    placeholder="أي تعليمات خاصة للتوصيل، مثال: الاتصال قبل الوصول بساعة..."
                />
            </div>
        </CardContent>
      </Card>

      
      <Card className="shadow-sm">
        <CardHeader className="bg-secondary border-b pb-4 mb-4">
            <div className="flex items-center justify-between">
                <CardTitle className='flex items-center text-lg'><Package className='h-5 w-5 mx-2 text-purple-600'/> محتويات الشحنة</CardTitle>
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
                                    placeholder="مثال: قميص ، حذاء ..."
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
            {/* معلومات الوزن الاساسي والاضافي */}
            {/* <p className="text-xs text-muted-foreground mb-2">الوزن الأساسي هو ... كجم - وتكلفة كل كجم إضافي هي ... جنيه</p> */}
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

      {/* معلومات الأسعار والإعدادات */}
      {weightSettings && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 shadow-md">
              <div className="flex items-start gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                      <Info className="h-5 w-5 text-amber-700" />
                  </div>
                  <div className="flex-1">
                      <p className="font-bold text-amber-900 mb-2 text-base"> إعدادات التسعير:</p>
                      <div className="grid gap-2 text-sm text-amber-900">
                          <div className="flex items-center gap-2 bg-white/60 p-2 rounded">
                              <span className="bg-amber-200 rounded-full w-1.5 h-1.5"></span>
                              <span>
                                  <strong>الوزن الافتراضي:</strong> حتى {weightSettings.defaultWeightLimit} كجم = سعر المدينة
                              </span>
                          </div>
                          <div className="flex items-center gap-2 bg-white/60 p-2 rounded">
                              <span className="bg-amber-200 rounded-full w-1.5 h-1.5"></span>
                              <span>
                                  <strong>الوزن الزائد:</strong> كل كيلو إضافي = <strong className="text-amber-700">{weightSettings.extraKgCost} جنيه</strong>
                              </span>
                          </div>
                          <div className="flex items-center gap-2 bg-white/60 p-2 rounded">
                              <span className="bg-amber-200 rounded-full w-1.5 h-1.5"></span>
                              <span>
                                  <strong>توصيل القرية:</strong> رسوم إضافية = <strong className="text-amber-700">{weightSettings.villageDeliveryCost || 0} جنيه</strong>
                              </span>
                          </div>
                      </div>
                      <p className="text-xs text-amber-700 mt-2 italic">
                           التكلفة النهائية = سعر المدينة + الوزن الزائد + نوع الشحن + رسوم القرية (إن وجدت)
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* 6. ملخص التكلفة والوزن */}
      <Card className="shadow-2xl border-2 border-purple-200 bg-background from-purple-50 via-blue-50 to-indigo-50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white pb-5">
            <CardTitle className='flex items-center text-2xl font-bold justify-center'>
                <Weight className='h-7 w-7 mx-2 animate-pulse'/> ملخص الشحنة والتكلفة
            </CardTitle>
            <CardDescription className="text-purple-100 text-center text-base">الحساب التلقائي المباشر</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6 pt-6'>
            <div className="grid gap-6 md:grid-cols-2">
                {/* إجمالي الوزن */}
                <div className="relative bg-secondary from-orange-50 to-amber-50 p-6 rounded-2xl shadow-xl border-2 border-orange-300 hover:scale-105 hover:shadow-2xl transition-all duration-300">
                    <div className="absolute top-2 left-2">
                        <div className="bg-orange-200 rounded-full p-1.5">
                            <Package className="h-4 w-4 text-orange-700" />
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center space-y-3 mt-2">
                        <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-4 rounded-2xl shadow-lg">
                            <Weight className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-sm font-bold text-orange-800 uppercase tracking-wide">إجمالي الوزن</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-orange-600 drop-shadow-md">
                                {formData.totalWeight || '0'}
                            </span>
                            <span className="text-2xl font-bold text-orange-500">كجم</span>
                        </div>
                        <div className="bg-orange-100 px-3 py-1 rounded-full">
                            <p className="text-xs text-orange-700 font-medium">✓ محسوب تلقائياً</p>
                        </div>
                    </div>
                </div>

                {/* التكلفة المحسوبة */}
                <div className="relative bg-secondary from-green-50 to-emerald-50 p-6 rounded-2xl shadow-xl border-2 border-green-300 hover:scale-105 hover:shadow-2xl transition-all duration-300">
                    <div className="absolute top-2 left-2">
                        <div className="bg-green-200 rounded-full p-1.5">
                            <CheckCircle className="h-4 w-4 text-green-700" />
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center space-y-3 mt-2">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg">
                            <DollarSign className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-sm font-bold text-green-800 uppercase tracking-wide">التكلفة الإجمالية</span>
                        {isCalculatingCost ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-10 w-10 animate-spin text-green-600" />
                                <span className="text-sm text-green-600 font-medium">جاري الحساب...</span>
                            </div>
                        ) : calculatedCost !== null ? (
                            <>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-green-600 drop-shadow-md">
                                        {calculatedCost.toFixed(2)}
                                    </span>
                                    <span className="text-2xl font-bold text-green-500">ج.م</span>
                                </div>
                                <div className="bg-green-100 px-3 py-1 rounded-full">
                                    <p className="text-xs text-green-700 font-medium">✓ تم الحساب</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-gray-400">---</span>
                                </div>
                                <div className="bg-gray-100 px-3 py-1 rounded-full">
                                    <p className="text-xs text-gray-600 font-medium">أكمل البيانات</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* شريط التقدم البصري */}
            <div className="bg-secondary rounded-xl p-5 shadow-md border border-indigo-100">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-primary">اكتمال البيانات</span>
                    <span className="text-xs font-semibold text-indigo-600">
                        {calculatedCost !== null ? '100%' : formData.governorateName && formData.cityName && formData.shippingType ? '75%' : products.length > 0 ? '50%' : '25%'}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ 
                            width: calculatedCost !== null ? '100%' : formData.governorateName && formData.cityName && formData.shippingType ? '75%' : products.length > 0 ? '50%' : '25%'
                        }}
                    />
                </div>
            </div>

            {/* تفاصيل الحساب */}
            {calculatedCost !== null && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <CheckCircleIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-indigo-900 mb-2 text-lg">التكلفة محسوبة بناءً على:</p>
                            <ul className="text-sm text-indigo-800 space-y-1.5">
                                <li className="flex items-center gap-2">
                                    <span className="bg-indigo-200 rounded-full w-1.5 h-1.5"></span>
                                    <span> المحافظة: <strong>{formData.governorateName}</strong></span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="bg-indigo-200 rounded-full w-1.5 h-1.5"></span>
                                    <span> المدينة: <strong>{formData.cityName}</strong></span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="bg-indigo-200 rounded-full w-1.5 h-1.5"></span>
                                    <span> نوع الشحن: <strong>{formData.shippingType}</strong></span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="bg-indigo-200 rounded-full w-1.5 h-1.5"></span>
                                    <span> الوزن الإجمالي: <strong>{formData.totalWeight} كجم</strong></span>
                                </li>
                                {formData.villageDelivery && (
                                    <li className="flex items-center gap-2">
                                        <span className="bg-indigo-200 rounded-full w-1.5 h-1.5"></span>
                                        <span> توصيل قرية: <strong>نعم (رسوم إضافية)</strong></span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* ملاحظة تنبيهية */}
            {!calculatedCost && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3 shadow-md">
                    <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0 animate-pulse" />
                    <div className="text-sm text-amber-900">
                        <p className="font-bold mb-1.5 text-base"> لحساب التكلفة تلقائياً:</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>أضف منتج واحد على الأقل</li>
                            <li>اختر المحافظة والمدينة</li>
                            <li>حدد نوع الشحن</li>
                        </ul>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>

      {/* جدول تفصيل التكلفة */}
      {costBreakdown && calculatedCost !== null && (
        <Card className="shadow-lg border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
            <CardTitle className="flex items-center text-lg text-green-800">
              <DollarSign className="h-6 w-6 mx-2 text-green-600" />
              تفاصيل حساب التكلفة
            </CardTitle>
            <CardDescription className="text-green-700">
              شرح كامل لكيفية حساب تكلفة الشحن
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-hidden rounded-lg border border-green-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-50 hover:bg-green-50">
                    <TableHead className="text-right font-bold text-green-900">البند</TableHead>
                    <TableHead className="text-right font-bold text-green-900">التفاصيل</TableHead>
                    <TableHead className="text-right font-bold text-green-900">القيمة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="hover:bg-green-50/50 text-gray-50">
                    <TableCell className="font-medium">تكلفة الشحن الأساسية</TableCell>
                    <TableCell className="text-gray-600">
                    سعر الشحن إلى <strong>{formData.cityName}</strong> في محاقظة <strong>{formData.governorateName}</strong>
                    </TableCell>
                    <TableCell className="font-bold text-green-700">{costBreakdown.baseCost} جنيه</TableCell>
                  </TableRow>

                  <TableRow className="hover:bg-green-50/50">
                    <TableCell className="font-medium">تكلفة الوزن الزائد</TableCell>
                    <TableCell className="text-gray-600">
                      {weightSettings && (
                        <>
                          الوزن الإجمالي: <strong>{calculateTotalWeight()} كجم</strong>
                          {calculateTotalWeight() > weightSettings.defaultWeightLimit ? (
                            <>
                              <br />
                              الوزن الزائد: <strong>{(calculateTotalWeight() - weightSettings.defaultWeightLimit).toFixed(2)} كجم</strong> × {weightSettings.extraKgCost} جنيه/كجم
                            </>
                          ) : (
                            <span className="text-green-600"> (ضمن الحد المسموح {weightSettings.defaultWeightLimit} كجم)</span>
                          )}
                        </>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-green-700">
                      {costBreakdown.extraWeightCost > 0 ? `${costBreakdown.extraWeightCost} جنيه` : 'لا يوجد'}
                    </TableCell>
                  </TableRow>

                  <TableRow className="hover:bg-green-50/50">
                    <TableCell className="font-medium">تعديل نوع الشحن</TableCell>
                    <TableCell className="text-gray-600">
                      نوع الشحن المختار: <strong>{formData.shippingType}</strong>
                      {costBreakdown.shippingTypeAdjustment > 0 && ' (تكلفة إضافية)'}
                      {costBreakdown.shippingTypeAdjustment < 0 && ' (خصم)'}
                    </TableCell>
                    <TableCell className="font-bold" style={{ color: costBreakdown.shippingTypeAdjustment >= 0 ? '#15803d' : '#dc2626' }}>
                      {costBreakdown.shippingTypeAdjustment > 0 ? '+' : ''}{costBreakdown.shippingTypeAdjustment} جنيه
                    </TableCell>
                  </TableRow>

                  {formData.villageDelivery && (
                    <TableRow className="hover:bg-green-50/50">
                      <TableCell className="font-medium">رسوم توصيل القرية</TableCell>
                      <TableCell className="text-gray-600">
                        رسوم إضافية للتوصيل إلى القرية: <strong>{weightSettings.villageDeliveryCost || 'غير محدد'}</strong>
                      </TableCell>
                      <TableCell className="font-bold text-orange-700">+{costBreakdown.villageCost} جنيه</TableCell>
                    </TableRow>
                  )}

                  <TableRow className="bg-green-100 hover:bg-green-100 border-t-2 border-green-300">
                    <TableCell className="font-bold text-lg text-green-900">الإجمالي النهائي</TableCell>
                    <TableCell className="text-sm text-gray-700 italic">
                      {costBreakdown.baseCost} + {costBreakdown.extraWeightCost} + {costBreakdown.shippingTypeAdjustment} + {costBreakdown.villageCost}
                    </TableCell>
                    <TableCell className="font-bold text-xl text-green-800">{calculatedCost} جنيه</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                <strong>ملاحظة:</strong> التكلفة المعروضة هي تكلفة الشحن فقط. سيتم إضافة قيمة المنتجات (إن وجدت) عند التسليم حسب نوع الدفع المختار.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      
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