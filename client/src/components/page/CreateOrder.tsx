import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
// ... (كل الـ imports القديمة)
import { AlertCircle, CheckCircleIcon } from 'lucide-react';
import api from '../../lib/api';
import type { ApiError, AddOrderResponse } from '../../types';
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
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { 
  Package, 
  User, 
  MapPin, 
  Calculator, 
  CheckCircle,
  Plus,
  Trash2,
  Phone,
  Mail,
  Building,
  FileText,
  DollarSign,
  Weight
} from 'lucide-react';


const governorates = [
  { id: '1', name: 'القاهرة', cities: ['القاهرة الجديدة', 'مدينة نصر', 'مصر الجديدة', 'المعادي', 'حلوان', 'الزمالك', 'وسط البلد'] },
  { id: '2', name: 'الجيزة', cities: ['الجيزة', '6 أكتوبر', 'الشيخ زايد', 'الهرم', 'فيصل', 'الدقي', 'المهندسين', 'العجوزة'] },
  { id: '3', name: 'الاسكندرية', cities: ['الاسكندرية', 'برج العرب', 'سموحة', 'ميامي', 'سيدي بشر', 'العجمي', 'المنتزه'] },
  { id: '4', name: 'الشرقية', cities: ['الزقازيق', 'العاشر من رمضان', 'بلبيس', 'منيا القمح', 'فاقوس', 'ههيا'] },
  { id: '5', name: 'اسوان', cities: ['اسوان', 'كوم امبو', 'ادفو', 'نصر النوبة', 'ابو سمبل'] },
  { id: '6', name: 'القليوبية', cities: ['بنها', 'شبرا الخيمة', 'العبور', 'القناطر الخيرية', 'طوخ', 'قليوب'] },
  { id: '7', name: 'الدقهلية', cities: ['المنصورة', 'ميت غمر', 'السنبلاوين', 'طلخا', 'دكرنس', 'بلقاس'] },
  { id: '8', name: 'الغربية', cities: ['طنطا', 'المحلة الكبرى', 'كفر الزيات', 'زفتى', 'السنطة', 'بسيون'] },
  { id: '9', name: 'البحيرة', cities: ['دمنهور', 'كفر الدوار', 'ادكو', 'رشيد', 'وادي النطرون'] },
  { id: '10', name: 'المنوفية', cities: ['شبين الكوم', 'السادات', 'منوف', 'قويسنا', 'أشمون'] }
];

const branches = [
  { id: '1', name: 'القاهرة' },
  { id: '2', name: 'الجيزة' },
  { id: '3', name: 'الاسكندرية' },
  { id: '4', name: 'الشرقية' },
  { id: '5', name: 'اسوان' }
];
const shippingTypes = [
  { id: 'normal', name: 'عادي', description: 'التوصيل خلال 3-5 أيام عمل', cost: 0 },
  { id: '24hour', name: 'شحن في 24 ساعة', description: 'توصيل سريع خلال 24 ساعة', cost: 25 },
  { id: '15days', name: 'شحن خلال 15 يوم', description: 'توصيل اقتصادي خلال 15 يوم', cost: -10 }
];

const paymentTypes = [
  { id: 'cod', name: 'واجبة التحصيل', description: 'الدفع عند الاستلام' },
  { id: 'prepaid', name: 'دفع مقدم', description: 'تم الدفع مسبقاً' },
  { id: 'exchange', name: 'طرد مقابل طرد', description: 'تبادل طرود بين الطرفين' }
];

const orderTypes = [
  { id: 'pickup', name: 'استلام من المتجر' },
  { id: 'door_to_door', name: 'من الباب للباب' },
  { id: 'warehouse', name: 'من المستودع' }
];

interface Product {
  id: string;
  name: string;
  quantity: number;
  weight: number;
}



export function CreateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // معلومات الطلب الأساسية
    type: '',
    customerName: '',
    phone: '',
    phone2: '',
    email: '',
    
    // الموقع
    governorateId: '',
    cityId: '',
    village: '',
    street: '',
    villageDelivery: false,
    
    // تفاصيل الشحن
    shippingType: '',
    paymentType: '',
    branchId: '',
    orderCost: '',
    totalWeight: '',
    notes: ''
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: 1,
    weight: 0
  });

  const [selectedGovernorate, setSelectedGovernorate] = useState<any>(null);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGovernorateChange = (governorateId: string) => {
    const governorate = governorates.find(g => g.id === governorateId);
    setSelectedGovernorate(governorate);
    setAvailableCities(governorate?.cities || []);
    handleInputChange('governorateId', governorateId);
    handleInputChange('cityId', ''); 
  };

  const calculateTotalWeight = () => {
    return products.reduce((total, product) => total + (product.quantity * product.weight), 0);
  };

  const calculateShippingCost = () => {
    
    const weightSettings = {
      baseWeight: 1.0,
      baseCost: 25.0,
      additionalWeightCost: 5.0
    };
    
    const totalWeight = calculateTotalWeight();
    let weightCost = weightSettings.baseCost;
    
    
    if (totalWeight > weightSettings.baseWeight) {
      const additionalWeight = totalWeight - weightSettings.baseWeight;
      weightCost += additionalWeight * weightSettings.additionalWeightCost;
    }
    
    const shippingTypeData = shippingTypes.find(type => type.id === formData.shippingType);
    const shippingTypeCost = shippingTypeData?.cost || 0;
    const villageDeliveryCost = formData.villageDelivery ? 15 : 0;
    
    return weightCost + shippingTypeCost + villageDeliveryCost;
  };

  const handleAddProduct = () => {
    if (newProduct.name.trim() && newProduct.quantity > 0 && newProduct.weight > 0) {
      const product: Product = {
        id: Date.now().toString(),
        name: newProduct.name,
        quantity: newProduct.quantity,
        weight: newProduct.weight
      };
      setProducts([...products, product]);
      setNewProduct({ name: '', quantity: 1, weight: 0 });
      setIsAddingProduct(false);
      
     
      const newTotalWeight = calculateTotalWeight() + (newProduct.quantity * newProduct.weight);
      handleInputChange('totalWeight', newTotalWeight.toString());
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    
    
    const newTotalWeight = updatedProducts.reduce((total, product) => 
      total + (product.quantity * product.weight), 0
    );
    handleInputChange('totalWeight', newTotalWeight.toString());
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    
    const requiredFields = [
      'type', 'customerName', 'phone', 'governorateId', 'cityId',
      'street', 'shippingType', 'paymentType', 'branchId', 'orderCost'
    ];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      setError(`يرجى ملء الحقول المطلوبة: ${missingFields.join(', ')}`);
      return;
    }
    if (products.length === 0) {
      setError('يرجى إضافة منتج واحد على الأقل');
      return;
    }

    setLoading(true);

    try {
      const orderTypeName = orderTypes.find(t => t.id === formData.type)?.name;
      const governorateName = governorates.find(g => g.id === formData.governorateId)?.name;
      const shippingTypeName = shippingTypes.find(s => s.id === formData.shippingType)?.name;
      const paymentTypeName = paymentTypes.find(p => p.id === formData.paymentType)?.name;
      const branchName = branches.find(b => b.id === formData.branchId)?.name;

      const mappedProducts = products.map(p => ({
        productName: p.name,
        quantity: p.quantity,
        weight: p.weight,
      }));
      
      const totalWeight = calculateTotalWeight();

      const payload = {
        orderType: orderTypeName,
        customerName: formData.customerName,
        customerPhone1: formData.phone,
        customerPhone2: formData.phone2,
        customerEmail: formData.email,
        governorate: governorateName,
        city: formData.cityId, 
        village: formData.village,
        street: formData.street,
        isVillageDelivery: formData.villageDelivery,
        shippingType: shippingTypeName,
        paymentType: paymentTypeName,
        branch: branchName,
        orderCost: parseFloat(formData.orderCost) || 0,
        totalWeight: totalWeight,
        notes: formData.notes,
        products: mappedProducts,
      };

      
      await api.post<AddOrderResponse>('/api/orders/add', payload);

      setSuccess('تم إنشاء الطلب بنجاح!');
      setLoading(false);
      
     

    } catch (err) {
      const error = err as ApiError;
      setError(error.response?.data?.message || 'حدث خطأ أثناء إنشاء الطلب.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>إنشاء طلب شحن جديد</h1>
        <p className="text-muted-foreground">
          أنشئ طلب شحن جديد مع تفاصيل كاملة للعميل والمنتجات
        </p>
      </div>

      {success && (
        <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
          <CheckCircleIcon className="h-4 w-4" />
          <AlertTitle>نجاح</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>خطأ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {/* معلومات الطلب الأساسية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            معلومات العميل الأساسية
          </CardTitle>
          <CardDescription>
            البيانات الشخصية ومعلومات التواصل مع العميل
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* النوع ومعلومات العميل */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type" className="flex items-center">
                <Package className="h-4 w-4 mr-2" />
                نوع الطلب *
              </Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الطلب" />
                </SelectTrigger>
                <SelectContent className='bg-blue-50'>
                  {orderTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                اسم العميل *
              </Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="أدخل اسم العميل الكامل"
                className="text-right"
                required
              />
            </div>
          </div>

          {/* أرقام الهاتف والبريد الإلكتروني */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                رقم الهاتف *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="05xxxxxxxx"
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone2" className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                رقم الهاتف 2
              </Label>
              <Input
                id="phone2"
                type="tel"
                value={formData.phone2}
                onChange={(e) => handleInputChange('phone2', e.target.value)}
                placeholder="05xxxxxxxx"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="example@domain.com"
                className="text-right"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* معلومات الموقع */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            معلومات الموقع والعنوان
          </CardTitle>
          <CardDescription>
            العنوان الكامل لتوصيل الطلب
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* المحافظة والمدينة */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="governorate" className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                المحافظة *
              </Label>
              <Select 
                value={formData.governorateId} 
                onValueChange={handleGovernorateChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المحافظة" />
                </SelectTrigger>
                <SelectContent className='bg-blue-50'>
                  {governorates.map((governorate) => (
                    <SelectItem key={governorate.id} value={governorate.id}>
                      {governorate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                المدينة *
              </Label>
              <Select 
                value={formData.cityId} 
                onValueChange={(value) => handleInputChange('cityId', value)}
                disabled={!selectedGovernorate}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedGovernorate ? "اختر المدينة" : "اختر المحافظة أولاً"} />
                </SelectTrigger>
                <SelectContent className='bg-blue-50'>
                  {availableCities.map((city, index) => (
                    <SelectItem key={index} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* القرية والشارع */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="village">القرية</Label>
              <Input
                id="village"
                value={formData.village}
                onChange={(e) => handleInputChange('village', e.target.value)}
                placeholder="أدخل اسم القرية"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">الشارع *</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                placeholder="أدخل اسم الشارع أو العنوان التفصيلي"
                className="text-right"
                required
              />
            </div>
          </div>

          {/* التوصيل للقرية */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="villageDelivery"
              checked={formData.villageDelivery}
              onCheckedChange={(checked) => handleInputChange('villageDelivery', checked as boolean)}
            />
            <Label htmlFor="villageDelivery" className="cursor-pointer">
              التوصيل لقرية (رسوم إضافية: 15 جنيه)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* تفاصيل الشحن والدفع */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            تفاصيل الشحن والدفع
          </CardTitle>
          <CardDescription>
            نوع الشحن وطريقة الدفع والفرع المختص
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* نوع الشحن */}
          <div className="space-y-2">
            <Label htmlFor="shippingType" className="flex items-center">
              <Package className="h-4 w-4 mr-2" />
              نوع الشحن *
            </Label>
            <Select value={formData.shippingType} onValueChange={(value) => handleInputChange('shippingType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الشحن" />
              </SelectTrigger>
              <SelectContent className='bg-blue-50'>
                {shippingTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{type.name}</span>
                      <Badge variant={type.cost > 0 ? "destructive" : type.cost < 0 ? "default" : "secondary"}>
                        {type.cost > 0 ?`+${type.cost}` : type.cost < 0 ? `type.cost `: 'مجاني' } جنيه
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.shippingType && (
              <p className="text-sm text-muted-foreground">
                {shippingTypes.find(type => type.id === formData.shippingType)?.description}
              </p>
            )}
          </div>

          {/* نوع الدفع */}
          <div className="space-y-2">
            <Label htmlFor="paymentType" className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              نوع الدفع *
            </Label>
            <Select value={formData.paymentType} onValueChange={(value) => handleInputChange('paymentType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الدفع" />
              </SelectTrigger>
              <SelectContent className='bg-blue-50'>
                {paymentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div>
                      <div>{type.name}</div>
                      <div className="text-sm text-gray-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* الفرع */}
          <div className="space-y-2">
            <Label htmlFor="branch" className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              الفرع *
            </Label>
            <Select value={formData.branchId} onValueChange={(value) => handleInputChange('branchId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الفرع" />
              </SelectTrigger>
              <SelectContent className='bg-blue-50'>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* تكلفة الطلب وإجمالي الوزن */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orderCost" className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                تكلفة الطلب (جنيه)
              </Label>
              <Input
                id="orderCost"
                type="number"
                step="0.01"
                min="0"
                value={formData.orderCost}
                onChange={(e) => handleInputChange('orderCost', e.target.value)}
                placeholder="0.00"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalWeight" className="flex items-center">
                <Weight className="h-4 w-4 mr-2" />
                إجمالي الوزن (كجم)
              </Label>
              <Input
                id="totalWeight"
                type="number"
                step="0.1"
                min="0"
                value={calculateTotalWeight()}
                readOnly
                className="text-right bg-gray-50"
                placeholder="سيتم الحساب تلقائياً"
              />
            </div>
          </div>

          {/* الملاحظات */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              ملاحظات
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="أي ملاحظات أو تعليمات خاصة..."
              className="text-right"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* إدارة المنتجات */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                المنتجات
              </CardTitle>
              <CardDescription>
                إضافة وإدارة المنتجات في الطلب
              </CardDescription>
            </div>
            <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة منتج
                </Button>
              </DialogTrigger>
              <DialogContent className='bg-blue-50'>
                <DialogHeader>
                  <DialogTitle>إضافة منتج جديد</DialogTitle>
                  <DialogDescription>
                    أدخل تفاصيل المنتج المراد إضافته للطلب
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">اسم المنتج</Label>
                    <Input
                      id="productName"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="أدخل اسم المنتج"
                      className="text-right"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">الكمية</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={newProduct.quantity}
                        onChange={(e) => setNewProduct({...newProduct, quantity: parseInt(e.target.value) || 1})}
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">الوزن (كجم)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={newProduct.weight}
                        onChange={(e) => setNewProduct({...newProduct, weight: parseFloat(e.target.value) || 0})}
                        className="text-right"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingProduct(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddProduct}>
                    إضافة المنتج
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم المنتج</TableHead>
                    <TableHead className="text-center">الكمية</TableHead>
                    <TableHead className="text-center">الوزن (كجم)</TableHead>
                    <TableHead className="text-center">إجمالي الوزن</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-center">{product.quantity}</TableCell>
                      <TableCell className="text-center">{product.weight}</TableCell>
                      <TableCell className="text-center font-medium">
                        {(product.quantity * product.weight).toFixed(1)} كجم
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-muted-foreground mt-2">لم يتم إضافة أي منتجات بعد</p>
              <p className="text-sm text-muted-foreground">اضغط على "إضافة منتج" لبدء إضافة المنتجات</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ملخص التكلفة */}
      {products.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              ملخص التكلفة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>التكلفة الأساسية (حتى 1.0 كجم):</span>
                <span>25 جنيه</span>
              </div>
              {calculateTotalWeight() > 1.0 && (
                <div className="flex justify-between">
                  <span>تكلفة الوزن الإضافي ({(calculateTotalWeight() - 1.0).toFixed(1)} كجم):</span>
                  <span>{((calculateTotalWeight() - 1.0) * 5).toFixed(2)} جنيه</span>
                </div>
              )}
              <div className="flex justify-between font-medium">
                <span>إجمالي تكلفة الوزن ({calculateTotalWeight().toFixed(1)} كجم):</span>
                <span>{Math.max(25, 25 + Math.max(0, calculateTotalWeight() - 1.0) * 5).toFixed(2)} جنيه</span>
              </div>
              {formData.shippingType && (
                <div className="flex justify-between">
                  <span>رسوم نوع الشحن:</span>
                  <span>{shippingTypes.find(type => type.id === formData.shippingType)?.cost || 0} جنيه</span>
                </div>
              )}
              {formData.villageDelivery && (
                <div className="flex justify-between">
                  <span>رسوم التوصيل للقرية:</span>
                  <span>15 جنيه</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>إجمالي تكلفة الشحن:</span>
                <span className="text-green-700">{calculateShippingCost().toFixed(2)} جنيه</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* أزرار الإجراءات */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button variant="outline" disabled={loading}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="bg-green-600 hover:bg-green-700"
              disabled={products.length === 0 || loading} // (تعديل)
            >
              {loading ? (
                "جاري الإنشاء..."
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  إنشاء الطلب
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ملاحظات مهمة */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800">ملاحظات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="text-orange-700">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>جميع الحقول المميزة بـ (*) مطلوبة لإنشاء الطلب</li>
            <li>يجب إضافة منتج واحد على الأقل لإكمال الطلب</li>
            <li>يتم حساب إجمالي الوزن تلقائياً بناءً على المنتجات المضافة</li>
            <li>رسوم التوصيل للقرية إضافية وتبلغ 15 جنيه</li>
            <li>تختلف تكلفة الشحن حسب النوع المختار</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}