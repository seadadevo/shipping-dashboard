import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Switch } from "../ui/switch";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, Search, Truck, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/api";
import type { User, Governorate, City } from "../../types";

interface CitySelection {
  governorate: string;
  city: string;
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Pagination } from "../ui/pagination";

export default function DriverManagement() {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "available" | "unavailable"
  >("all");
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<User | null>(null);
  const [selectedCities, setSelectedCities] = useState<CitySelection[]>([]);
  const [initialSelectedCities, setInitialSelectedCities] = useState<
    CitySelection[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchDrivers();
    fetchLocations();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await api.get("/api/drivers/all");
      setDrivers(response.data.data);
      setFilteredDrivers(response.data.data);
    } catch (err: unknown) {
      if (
        (err as any).response &&
        (err as any).response.data &&
        (err as any).response.data.message
      ) {
        setError((err as any).response.data.message);
      } else {
        setError("Failed to fetch drivers");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = drivers;

    // Filter by Status
    if (statusFilter !== "all") {
      const isAvailable = statusFilter === "available";
      filtered = filtered.filter(
        (driver) => driver.isAvailable === isAvailable
      );
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (driver) =>
          driver.fullName.toLowerCase().includes(query) ||
          driver.phone?.toLowerCase().includes(query) ||
          driver.email?.toLowerCase().includes(query) ||
          driver.assignedCities?.some(
            (city) =>
              city.city.toLowerCase().includes(query) ||
              city.governorate.toLowerCase().includes(query)
          )
      );
    }

    setFilteredDrivers(filtered);
    setCurrentPage(1); // Reset to first page
  }, [searchQuery, drivers, statusFilter]);

  const fetchLocations = async () => {
    try {
      const [govRes, cityRes] = await Promise.all([
        api.get("/api/locations/governorates?limit=100"),
        api.get("/api/locations/cities?limit=1000"),
      ]);
      setGovernorates(govRes.data.data);
      setCities(cityRes.data.data);
    } catch (err: any) {
      console.error("Error fetching locations:", err);
    }
  };

  const openAssignDialog = (driver: User) => {
    setSelectedDriver(driver);
    const assigned = driver.assignedCities || [];
    setSelectedCities(assigned);
    setInitialSelectedCities(assigned);
    setIsDialogOpen(true);
    setError("");
    setSuccess("");
  };

  const handleCityToggle = (governorate: string, city: string) => {
    setSelectedCities((prev) => {
      const exists = prev.some(
        (c) => c.governorate === governorate && c.city === city
      );
      if (exists) {
        return prev.filter(
          (c) => !(c.governorate === governorate && c.city === city)
        );
      } else {
        return [...prev, { governorate, city }];
      }
    });
  };

  const isCitySelected = (governorate: string, city: string) => {
    return selectedCities.some(
      (c) => c.governorate === governorate && c.city === city
    );
  };

  const handleToggleAvailability = async (driver: User) => {
    try {
      const newStatus = !driver.isAvailable;
      await api.patch(`/api/drivers/${driver._id}/availability`, {
        isAvailable: newStatus,
      });

      toast.success(
        newStatus ? "تم تفعيل السائق بنجاح" : "تم تعطيل السائق بنجاح"
      );

      fetchDrivers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "فشل في تحديث حالة السائق");
    }
  };

  const handleSaveAssignment = async () => {
    if (!selectedDriver) return;

    try {
      await api.post(`/api/drivers/${selectedDriver._id}/assign-cities`, {
        cities: selectedCities,
      });
      setSuccess("تم تعيين المدن بنجاح");
      fetchDrivers();
      setTimeout(() => {
        setIsDialogOpen(false);
        setSuccess("");
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "فشل تعيين المدن");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن سائق بالاسم، الهاتف، أو المدينة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: "all" | "available" | "unavailable") =>
            setStatusFilter(value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="تصفية حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="available">متاح</SelectItem>
            <SelectItem value="unavailable">غير متاح</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-600">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        {filteredDrivers.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {searchQuery ? "لا توجد نتائج للبحث" : "لا يوجد سائقين"}
          </div>
        ) : (
          filteredDrivers
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((driver) => (
              <Card
                key={driver._id}
                className={`overflow-hidden transition-all duration-200 hover:shadow-md border-l-4 ${
                  driver.isAvailable
                    ? "border-l-green-500"
                    : "border-l-gray-300"
                }`}
              >
                <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                  {/* 1. Driver Info */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div
                      className={`p-2 rounded-full ${
                        driver.isAvailable
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {driver.fullName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {driver.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {driver.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Availability Status */}
                  <div className="flex items-center gap-3 bg-secondary/30 p-2 rounded-lg border border-border/50">
                    <span className="text-sm font-medium">
                      {driver.isAvailable ? "متاح للعمل" : "غير متاح"}
                    </span>
                    <Switch
                      checked={driver.isAvailable || false}
                      onCheckedChange={() => handleToggleAvailability(driver)}
                      className="cursor-pointer"
                    />
                    <Badge
                      variant={driver.isAvailable ? "default" : "secondary"}
                      className={`${
                        driver.isAvailable
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-400"
                      } shadow-none`}
                    >
                      {driver.isAvailable ? "نشط" : "غير نشط"}
                    </Badge>
                  </div>

                  {/* 3. Assigned Cities (Dropdown) */}
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-9 gap-2 min-w-[150px] justify-between bg-background hover:bg-accent cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {driver.assignedCities?.length || 0} مدن معينة
                            </span>
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-[220px] max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
                      >
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                          المدن المغطاة
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {driver.assignedCities &&
                        driver.assignedCities.length > 0 ? (
                          <div className="grid gap-1 p-1">
                            {driver.assignedCities.map((cityObj, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-end px-2 py-1.5 text-sm text-foreground/80 hover:bg-muted/50 rounded-md select-none"
                              >
                                <span>
                                  {cityObj.city}
                                  <span className="text-xs text-muted-foreground mr-1 opacity-70">
                                    {typeof cityObj.governorate === "string"
                                      ? ""
                                      : `(${cityObj.governorate})`}
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            لا يوجد مدن
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* 4. Action Button */}
                  <Button
                    onClick={() => openAssignDialog(driver)}
                    size="sm"
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] shadow-sm hover:shadow cursor-pointer"
                  >
                    تعديل المدن
                  </Button>
                </div>
              </Card>
            ))
        )}
      </div>

      {filteredDrivers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredDrivers.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredDrivers.length}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

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
        <DialogContent
          className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 bg-background"
          dir="rtl"
        >
          <DialogHeader className="p-6 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  تعيين مناطق التغطية
                  <Badge variant="outline" className="text-base font-normal">
                    {selectedDriver?.fullName}
                  </Badge>
                </DialogTitle>
                <p className="text-muted-foreground mt-1 text-sm">
                  حدد المدن والمناطق التي يغطيها السائق.
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 bg-background">
            <div className="space-y-8">
              {governorates.map((gov) => {
                const govCities = cities.filter((city) =>
                  typeof city.governorate === "object"
                    ? city.governorate._id === gov._id
                    : city.governorate === gov._id
                );

                if (govCities.length === 0) return null;

                const selectedInGov = govCities.filter((city) =>
                  isCitySelected(gov.govName, city.cityName)
                ).length;

                return (
                  <div key={gov._id}>
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="font-bold text-lg text-foreground">
                        {gov.govName}
                      </h3>
                      {selectedInGov > 0 && (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {selectedInGov}
                        </span>
                      )}
                      <div className="h-px bg-border flex-1" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {govCities.map((city) => {
                        const isSelected = isCitySelected(
                          gov.govName,
                          city.cityName
                        );
                        return (
                          <div
                            key={city._id}
                            onClick={() =>
                              handleCityToggle(gov.govName, city.cityName)
                            }
                            className={`
                                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 select-none
                                  ${
                                    isSelected
                                      ? "bg-primary/5 border-primary shadow-sm"
                                      : "bg-card border-transparent hover:bg-accent hover:border-border"
                                  }
                                `}
                          >
                            <div
                              className={`
                                    w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0
                                    ${
                                      isSelected
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-muted-foreground/30"
                                    }
                                `}
                            >
                              {isSelected && (
                                <div className="w-2.5 h-2.5 bg-white rounded-sm" />
                              )}
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                isSelected ? "text-primary" : "text-foreground"
                              }`}
                            >
                              {city.cityName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="p-6 border-t bg-background shrink-0">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                تم تحديد{" "}
                <span className="font-bold text-foreground">
                  {selectedCities.length}
                </span>{" "}
                مدينة
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  variant="ghost"
                  className="min-w-[80px]"
                >
                  إلغاء
                </Button>
                {(() => {
                  // Simple change detection logic
                  const sortedCurrent = [...selectedCities].sort((a, b) =>
                    a.city.localeCompare(b.city)
                  );
                  const sortedInitial = [...initialSelectedCities].sort(
                    (a, b) => a.city.localeCompare(b.city)
                  );
                  const hasChanges =
                    JSON.stringify(sortedCurrent) !==
                    JSON.stringify(sortedInitial);

                  return (
                    <Button
                      onClick={handleSaveAssignment}
                      disabled={!hasChanges}
                      className={`min-w-[120px] rounded-full transition-all duration-300 ${
                        !hasChanges
                          ? "opacity-50 grayscale"
                          : "shadow-lg shadow-primary/20"
                      }`}
                    >
                      حفظ التغييرات
                    </Button>
                  );
                })()}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
