import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Building,
  Search,
  MoreHorizontal,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'; // <-- إضافة Select
import api from '../../lib/api'; // <-- تم تعديل المسار
import type { 
  Governorate, 
  City, 
  GetGovernoratesResponse, 
  GetCitiesResponse,
  AddLocationResponse,
  ApiError
} from '../../types'; // <-- تم تعديل المسار

export function RegionsManagement() {
  // States for data
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  // States for loading
  const [isLoadingGovs, setIsLoadingGovs] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for forms
  const [isAddingGovernorate, setIsAddingGovernorate] = useState(false);
  const [isAddingCity, setIsAddingCity] = useState(false);
  
  // New Governorate state
  const [newGovernorateName, setNewGovernorateName] = useState('');
  const [newGovernorateCode, setNewGovernorateCode] = useState('');
  
  // New City state
  const [newCityName, setNewCityName] = useState('');
  const [newCityGovernorate, setNewCityGovernorate] = useState(''); // <-- سيخزن الـ ID
  const [newCityDeliveryFee, setNewCityDeliveryFee] = useState('');
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // States for search/filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState('');

  // Fetch data on mount
  useEffect(() => {
    fetchGovernorates();
    fetchCities();
  }, []);

  const fetchGovernorates = async () => {
    setIsLoadingGovs(true);
    try {
      const response = await api.get<GetGovernoratesResponse>('/api/locations/governorates');
      setGovernorates(response.data.data || []);
    } catch (err) {
      setError('فشل في جلب المحافظات');
    } finally {
      setIsLoadingGovs(false);
    }
  };

  const fetchCities = async () => {
    setIsLoadingCities(true);
    try {
      const response = await api.get<GetCitiesResponse>('/api/locations/cities');
      setCities(response.data.data || []);
    } catch (err) {
      setError('فشل في جلب المدن');
    } finally {
      setIsLoadingCities(false);
    }
  };

  // Filter cities based on search and selection
  const filteredCities = cities.filter(city => {
    const matchesSearch = city.cityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         city.governorate.govName.toLowerCase().includes(searchQuery.toLowerCase());
    // فلترة بالاسم (للبحث) أو بالـ ID (للاختيار)
    const matchesGovernorate = !selectedGovernorate || 
                                city.governorate.govName === selectedGovernorate || 
                                city.governorate._id === selectedGovernorate;
    return matchesSearch && matchesGovernorate;
  });

  const handleAddGovernorate = async () => {
    if (!newGovernorateName.trim() || !newGovernorateCode.trim()) {
      setError('الرجاء إدخال اسم ورمز المحافظة');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await api.post<AddLocationResponse>('/api/locations/governorates', {
        govName: newGovernorateName,
        govCode: newGovernorateCode
      });
      
      setGovernorates([...governorates, response.data.data as Governorate]);
      setNewGovernorateName('');
      setNewGovernorateCode('');
      setIsAddingGovernorate(false);

    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'حدث خطأ أثناء إضافة المحافظة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCity = async () => {
    if (!newCityName.trim() || !newCityGovernorate || !newCityDeliveryFee) {
       setError('الرجاء ملء جميع حقول المدينة');
       return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post<AddLocationResponse>('/api/locations/cities', {
        cityName: newCityName,
        governorateId: newCityGovernorate, // <-- إرسال الـ ID
        shippingCost: parseFloat(newCityDeliveryFee)
      });

      // جلب البيانات المحدثة (Populated)
      await fetchCities(); 

      setNewCityName('');
      setNewCityGovernorate('');
      setNewCityDeliveryFee('');
      setIsAddingCity(false);

    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'حدث خطأ أثناء إضافة المدينة');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // حساب الإحصائيات
  const totalGovs = governorates.length;
  const totalCities = cities.length;
  const avgDeliveryFee = totalCities > 0 
    ? Math.round(cities.reduce((sum, city) => sum + city.shippingCost, 0) / totalCities) 
    : 0;
  const maxDeliveryFee = totalCities > 0 
    ? Math.max(...cities.map(city => city.shippingCost)) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة المناطق والمدن</h1>
          <p className="text-muted-foreground">
            إدارة المحافظات والمدن وتحديد رسوم التوصيل
          </p>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">إجمالي المحافظات</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingGovs ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{totalGovs}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">إجمالي المدن</CardTitle>
          </CardHeader>
          <CardContent>
           {isLoadingCities ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{totalCities}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">متوسط رسوم التوصيل</CardTitle>
          </CardHeader>
          <CardContent>
             {isLoadingCities ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">
                {avgDeliveryFee} جنيه
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">أعلى رسوم توصيل</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCities ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">
                {maxDeliveryFee} جنيه
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* تبويبات المحافظات والمدن */}
      <Tabs defaultValue="governorates" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="governorates" className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            المحافظات
          </TabsTrigger>
          <TabsTrigger value="cities" className="flex items-center">
            <Building className="h-4 w-4 mr-2" />
            المدن
          </TabsTrigger>
        </TabsList>

        {/* تبويب المحافظات */}
        <TabsContent value="governorates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>قائمة المحافظات</CardTitle>
                  <CardDescription>
                    إدارة المحافظات المتاحة للشحن
                  </CardDescription>
                </div>
                <Dialog open={isAddingGovernorate} onOpenChange={(isOpen) => {
                  setIsAddingGovernorate(isOpen);
                  setError(null); // مسح الأخطاء عند فتح/إغلاق
                  setNewGovernorateName('');
                  setNewGovernorateCode('');
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة محافظة
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة محافظة جديدة</DialogTitle>
                      <DialogDescription>
                        أدخل بيانات المحافظة الجديدة
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {error && (
                        <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-md">
                          <AlertCircle className="h-4 w-4 ml-2" />
                          <p className="text-sm">{error}</p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="govName">اسم المحافظة</Label>
                        <Input
                          id="govName"
                          value={newGovernorateName}
                          onChange={(e) => setNewGovernorateName(e.target.value)}
                          placeholder="أدخل اسم المحافظة"
                          className="text-right"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="govCode">رمز المحافظة</Label>
                        <Input
                          id="govCode"
                          value={newGovernorateCode}
                          onChange={(e) => setNewGovernorateCode(e.target.value.toUpperCase())}
                          placeholder="مثال: CAI"
                          className="text-right"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="flex justify-end space-x-2 space-x-reverse">
                        <Button variant="outline" onClick={() => setIsAddingGovernorate(false)} disabled={isSubmitting}>
                          إلغاء
                        </Button>
                        <Button onClick={handleAddGovernorate} disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "إضافة"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">اسم المحافظة</TableHead>
                      <TableHead className="text-right">الرمز</TableHead>
                      {/* <TableHead className="text-right">عدد المدن</TableHead> */}
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingGovs ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto my-4" />
                          <p>جاري تحميل المحافظات...</p>
                        </TableCell>
                      </TableRow>
                    ) : governorates.length === 0 ? (
                       <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <p className="text-muted-foreground">لم تتم إضافة أي محافظات بعد</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      governorates.map((governorate) => (
                        <TableRow key={governorate._id}>
                          <TableCell className="font-medium">{governorate.govName}</TableCell>
                          <TableCell>{governorate.govCode}</TableCell>
                          {/* <TableCell>{governorate.citiesCount}</TableCell> */}
                          <TableCell>
                            <Badge variant={'default'}>
                              نشط
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  إلغاء التفعيل
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب المدن */}
        <TabsContent value="cities" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>قائمة المدن</CardTitle>
                  <CardDescription>
                    إدارة المدن ورسوم التوصيل
                  </CardDescription>
                </div>
                <Dialog open={isAddingCity} onOpenChange={(isOpen) => {
                  setIsAddingCity(isOpen);
                  setError(null);
                  setNewCityName('');
                  setNewCityGovernorate('');
                  setNewCityDeliveryFee('');
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700" disabled={governorates.length === 0}>
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة مدينة
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة مدينة جديدة</DialogTitle>
                      <DialogDescription>
                        {governorates.length === 0 ? "يجب إضافة محافظة أولاً" : "أدخل بيانات المدينة الجديدة"}
                      </DialogDescription>
                    </DialogHeader>
                    {governorates.length > 0 && (
                      <div className="space-y-4">
                        {error && (
                          <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-md">
                            <AlertCircle className="h-4 w-4 ml-2" />
                            <p className="text-sm">{error}</p>
                          </div>
                        )}
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="cityName">اسم المدينة</Label>
                            <Input
                              id="cityName"
                              value={newCityName}
                              onChange={(e) => setNewCityName(e.target.value)}
                              placeholder="أدخل اسم المدينة"
                              className="text-right"
                              disabled={isSubmitting}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="cityGovernorate">المحافظة</Label>
                            <Select
                              value={newCityGovernorate}
                              onValueChange={setNewCityGovernorate}
                              dir="rtl"
                              disabled={isSubmitting}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="اختر المحافظة" />
                              </SelectTrigger>
                              <SelectContent>
                                {governorates.map((gov) => (
                                  <SelectItem key={gov._id} value={gov._id}>
                                    {gov.govName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                           <div className="space-y-2">
                            <Label htmlFor="deliveryFee">رسوم التوصيل (جنيه)</Label>
                            <Input
                              id="deliveryFee"
                              type="number"
                              value={newCityDeliveryFee}
                              onChange={(e) => setNewCityDeliveryFee(e.target.value)}
                              placeholder="35"
                              className="text-right"
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2 space-x-reverse">
                          <Button variant="outline" onClick={() => setIsAddingCity(false)} disabled={isSubmitting}>
                            إلغاء
                          </Button>
                          <Button onClick={handleAddCity} disabled={isSubmitting}>
                             {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "إضافة"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* أدوات البحث والتصفية */}
              <div className="flex items-center space-x-4 space-x-reverse mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث في المدن..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-8 text-right"
                  />
                </div>
                
                 <Select
                    value={selectedGovernorate}
                    onValueChange={(value) => setSelectedGovernorate(value === 'all' ? '' : value)}
                    dir="rtl"
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="تصفية بالمحافظة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل المحافظات</SelectItem>
                      {governorates.map((gov) => (
                        <SelectItem key={gov._id} value={gov._id}>
                          {gov.govName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>

              {/* جدول المدن */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">اسم المدينة</TableHead>
                      <TableHead className="text-right">المحافظة</TableHead>
                      <TableHead className="text-right">رسوم التوصيل</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingCities ? (
                       <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto my-4" />
                          <p>جاري تحميل المدن...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredCities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <p className="text-muted-foreground">
                             {cities.length === 0 ? "لم تتم إضافة أي مدن بعد" : "لا توجد نتائج تطابق البحث"}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCities.map((city) => (
                        <TableRow key={city._id}>
                          <TableCell className="font-medium">{city.cityName}</TableCell>
                          <TableCell>{city.governorate.govName}</TableCell>
                          <TableCell>{city.shippingCost} جنيه</TableCell>
                          <TableCell>
                            <Badge variant={'default'}>
                              نشط
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  إلغاء التفعيل
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

