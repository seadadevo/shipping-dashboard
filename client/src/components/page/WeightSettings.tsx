import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './../ui/card';
import { Button } from './../ui/button';
import { Input } from './../ui/input';
import { Label } from './../ui/label';
import { Separator } from './../ui/separator';
import api from '../../lib/api';
import { 
  Weight, 
  // Calculator, // لم نعد بحاجة إليه
  Save, 
  Settings,
  DollarSign,
  Info,
  AlertTriangle,
  MapPin // --- أيقونة جديدة ---
} from 'lucide-react';
import { Alert, AlertDescription } from './../ui/alert';

const API_URL = '/api/weight-settings';

interface WeightSettings {
  defaultWeightLimit: number;   
  extraKgCost: number;     
  villageDeliveryCost: number; // --- الإضافة الجديدة ---
}

export function WeightSettings() {
  const [settings, setSettings] = useState<WeightSettings>({
    defaultWeightLimit: 10.0,     
    extraKgCost: 5.0,
    villageDeliveryCost: 0.0 // --- الإضافة الجديدة ---
  });

  const [tempSettings, setTempSettings] = useState<WeightSettings>({...settings});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  
  const fetchSettings = async () => {
    try {
      const response = await api.get(API_URL); 
      const fetchedSettings: WeightSettings = response.data;
      setSettings(fetchedSettings);
      setTempSettings(fetchedSettings);
    } catch (error: any) { 
      console.error("Failed to fetch weight settings:", error);
      const errorMsg = error.response?.data?.message || 'فشل جلب الإعدادات من الخادم.';
      setErrors([errorMsg]);
    }
  };
  
  useEffect(() => {
    fetchSettings();
  }, []);

  const validateSettings = (): boolean => {
    const newErrors: string[] = [];

    if (tempSettings.defaultWeightLimit <= 0) {
      newErrors.push('الوزن الأساسي يجب أن يكون أكبر من 0');
    }
    if (tempSettings.extraKgCost < 0) {
      newErrors.push('تكلفة الكيلو الإضافي لا يمكن أن تكون سالبة');
    }
    // --- التحقق الجديد ---
    if (tempSettings.villageDeliveryCost < 0) {
      newErrors.push('تكلفة التوصيل للقرية لا يمكن أن تكون سالبة');
    }
    // --- نهاية التحقق ---

    if (tempSettings.defaultWeightLimit > 50) {
      newErrors.push('الوزن الأساسي لا يجب أن يتجاوز 50 كجم');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      return;
    }
    setIsSaving(true);
    setErrors([]);
    try {
      // tempSettings يحتوي الآن على كل البيانات
      const response = await api.put(API_URL, tempSettings); 
      const savedSettings: WeightSettings = response.data;
      setSettings(savedSettings);
      setLastSaved(new Date());
    }
    catch (error: any) {
      console.error('Save failed:', error);
      const errorMsg = error.response?.data?.message || 'فشل حفظ الإعدادات في الخادم.';
      setErrors([errorMsg]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setTempSettings({...settings});
    setErrors([]);
  };

  const hasChanges = () => {
    return JSON.stringify(settings) !== JSON.stringify(tempSettings);
  };

  const formatCurrency = (amount: number): string => {
    // التأكد من أن القيمة ليست null أو undefined قبل التقريب
    return `${(amount || 0).toFixed(2)} جنيه`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString('ar', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>إعدادات الوزن وتكلفة الشحن</h1>
        <p className="text-muted-foreground">
          تكوين قواعد الوزن الأساسية والإضافية وتكلفة توصيل القرى
        </p>
      </div>

      {/* current settings */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center">
            <Info className="h-5 w-5 mr-2" />
            الإعدادات الحالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* --- تم تعديل الشبكة لتكون 3 --- */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{settings.defaultWeightLimit} كجم</div>
              <p className="text-sm text-blue-600">الوزن الأساسي</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{formatCurrency(settings.extraKgCost)}</div>
              <p className="text-sm text-blue-600">تكلفة كل كجم إضافي</p>
            </div>
            {/* --- الإضافة الجديدة --- */}
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{formatCurrency(settings.villageDeliveryCost)}</div>
              <p className="text-sm text-blue-600">تكلفة توصيل القرية</p>
            </div>
            {/* --- نهاية الإضافة --- */}
          </div>
          {lastSaved && (
            <p className="text-xs text-blue-600 mt-4 text-center">
              آخر تحديث: {formatDate(lastSaved)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            تعديل إعدادات التكلفة
          </CardTitle>
          <CardDescription>
            قم بتعديل قواعد حساب تكلفة الشحن
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error messages */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              {/* ... (نفس كود الأخطاء) ... */}
            </Alert>
          )}

          {/* Basic cost Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Weight className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium">إعدادات الوزن</h3>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="baseWeight" className="flex items-center">
                  <Weight className="h-4 w-4 mr-2" />
                  الوزن الأساسي (كجم)
                </Label>
                <Input
                  id="baseWeight"
                  type="number"
                  step="1"
                  min="1"
                  max="50"
                  value={tempSettings.defaultWeightLimit}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    defaultWeightLimit: parseFloat(e.target.value) || 0
                  })}
                  placeholder="0.0"
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground">
                  الحد الأقصى للوزن الذي يغطيه سعر الشحن الأساسي للمدينة
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalWeightCost" className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  تكلفة كل كجم إضافي (جنيه)
                </Label>
                <Input
                  id="additionalWeightCost"
                  type="number"
                  step="01"
                  min="0"
                  value={tempSettings.extraKgCost}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    extraKgCost: parseFloat(e.target.value) || 0
                  })}
                  placeholder="0.00"
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground">
                  التكلفة لكل كيلوجرام إضافي فوق الوزن الأساسي
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* --- الإضافة الجديدة: تكلفة القرية --- */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <MapPin className="h-5 w-5 text-green-600" />
              <h3 className="font-medium">إعدادات توصيل القرى</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="villageDeliveryCost" className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                تكلفة التوصيل للقرية (جنيه)
              </Label>
              <Input
                id="villageDeliveryCost"
                type="number"
                step="1"
                min="0"
                value={tempSettings.villageDeliveryCost}
                onChange={(e) => setTempSettings({
                  ...tempSettings,
                  villageDeliveryCost: parseFloat(e.target.value) || 0
                })}
                placeholder="0.00"
                className="text-right max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                سعر ثابت يُضاف على إجمالي الشحنة إذا تم تحديد "توصيل لقرية"
              </p>
            </div>
          </div>
          {/* --- نهاية الإضافة --- */}

          <Separator />

          {/* Reset and Save Buttons */}
          <div className="flex justify-between pt-4">
            {/* ... (نفس كود الأزرار) ... */}
             <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={!hasChanges()}
            >
              إعادة تعيين
            </Button>
            
            <Button 
              onClick={handleSave}
              disabled={!hasChanges() || isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  حفظ الإعدادات
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">ملاحظات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-700">
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>هذه الإعدادات عامة وتطبق على جميع المدن.</li>
            <li>السعر الأساسي للشحن يتم تحديده الآن من صفحة "إدارة المدن".</li>
            <li>لإدارة أنواع الشحن (عادي، سريع، ...) اذهب إلى صفحة "إدارة أنواع الشحن".</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}