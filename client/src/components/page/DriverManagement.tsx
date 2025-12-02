import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription } from '../ui/alert';
import { Truck, MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';
import type { User, Governorate, City } from '../../types';

interface CitySelection {
  governorate: string;
  city: string;
}

export default function DriverManagement() {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<User | null>(null);
  const [selectedCities, setSelectedCities] = useState<CitySelection[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDrivers();
    fetchLocations();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/api/drivers/all');
      setDrivers(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const [govRes, cityRes] = await Promise.all([
        api.get('/api/locations/governorates?limit=100'),
        api.get('/api/locations/cities?limit=1000')
      ]);
      setGovernorates(govRes.data.data);
      setCities(cityRes.data.data);
    } catch (err: any) {
      console.error('Error fetching locations:', err);
    }
  };

  const openAssignDialog = (driver: User) => {
    setSelectedDriver(driver);
    setSelectedCities(driver.assignedCities || []);
    setIsDialogOpen(true);
    setError('');
    setSuccess('');
  };

  const handleCityToggle = (governorate: string, city: string) => {
    setSelectedCities(prev => {
      const exists = prev.some(c => c.governorate === governorate && c.city === city);
      if (exists) {
        return prev.filter(c => !(c.governorate === governorate && c.city === city));
      } else {
        return [...prev, { governorate, city }];
      }
    });
  };

  const isCitySelected = (governorate: string, city: string) => {
    return selectedCities.some(c => c.governorate === governorate && c.city === city);
  };

  const handleToggleAvailability = async (driver: User) => {
    try {
      const newStatus = !driver.isAvailable;
      await api.patch(`/api/drivers/${driver._id}/availability`, {
        isAvailable: newStatus
      });
      
      toast.success(
        newStatus ? 'تم تفعيل السائق بنجاح' : 'تم تعطيل السائق بنجاح'
      );
      
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشل في تحديث حالة السائق');
    }
  };

  const handleSaveAssignment = async () => {
    if (!selectedDriver) return;

    try {
      await api.post(`/api/drivers/${selectedDriver._id}/assign-cities`, {
        cities: selectedCities
      });
      setSuccess('تم تعيين المدن بنجاح');
      fetchDrivers();
      setTimeout(() => {
        setIsDialogOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل تعيين المدن');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة السائقين</h1>
          <p className="text-muted-foreground mt-2">تعيين المدن للسائقين</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {drivers.map((driver) => (
          <Card key={driver._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{driver.fullName}</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {driver.isAvailable ? 'متاح' : 'غير متاح'}
                    </span>
                    <Switch
                      checked={driver.isAvailable || false}
                      onCheckedChange={() => handleToggleAvailability(driver)}
                    />
                  </div>
                  {driver.isAvailable ? (
                    <Badge variant="default" className="bg-green-500">متاح</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-400">غير متاح</Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                <div className="flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" />
                  <span className="text-sm">{driver.phone}</span>
                </div>
                {driver.email && (
                  <div className="flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3" />
                    <span className="text-sm">{driver.email}</span>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">المدن المعينة:</span>
                    <Badge variant="outline">
                      {driver.assignedCities?.length || 0}
                    </Badge>
                  </div>
                  {driver.assignedCities && driver.assignedCities.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {driver.assignedCities.slice(0, 3).map((cityObj, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {cityObj.city}
                        </Badge>
                      ))}
                      {driver.assignedCities.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{driver.assignedCities.length - 3}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">لا يوجد مدن معينة</p>
                  )}
                </div>
                <Button 
                  onClick={() => openAssignDialog(driver)}
                  className="w-full"
                  variant="outline"
                >
                  تعيين المدن
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {drivers.length === 0 && (
        <Card>
          <CardContent className="text-center py-10">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لا يوجد سائقين مسجلين</p>
          </CardContent>
        </Card>
      )}

      {/* Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              تعيين المدن للسائق: {selectedDriver?.fullName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {governorates.map((gov) => {
              const govCities = cities.filter(
                city => typeof city.governorate === 'object' 
                  ? city.governorate._id === gov._id 
                  : city.governorate === gov._id
              );

              if (govCities.length === 0) return null;

              return (
                <div key={gov._id} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">{gov.govName}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {govCities.map((city) => (
                      <div key={city._id} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={`city-${city._id}`}
                          checked={isCitySelected(gov.govName, city.cityName)}
                          onCheckedChange={() => handleCityToggle(gov.govName, city.cityName)}
                        />
                        <label
                          htmlFor={`city-${city._id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {city.cityName}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <div className="flex gap-2 w-full">
              <Button
                onClick={() => setIsDialogOpen(false)}
                variant="outline"
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSaveAssignment}
                className="flex-1"
              >
                حفظ ({selectedCities.length} مدينة)
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
