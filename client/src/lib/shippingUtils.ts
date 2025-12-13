// تعريف الأنواع (Interfaces) لتنظيم الكود
interface City {
  shippingCost: number;
  // ... أي خصائص أخرى للمدينة
}

interface ShippingType {
  adjustmentAmount: number;
  // ... أي خصائص أخرى
}

interface WeightSettings {
  defaultWeightLimit: number;
  extraKgCost: number;
  // ... أي خصائص أخرى
}

/**
 * يحسب تكلفة الشحن النهائية بناءً على المنطق الجديد
 *
 * @param {number} totalWeight - إجمالي وزن الطرد
 * @param {City} city - بيانات المدينة (يحتوي على shippingCost)
 * @param {ShippingType} shippingType - بيانات نوع الشحن (يحتوي على adjustmentAmount)
 * @param {WeightSettings} weightSettings - إعدادات الوزن العامة (defaultWeightLimit, extraKgCost)
 * @returns {number} التكلفة النهائية
 */
export function calculateFinalShippingCost(
  totalWeight: number, 
  city: City, 
  shippingType: ShippingType, 
  weightSettings: WeightSettings
): number {
  
  // 1. تحديد المتغيرات
  const cityBaseCost = city.shippingCost; 
  const globalWeightLimit = weightSettings.defaultWeightLimit;
  const globalExtraKgCost = weightSettings.extraKgCost;
  const typeAdjustment = shippingType.adjustmentAmount;

  let weightCost = 0;

  // 2. حساب تكلفة الوزن
  if (totalWeight <= 0) {
    weightCost = 0; 
  } else if (totalWeight <= globalWeightLimit) {
    // ضمن الحد الأساسي، التكلفة = سعر المدينة
    weightCost = cityBaseCost; 
  } else {
    // تجاوز الحد الأساسي
    const extraWeight = totalWeight - globalWeightLimit;
    const extraCost = extraWeight * globalExtraKgCost;
    weightCost = cityBaseCost + extraCost;
  }

  // 3. تطبيق تعديل نوع الشحن (إضافة أو خصم)
  const finalCost = weightCost + typeAdjustment;
  
  // ضمان أن التكلفة لا تقل عن 0
  return Math.max(0, finalCost);
}

// يمكنك وضع أي دوال أخرى متعلقة بالشحن هنا مستقبلاً