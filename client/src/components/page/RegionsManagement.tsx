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
  AlertCircle,
  CheckCircle, // ADDED
  XCircle // ADDED
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
  DialogFooter // ADDED
} from '../ui/dialog';
// --- ADDED ---
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
// --- END ADDED ---
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import api from '../../lib/api';
import type { 
  Governorate, 
  City, 
  GetGovernoratesResponse, 
  GetCitiesResponse,
  AddLocationResponse, // This can be reused for update/toggle
  ApiError
} from '../../types';

export function RegionsManagement() {
  // States for data
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  // States for loading
  const [isLoadingGovs, setIsLoadingGovs] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false); // For small actions

  // --- UPDATED: States for forms ---
  const [isGovDialogOpen, setIsGovDialogOpen] = useState(false);
  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentGov, setCurrentGov] = useState<Governorate | null>(null);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  
  // --- ADDED: Delete Alert State ---
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'governorate' | 'city' } | null>(null);

  
  // New Governorate state
  const [newGovernorateName, setNewGovernorateName] = useState('');
  const [newGovernorateCode, setNewGovernorateCode] = useState('');
  
  // New City state
  const [newCityName, setNewCityName] = useState('');
  const [newCityGovernorate, setNewCityGovernorate] = useState('');
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
    const govName = city.governorate?.govName || ''; // Handle potential undefined gov
    const matchesSearch = city.cityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         govName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGovernorate = !selectedGovernorate || 
                                city.governorate?._id === selectedGovernorate;
    return matchesSearch && matchesGovernorate;
  });

  // --- ADDED: Reset Gov Form ---
  const resetGovForm = () => {
      setNewGovernorateName('');
      setNewGovernorateCode('');
      setCurrentGov(null);
      setIsEditMode(false);
      setError(null);
  };

  // --- ADDED: Reset City Form ---
   const resetCityForm = () => {
      setNewCityName('');
      setNewCityGovernorate('');
      setNewCityDeliveryFee('');
      setCurrentCity(null);
      setIsEditMode(false);
      setError(null);
  };

  // --- ADDED: Open Handlers ---
  const handleOpenAddGovDialog = () => {
    resetGovForm();
    setIsGovDialogOpen(true);
  };

  const handleOpenEditGovDialog = (gov: Governorate) => {
    resetGovForm();
    setIsEditMode(true);
    setCurrentGov(gov);
    setNewGovernorateName(gov.govName);
    setNewGovernorateCode(gov.govCode);
    setIsGovDialogOpen(true);
  };

  const handleOpenAddCityDialog = () => {
    resetCityForm();
    setIsCityDialogOpen(true);
  };
  
  const handleOpenEditCityDialog = (city: City) => {
    resetCityForm();
    setIsEditMode(true);
    setCurrentCity(city);
    setNewCityName(city.cityName);
    setNewCityGovernorate(city.governorate._id);
    setNewCityDeliveryFee(String(city.shippingCost));
    setIsCityDialogOpen(true);
  };

  // --- RENAMED & UPDATED: Handle Governorate Form Submit (Add & Edit) ---
  const handleGovernorateFormSubmit = async () => {
    if (!newGovernorateName.trim() || !newGovernorateCode.trim()) {
      setError('الرجاء إدخال اسم ورمز المحافظة');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (isEditMode && currentGov) {
        // --- EDIT LOGIC ---
        const response = await api.put<AddLocationResponse>(`/api/locations/governorates/${currentGov._id}`, {
          govName: newGovernorateName,
          govCode: newGovernorateCode
        });
        // Update state locally
        setGovernorates(governorates.map(g => g._id === currentGov._id ? response.data.data as Governorate : g));

      } else {
        // --- ADD LOGIC ---
        const response = await api.post<AddLocationResponse>('/api/locations/governorates', {
          govName: newGovernorateName,
          govCode: newGovernorateCode
        });
        setGovernorates([...governorates, response.data.data as Governorate]);
      }
      
      setIsGovDialogOpen(false);
      resetGovForm();

    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'حدث خطأ ما');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENAMED & UPDATED: Handle City Form Submit (Add & Edit) ---
  const handleCityFormSubmit = async () => {
    if (!newCityName.trim() || !newCityGovernorate || !newCityDeliveryFee) {
       setError('الرجاء ملء جميع حقول المدينة');
       return;
    }
    
    setIsSubmitting(true);
    setError(null);

    const cityData = {
        cityName: newCityName,
        governorateId: newCityGovernorate,
        shippingCost: parseFloat(newCityDeliveryFee)
    };

    try {
      if (isEditMode && currentCity) {
        // --- EDIT LOGIC ---
         const response = await api.put<AddLocationResponse>(`/api/locations/cities/${currentCity._id}`, cityData);
         // Update state locally
         setCities(cities.map(c => c._id === currentCity._id ? response.data.data as City : c));
      } else {
        // --- ADD LOGIC ---
        const response = await api.post<AddLocationResponse>('/api/locations/cities', cityData);
        setCities([...cities, response.data.data as City]);
      }

      setIsCityDialogOpen(false);
      resetCityForm();

    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'حدث خطأ ما');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ADDED: Toggle Status Handler ---
  const handleToggleStatus = async (id: string, type: 'governorate' | 'city') => {
    setIsLoadingAction(true); // You might want a specific loader state per row
    const url = type === 'governorate' ? `/api/locations/governorates/${id}/toggle-status` : `/api/locations/cities/${id}/toggle-status`;

    try {
        const response = await api.patch<AddLocationResponse>(url);
        const updatedItem = response.data.data;

        if (type === 'governorate') {
            setGovernorates(governorates.map(g => g._id === id ? updatedItem as Governorate : g));
        } else {
            setCities(cities.map(c => c._id === id ? updatedItem as City : c));
        }
    } catch (err) {
         const apiError = err as ApiError;
         // Show a toast or alert here
         console.error(apiError.response?.data?.message || 'فشل تغيير الحالة');
    } finally {
        setIsLoadingAction(false);
    }
  };
  
  // --- ADDED: Delete Handlers ---
  const handleDeleteClick = (id: string, type: 'governorate' | 'city') => {
    setItemToDelete({ id, type });
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsSubmitting(true); // Use main submitter for modal
    setError(null);
    const { id, type } = itemToDelete;
    const url = type === 'governorate' ? `/api/locations/governorates/${id}` : `/api/locations/cities/${id}`;

    try {
        await api.delete(url);
        
        if (type === 'governorate') {
            setGovernorates(governorates.filter(g => g._id !== id));
        } else {
            setCities(cities.filter(c => c._id !== id));
        }
        
        setIsDeleteAlertOpen(false);
        setItemToDelete(null);

    } catch (err) {
       const apiError = err as ApiError;
       // Display error in the alert dialog itself
       setError(apiError.response?.data?.message || 'فشل الحذف. قد تكون المنطقة مستخدمة.');
       console.error(apiError.response?.data?.message);
    } finally {
        setIsSubmitting(false);
    }
  };


  // Statistics
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
      {/* ... (Header and Statistics Cards remain the same) ... */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة المناطق والمدن</h1>
          <p className="text-muted-foreground">
            إدارة المحافظات والمدن وتحديد رسوم التوصيل
          </p>
        </div>
      </div>
      
      {/* ... (إحصائيات سريعة - remains the same) ... */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* ... Card 1 ... */}
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
        
        {/* ... Card 2 ... */}
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
        
        {/* ... Card 3 ... */}
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

        {/* ... Card 4 ... */}
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

      {/* Tabs */}
      <Tabs defaultValue="governorates" className="space-y-4">
        {/* ... (TabsList remains the same) ... */}
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

        {/* Governorates Tab */}
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
                {/* --- UPDATED: Governorates Dialog Trigger --- */}
                <Dialog open={isGovDialogOpen} onOpenChange={(isOpen) => {
                  setIsGovDialogOpen(isOpen);
                  if (!isOpen) resetGovForm(); // Reset on close
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleOpenAddGovDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة محافظة
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{isEditMode ? 'تعديل محافظة' : 'إضافة محافظة جديدة'}</DialogTitle>
                      <DialogDescription>
                        {isEditMode ? 'قم بتحديث بيانات المحافظة' : 'أدخل بيانات المحافظة الجديدة'}
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
                        <Button variant="outline" onClick={() => setIsGovDialogOpen(false)} disabled={isSubmitting}>
                          إلغاء
                        </Button>
                        <Button onClick={handleGovernorateFormSubmit} disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEditMode ? "تحديث" : "إضافة")}
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
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* ... (Loading and Empty states remain the same) ... */}
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
                        <TableRow key={governorate._id} className={!governorate.isActive ? 'bg-gray-50 opacity-60' : ''}>
                          <TableCell className="font-medium">{governorate.govName}</TableCell>
                          <TableCell>{governorate.govCode}</TableCell>
                          {/* --- UPDATED: Status Badge --- */}
                          <TableCell>
                            <Badge variant={governorate.isActive ? 'default' : 'outline'} className={governorate.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {governorate.isActive ? 'نشط' : 'غير نشط'}
                            </Badge>
                          </TableCell>
                          {/* --- UPDATED: Dropdown Menu --- */}
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-blue-50" align="end">
                                <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenEditGovDialog(governorate)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(governorate._id, 'governorate')}>
                                  {governorate.isActive ? (
                                    <>
                                      <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                      إلغاء التفعيل
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                      تفعيل
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(governorate._id, 'governorate')}>
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

        {/* Cities Tab */}
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
                 {/* --- UPDATED: Cities Dialog Trigger --- */}
                 <Dialog open={isCityDialogOpen} onOpenChange={(isOpen) => {
                   setIsCityDialogOpen(isOpen);
                   if (!isOpen) resetCityForm(); // Reset on close
                 }}>
                   <DialogTrigger asChild>
                     <Button className="bg-blue-600 hover:bg-blue-700" disabled={governorates.length === 0} onClick={handleOpenAddCityDialog}>
                       <Plus className="h-4 w-4 mr-2" />
                       إضافة مدينة
                     </Button>
                   </DialogTrigger>
                   <DialogContent>
                     <DialogHeader>
                       <DialogTitle>{isEditMode ? 'تعديل مدينة' : 'إضافة مدينة جديدة'}</DialogTitle>
                       <DialogDescription>
                         {governorates.length === 0 ? "يجب إضافة محافظة أولاً" : (isEditMode ? "قم بتحديث بيانات المدينة" : "أدخل بيانات المدينة الجديدة")}
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
                                 {/* Show only active governorates when adding/editing */}
                                 {governorates.filter(g => g.isActive || g._id === newCityGovernorate).map((gov) => (
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
                           <Button variant="outline" onClick={() => setIsCityDialogOpen(false)} disabled={isSubmitting}>
                             إلغاء
                           </Button>
                           <Button onClick={handleCityFormSubmit} disabled={isSubmitting}>
                              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEditMode ? "تحديث" : "إضافة")}
                           </Button>
                         </div>
                       </div>
                     )}
                   </DialogContent>
                 </Dialog>
               </div>
            </CardHeader>
            <CardContent>
              {/* ... (Search and Filter UI remains the same) ... */}
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

              {/* Cities Table */}
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
                    {/* ... (Loading and Empty states remain the same) ... */}
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
                        <TableRow key={city._id} className={!city.isActive ? 'bg-gray-50 opacity-60' : ''}>
                          <TableCell className="font-medium">{city.cityName}</TableCell>
                          <TableCell>{city.governorate?.govName || 'N/A'}</TableCell>
                          <TableCell>{city.shippingCost} جنيه</TableCell>
                          {/* --- UPDATED: Status Badge --- */}
                          <TableCell>
                            <Badge variant={city.isActive ? 'default' : 'outline'} className={city.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {city.isActive ? 'نشط' : 'غير نشط'}
                            </Badge>
                          </TableCell>
                          {/* --- UPDATED: Dropdown Menu --- */}
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-blue-50" align="end">
                                <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenEditCityDialog(city)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(city._id, 'city')}>
                                   {city.isActive ? (
                                    <>
                                      <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                      إلغاء التفعيل
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                      تفعيل
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(city._id, 'city')}>
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

    {/* --- ADDED: Delete Confirmation Dialog --- */}
    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
          <AlertDialogDescription>
            هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف العنصر نهائياً.
            {itemToDelete?.type === 'governorate' && " (ملاحظة: لا يمكن حذف المحافظة إذا كانت تحتوي على مدن)."}
          </AlertDialogDescription>
        </AlertDialogHeader>
         {error && (
            <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 ml-2" />
                <p className="text-sm">{error}</p>
            </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => { setIsDeleteAlertOpen(false); setError(null); }} disabled={isSubmitting}>
            إلغاء
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmDelete} 
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "نعم، قم بالحذف"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    </div>
  );
}