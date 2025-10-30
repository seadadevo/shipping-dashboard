import { useState } from 'react';
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
  MoreHorizontal
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

const governorates = [
  { id: '1', name: 'الرياض', code: 'RYD', citiesCount: 15, isActive: true },
  { id: '2', name: 'مكة المكرمة', code: 'MKK', citiesCount: 12, isActive: true },
  { id: '3', name: 'المدينة المنورة', code: 'MDN', citiesCount: 8, isActive: true },
  { id: '4', name: 'المنطقة الشرقية', code: 'EST', citiesCount: 10, isActive: true },
  { id: '5', name: 'عسير', code: 'ASR', citiesCount: 7, isActive: true },
  { id: '6', name: 'تبوك', code: 'TBK', citiesCount: 5, isActive: false },
  { id: '7', name: 'حائل', code: 'HAL', citiesCount: 4, isActive: true },
  { id: '8', name: 'الحدود الشمالية', code: 'NRB', citiesCount: 3, isActive: false },
];

const cities = [
  { id: '1', name: 'الرياض', governorate: 'الرياض', code: 'RYD01', deliveryFee: 25, isActive: true },
  { id: '2', name: 'حي النخيل', governorate: 'الرياض', code: 'RYD02', deliveryFee: 20, isActive: true },
  { id: '3', name: 'حي الملز', governorate: 'الرياض', code: 'RYD03', deliveryFee: 20, isActive: true },
  { id: '4', name: 'حي العليا', governorate: 'الرياض', code: 'RYD04', deliveryFee: 25, isActive: true },
  { id: '5', name: 'جدة', governorate: 'مكة المكرمة', code: 'MKK01', deliveryFee: 30, isActive: true },
  { id: '6', name: 'مكة المكرمة', governorate: 'مكة المكرمة', code: 'MKK02', deliveryFee: 35, isActive: true },
  { id: '7', name: 'الطائف', governorate: 'مكة المكرمة', code: 'MKK03', deliveryFee: 40, isActive: true },
  { id: '8', name: 'المدينة المنورة', governorate: 'المدينة المنورة', code: 'MDN01', deliveryFee: 35, isActive: true },
  { id: '9', name: 'الدمام', governorate: 'المنطقة الشرقية', code: 'EST01', deliveryFee: 30, isActive: true },
  { id: '10', name: 'الخبر', governorate: 'المنطقة الشرقية', code: 'EST02', deliveryFee: 30, isActive: true },
];

export function RegionsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [isAddingGovernorate, setIsAddingGovernorate] = useState(false);
  const [isAddingCity, setIsAddingCity] = useState(false);
  const [newGovernorateName, setNewGovernorateName] = useState('');
  const [newGovernorateCode, setNewGovernorateCode] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [newCityCode, setNewCityCode] = useState('');
  const [newCityGovernorate, setNewCityGovernorate] = useState('');
  const [newCityDeliveryFee, setNewCityDeliveryFee] = useState('');

  const filteredCities = cities.filter(city => {
    const matchesSearch = city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         city.governorate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGovernorate = !selectedGovernorate || city.governorate === selectedGovernorate;
    return matchesSearch && matchesGovernorate;
  });

  const handleAddGovernorate = () => {
    if (newGovernorateName.trim() && newGovernorateCode.trim()) {
      console.log('Adding governorate:', {
        name: newGovernorateName,
        code: newGovernorateCode
      });
      setNewGovernorateName('');
      setNewGovernorateCode('');
      setIsAddingGovernorate(false);
    }
  };

  const handleAddCity = () => {
    if (newCityName.trim() && newCityCode.trim() && newCityGovernorate && newCityDeliveryFee) {
      console.log('Adding city:', {
        name: newCityName,
        code: newCityCode,
        governorate: newCityGovernorate,
        deliveryFee: parseFloat(newCityDeliveryFee)
      });
      setNewCityName('');
      setNewCityCode('');
      setNewCityGovernorate('');
      setNewCityDeliveryFee('');
      setIsAddingCity(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>إدارة المناطق والمدن</h1>
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
            <div className="text-2xl font-bold">{governorates.length}</div>
            <p className="text-xs text-muted-foreground">
              {governorates.filter(g => g.isActive).length} نشط
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">إجمالي المدن</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cities.length}</div>
            <p className="text-xs text-muted-foreground">
              {cities.filter(c => c.isActive).length} نشط
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">متوسط رسوم التوصيل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(cities.reduce((sum, city) => sum + city.deliveryFee, 0) / cities.length)} ريال
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">أعلى رسوم توصيل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...cities.map(city => city.deliveryFee))} ريال
            </div>
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
                <Dialog open={isAddingGovernorate} onOpenChange={setIsAddingGovernorate}>
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
                      <div className="space-y-2">
                        <Label htmlFor="govName">اسم المحافظة</Label>
                        <Input
                          id="govName"
                          value={newGovernorateName}
                          onChange={(e) => setNewGovernorateName(e.target.value)}
                          placeholder="أدخل اسم المحافظة"
                          className="text-right"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="govCode">رمز المحافظة</Label>
                        <Input
                          id="govCode"
                          value={newGovernorateCode}
                          onChange={(e) => setNewGovernorateCode(e.target.value)}
                          placeholder="مثال: RYD"
                          className="text-right"
                        />
                      </div>
                      <div className="flex justify-end space-x-2 space-x-reverse">
                        <Button variant="outline" onClick={() => setIsAddingGovernorate(false)}>
                          إلغاء
                        </Button>
                        <Button onClick={handleAddGovernorate}>
                          إضافة
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
                      <TableHead className="text-right">عدد المدن</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {governorates.map((governorate) => (
                      <TableRow key={governorate.id}>
                        <TableCell className="font-medium">{governorate.name}</TableCell>
                        <TableCell>{governorate.code}</TableCell>
                        <TableCell>{governorate.citiesCount}</TableCell>
                        <TableCell>
                          <Badge variant={governorate.isActive ? 'default' : 'secondary'}>
                            {governorate.isActive ? 'نشط' : 'غير نشط'}
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
                                {governorate.isActive ? 'إلغاء التفعيل' : 'تفعيل'}
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
                    ))}
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
                <Dialog open={isAddingCity} onOpenChange={setIsAddingCity}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة مدينة
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة مدينة جديدة</DialogTitle>
                      <DialogDescription>
                        أدخل بيانات المدينة الجديدة
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="cityName">اسم المدينة</Label>
                          <Input
                            id="cityName"
                            value={newCityName}
                            onChange={(e) => setNewCityName(e.target.value)}
                            placeholder="أدخل اسم المدينة"
                            className="text-right"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cityCode">رمز المدينة</Label>
                          <Input
                            id="cityCode"
                            value={newCityCode}
                            onChange={(e) => setNewCityCode(e.target.value)}
                            placeholder="مثال: RYD01"
                            className="text-right"
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="cityGovernorate">المحافظة</Label>
                          <Input
                            id="cityGovernorate"
                            value={newCityGovernorate}
                            onChange={(e) => setNewCityGovernorate(e.target.value)}
                            placeholder="اختر المحافظة"
                            className="text-right"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deliveryFee">رسوم التوصيل (ريال)</Label>
                          <Input
                            id="deliveryFee"
                            type="number"
                            value={newCityDeliveryFee}
                            onChange={(e) => setNewCityDeliveryFee(e.target.value)}
                            placeholder="25"
                            className="text-right"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 space-x-reverse">
                        <Button variant="outline" onClick={() => setIsAddingCity(false)}>
                          إلغاء
                        </Button>
                        <Button onClick={handleAddCity}>
                          إضافة
                        </Button>
                      </div>
                    </div>
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
                
                <Input
                  placeholder="تصفية حسب المحافظة"
                  value={selectedGovernorate}
                  onChange={(e) => setSelectedGovernorate(e.target.value)}
                  className="w-48 text-right"
                />
              </div>

              {/* جدول المدن */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">اسم المدينة</TableHead>
                      <TableHead className="text-right">المحافظة</TableHead>
                      <TableHead className="text-right">الرمز</TableHead>
                      <TableHead className="text-right">رسوم التوصيل</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCities.map((city) => (
                      <TableRow key={city.id}>
                        <TableCell className="font-medium">{city.name}</TableCell>
                        <TableCell>{city.governorate}</TableCell>
                        <TableCell>{city.code}</TableCell>
                        <TableCell>{city.deliveryFee} ريال</TableCell>
                        <TableCell>
                          <Badge variant={city.isActive ? 'default' : 'secondary'}>
                            {city.isActive ? 'نشط' : 'غير نشط'}
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
                                {city.isActive ? 'إلغاء التفعيل' : 'تفعيل'}
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
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredCities.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">لا توجد نتائج تطابق البحث</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}