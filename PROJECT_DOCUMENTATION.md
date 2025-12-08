
# 📦 Flash Line - نظام إدارة الشحن والتوصيل

  

## 📋 نظرة عامة على المشروع

**Flash Line** هو نظام شامل لإدارة عمليات الشحن والتوصيل، مصمم خصيصاً للشركات اللوجستية في مصر. يوفر النظام لوحات تحكم متعددة لأنواع مختلفة من المستخدمين (الإدارة، الموظفين، التجار، السائقين) مع نظام متطور لحساب تكاليف الشحن وإدارة حالات الطلبات.
  

---
## 🎯 الهدف من المشروع


- **أتمتة عمليات الشحن**: تقليل الأخطاء اليدوية وتسريع معالجة الطلبات
- **شفافية كاملة**: تتبع الطلبات في الوقت الفعلي لجميع الأطراف
- **حسابات دقيقة**: نظام ذكي لحساب تكلفة الشحن بناءً على الوزن، الموقع، ونوع الخدمة
- **إدارة مرنة**: صلاحيات محددة لكل نوع مستخدم مع تحكم كامل للإدارة
- **تقارير وإحصائيات**: رؤية شاملة للعمليات مع إمكانية تصدير البيانات

---

  

## 🏗️ البنية التقنية (Architecture)

### **Technology Stack**
#### **Backend:**


- **Node.js** + **Express.js**: بيئة تشغيل وإطار عمل للخادم
- **MongoDB** + **Mongoose**: قاعدة بيانات NoSQL مع ORM
- **JWT (jsonwebtoken)**: المصادقة والتفويض
- **bcryptjs**: تشفير كلمات المرور
- **validator**: التحقق من صحة البيانات
#### **Frontend:**

- **React** + **TypeScript**: مكتبة UI مع دعم الأنواع الثابتة
- **Vite**: أداة بناء سريعة
- **TailwindCSS**: إطار عمل CSS utility-first
- **shadcn/ui**: مكونات UI جاهزة
- **React Router**: التنقل بين الصفحات
- **Axios**: طلبات HTTP
- **Recharts**: رسوم بيانية
- **Sonner**: إشعارات Toast

## 👥 أنواع المستخدمين (User Roles)

  

### **1. Admin (المسؤول)**

**الصلاحيات:**

- ✅ تحكم كامل في جميع أجزاء النظام
- ✅ إدارة المستخدمين (إضافة [ ادمن او موظف او تاجر او مندوب ] ، تعديل، حذف)
- ✅ إدارة الطلبات (جميع الحالات)
- ✅ تعيين السائقين على المدن
- ✅ إدارة المناطق (محافظات ومدن)
- ✅ ضبط إعدادات الشحن والوزن
- ✅ تغيير حالة أي طلب لأي حالة
- ✅ إنشاء طلبات بالنيابة عن التجار
- ✅ عرض إحصائيات شاملة
- ✅ تصدير البيانات والتقارير

  

**لوحة التحكم:**

- إحصائيات اليوم: عدد الطلبات، الإيرادات، الطلبات المعلقة
- رسوم بيانية للطلبات الأسبوعية
- نسب النمو المقارنة
  

### **2. Employee (الموظف)**

**الصلاحيات:**

- ✅ إدارة الطلبات (عرض، إضافة)
- ✅ إنشاء طلبات بالنيابة عن التجار
- ✅ تعديل حالات محدودة: `Pending ↔ Processing` فقط
- ✅ البحث عن التجار
- ⛔ لا يمكنه إضافة أو حذف مستخدمين
- ⛔ لا يمكنه تعديل الإعدادات


**لوحة التحكم:**

- إحصائيات الطلبات اليومية
- الطلبات المعلقة للمعالجة
  

### **3. Merchant (التاجر)**

**الصلاحيات:**

- ✅ إنشاء طلبات جديدة
- ✅ عرض طلباته فقط
- ✅ إلغاء طلبات في حالة `Pending` أو `Processing`
- ⛔ لا يمكنه رؤية طلبات التجار الآخرين
- ⛔ لا يمكنه تعديل حالة الطلب بعد بدء التوصيل

**لوحة التحكم:**

- إجمالي طلباته
- الطلبات النشطة والمكتملة
- رسم بياني للطلبات الأسبوعية

  

### **4. Courier (السائق)**

**الصلاحيات:**

- ✅ عرض الطلبات المعينة له فقط
- ✅ تحديث حالة التوصيل:

  - `Processing → On the Way`
  - `On the Way → Delivered`
  - `On the Way → Processing` (إرجاع)

- ✅ عرض معلومات العميل الكاملة
- ⛔ لا يمكنه إلغاء الطلبات
- ⛔ لا يمكنه رؤية طلبات سائقين آخرين 

**لوحة التحكم:**

- إحصائيات التوصيلات (اليوم، الأسبوع، الإجمالي)
- الطلبات المعلقة للتوصيل
- معدل نجاح التسليم

  

---

  

## 🗄️ قاعدة البيانات (Database Schema)

  

### **1. User Model**

  

```javascript

{
  userType: String, // 'admin' | 'employee' | 'merchant' | 'courier'
  fullName: String, // الاسم الكامل
  email: String, // بريد إلكتروني فريد
  password: String, // مشفر ببcrypt
  phone: String,
  address: String,
  governorate: String,
  city: String,
  storeName: String, // للتجار فقط
  assignedCities: [{ governorate, city }], // للسائقين فقط
  isAvailable: Boolean // حالة السائق
}

```

  

**العلاقات:**

- يمتلك السائق (courier) مصفوفة `assignedCities` للمدن المعينة له
- التاجر (merchant) له `storeName` إلزامي

  

---

  

### **2. Order Model**

  

```javascript

{

  orderNumber: String, // رقم فريد (مُولّد تلقائياً)

  orderType: String, // 'استلام من المتجر' | 'من الباب للباب' | 'من المستودع'

  

  // بيانات العميل

  customerName: String,

  customerPhone1: String,

  customerPhone2: String,

  customerEmail: String,

  

  // بيانات العنوان

  governorate: String,

  city: String,

  village: String,

  street: String,

  isVillageDelivery: Boolean,

  

  // بيانات الشحن

  shippingType: String, // اسم نوع الشحن

  paymentType: String, // 'واجبة التحصيل' | 'دفع مقدم' | 'طرد مقابل طرد'

  branch: String,

  

  // المنتجات

  products: [{

    productName: String,

    quantity: Number,

    weight: Number

  }],

  

  totalWeight: Number, // إجمالي الوزن

  orderCost: Number, // التكلفة المحسوبة

  

  // حالة الطلب

  status: String, // 'Pending' | 'Processing' | 'On the Way' | 'Delivered' | 'Cancelled'

  

  // سجل تغييرات الحالة

  stateHistory: [{

    previousState: String,

    newState: String,

    changedBy: ObjectId (ref: User),

    changeReason: String,

    changedAt: Date

  }],

  

  notes: String,

  createdBy: ObjectId (ref: User), // من أنشأ الطلب

  assignedDriver: ObjectId (ref: User), // السائق المعين

  driverStatus: String // 'pending' | 'picked-up' | 'in-transit' | 'delivered'

}

```

  

**العلاقات:**

  

- `createdBy` → User (التاجر أو الموظف)

- `assignedDriver` → User (السائق)

- `stateHistory.changedBy` → User

  

**Hooks:**

  

- **Pre-save**: توليد `orderNumber` تلقائياً

  

---

  

### **3. Governorate Model**

  

```javascript

{

  govName: String, // اسم المحافظة (فريد)
  govCode: String, // كود المحافظة (فريد)
  isActive: Boolean, // حالة التفعيل
  createdAt: Date,
  updatedAt: Date

}

```

  

---

  

### **4. City Model**

  

```javascript

{

  cityName: String,

  governorate: ObjectId (ref: Governorate),

  shippingCost: Number, // تكلفة الشحن الأساسية لهذه المدينة

  isActive: Boolean,

  createdAt: Date,

  updatedAt: Date

}

```

  

**Indexes:**

  

- Compound Index: `{ cityName, governorate }` (unique)

  

**العلاقات:**

  

- `governorate` → Governorate

  

---

  

### **5. ShippingType Model**

  

```javascript

{

  name: String, // 'عادي' | 'سريع 24 ساعة' | 'نفس اليوم'

  adjustmentAmount: Number, // قيمة التعديل (+50 للسريع، -20 للبطيء، 0 للعادي)

  description: String,

  isActive: Boolean,

  createdAt: Date,

  updatedAt: Date

}

```

  

**مثال:**

  

- عادي: `adjustmentAmount = 0`

- سريع 24 ساعة: `adjustmentAmount = 50` (إضافة 50 جنيه)

- اقتصادي: `adjustmentAmount = -20` (خصم 20 جنيه)

  

---

  

### **6. WeightSetting Model**

  

```javascript

{

  defaultWeightLimit: Number, // الحد الأقصى للوزن الأساسي (مثال: 10 كجم)

  extraKgCost: Number, // تكلفة كل كجم إضافي

  villageDeliveryCost: Number, // تكلفة إضافية للتوصيل للقرى

  updatedAt: Date

}

```

  

**يوجد سجل واحد فقط في هذا الجدول** (إعدادات عامة للنظام)

  

---

  

## 🧮 نظام حساب تكلفة الشحن

  

### **المعادلة الأساسية:**

  

```

التكلفة النهائية = تكلفة الوزن + تعديل نوع الشحن + تكلفة القرية (إن وجدت)

```

  

### **خطوات الحساب:**

  

#### **1. تكلفة الوزن:**

  

```javascript

if (totalWeight <= defaultWeightLimit) {

  weightCost = city.shippingCost

} else {

  extraWeight = totalWeight - defaultWeightLimit

  weightCost = city.shippingCost + (extraWeight × extraKgCost)

}

```

  

**مثال:**

  

- مدينة القاهرة: `shippingCost = 50` جنيه

- الوزن الأساسي: `defaultWeightLimit = 10` كجم

- الوزن الإضافي: `extraKgCost = 5` جنيه/كجم

  

**حالات:**

  

- طرد وزنه 8 كجم → `50` جنيه فقط

- طرد وزنه 15 كجم → `50 + (5 × 5) = 75` جنيه

  

#### **2. تعديل نوع الشحن:**

  

```javascript

finalCost = weightCost + shippingType.adjustmentAmount;

```

  

**مثال:**

  

- عادي: `+0` جنيه

- سريع 24 ساعة: `+50` جنيه

- اقتصادي: `-20` جنيه

  

#### **3. تكلفة القرية:**

  

```javascript

if (isVillageDelivery === true) {

  finalCost += villageDeliveryCost;

}

```

  

### **مثال شامل:**

  

**بيانات الطلب:**

  

- المدينة: القاهرة (`shippingCost = 50`)

- الوزن: 15 كجم

- نوع الشحن: سريع 24 ساعة (`adjustmentAmount = +50`)

- توصيل قرية: لا

  

**الحساب:**

  

```

1. تكلفة الوزن = 50 + (5 × 5) = 75 جنيه

2. تعديل نوع الشحن = +50 جنيه

3. تكلفة القرية = 0 جنيه

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   التكلفة النهائية = 125 جنيه

```

  

---

  

## 🔄 State Machine - نظام انتقال حالات الطلبات

  

### **الحالات المتاحة:**

  

1. **Pending** (قيد الانتظار)

2. **Processing** (قيد المعالجة)

3. **On the Way** (في الطريق)

4. **Delivered** (تم التسليم)

5. **Cancelled** (ملغي)

  

### **قواعد الانتقال حسب نوع المستخدم:**

  

#### **Admin (تحكم كامل):**

  

```

Pending      → Processing, On the Way, Delivered, Cancelled

Processing   → Pending, On the Way, Delivered, Cancelled

On the Way   → Pending, Processing, Delivered, Cancelled

Delivered    → Pending, Processing, On the Way, Cancelled

Cancelled    → Pending, Processing, On the Way, Delivered

```

  

✅ **يمكنه التنقل بين أي حالة**

  

---

  

#### **Employee:**

  

```

Pending      → Processing, Cancelled

Processing   → Pending, Cancelled

On the Way   → ⛔ (ممنوع)

Delivered    → ⛔ (ممنوع)

Cancelled    → ⛔ (ممنوع)

```

  

✅ يمكنه فقط بدء معالجة الطلب أو إلغائه في المراحل الأولى

  

---

  

#### **Merchant:**

  

```

Pending      → Cancelled

Processing   → Cancelled

On the Way   → ⛔ (ممنوع)

Delivered    → ⛔ (ممنوع)

Cancelled    → ⛔ (ممنوع)

```

  

✅ يمكنه فقط إلغاء طلباته قبل بدء التوصيل

  

---

  

#### **Courier (السائق):**

  

```

Pending      → ⛔ (ممنوع)

Processing   → On the Way, Delivered

On the Way   → Processing, Delivered

Delivered    → ⛔ (ممنوع)

Cancelled    → ⛔ (ممنوع)

```

  

✅ يمكنه فقط تحديث حالة التوصيل (استلام، في الطريق، تم التسليم)

  

---

### **سجل تغيير الحالة (State History):**  

عند كل تغيير في حالة الطلب، يتم تسجيل:


- الحالة السابقة
- الحالة الجديدة
- من قام بالتغيير (User ID)
- سبب التغيير (اختياري)
- وقت التغيير

  

**فائدة:** التدقيق الكامل وتتبع مسار الطلب

  

---

  

## 🛣️ API Endpoints

  

### **Authentication:**

  

```

POST   /api/v1/auth/login       // تسجيل دخول

```

  

### **Users:**

  

```

GET    /api/users                       // جميع المستخدمين (admin, employee)

GET    /api/users/profile               // ملف المستخدم الحالي

GET    /api/users/search?q=...          // بحث عن مستخدمين (admin)

GET    /api/users/merchants/search?q=... // بحث عن تجار (admin, employee)

POST   /api/users/add                   // إضافة مستخدم (admin)

PUT    /api/users/password              // تغيير كلمة المرور

PUT    /api/users/:id                   // تعديل مستخدم (admin)

DELETE /api/users/:id                   // حذف مستخدم (admin)

```

  

### **Orders:**

  

```

GET    /api/orders                        // جميع الطلبات (admin, employee)

GET    /api/orders/my-orders              // طلبات التاجر الحالي (merchant)

GET    /api/orders/search?q=...           // بحث في الطلبات

POST   /api/orders/add                    // إنشاء طلب (merchant, employee)

POST   /api/orders/calculate-cost         // حساب التكلفة (جميع المستخدمين)

PUT    /api/orders/:id/status             // تحديث حالة الطلب

PUT    /api/orders/:id/assign-driver      // تعيين سائق (admin)

DELETE /api/orders/:id                    // حذف طلب (admin)

```

  

### **Drivers (Couriers):**

  

```

GET    /api/drivers                          // جميع السائقين (admin)

GET    /api/drivers/by-city?governorate=...&city=...  // سائقو مدينة محددة

GET    /api/drivers/:id/deliveries           // توصيلات سائق محدد

GET    /api/drivers/:id/stats                // إحصائيات سائق

POST   /api/drivers/:id/assign-cities        // تعيين مدن لسائق (admin)

PUT    /api/drivers/:id/status               // تحديث حالة السائق (admin)

PUT    /api/drivers/:id/availability         // تحديث توفر السائق

```

  

### **Locations:**

  

```

GET    /api/locations/governorates           // جميع المحافظات

GET    /api/locations/governorates/:id/cities  // مدن محافظة محددة

POST   /api/locations/governorates           // إضافة محافظة (admin)

PUT    /api/locations/governorates/:id       // تعديل محافظة (admin)

PATCH  /api/locations/governorates/toggle/:id  // تفعيل/إلغاء تفعيل (admin)

DELETE /api/locations/governorates/:id       // حذف محافظة (admin)

  

GET    /api/locations/cities                 // جميع المدن

POST   /api/locations/cities                 // إضافة مدينة (admin)

PUT    /api/locations/cities/:id             // تعديل مدينة (admin)

PATCH  /api/locations/cities/toggle/:id      // تفعيل/إلغاء تفعيل (admin)

DELETE /api/locations/cities/:id             // حذف مدينة (admin)

```

  

### **Shipping Types:**

  

```

GET    /api/shipping-types              // جميع أنواع الشحن

POST   /api/shipping-types              // إضافة نوع شحن (admin)

PUT    /api/shipping-types/:id          // تعديل نوع شحن (admin)

PATCH  /api/shipping-types/toggle/:id   // تفعيل/إلغاء تفعيل (admin)

DELETE /api/shipping-types/:id          // حذف نوع شحن (admin)

```

  

### **Weight Settings:**

  

```

GET    /api/weight-settings             // الإعدادات الحالية

PUT    /api/weight-settings             // تحديث الإعدادات (admin)

```

  

---

  

## 🔐 نظام الحماية والصلاحيات

  

### **Middleware:**

  

#### **1. protect:**

  

```javascript

// يتحقق من وجود JWT صالح

// يضيف بيانات المستخدم إلى req.user

```

  

#### **2. restrictTo(...roles):**

  

```javascript

// يتحقق من أن المستخدم له أحد الأدوار المسموحة

// مثال: restrictTo('admin', 'employee')

```

  

### **مثال:**

  

```javascript

router.get(

  "/api/orders",

  protect, // يجب تسجيل الدخول

  restrictTo("admin", "employee"), // فقط admin أو employee

  getAllOrders

);

```

  

### **تشفير كلمات المرور:**

  

```javascript

// Pre-save hook في User model

userSchema.pre("save", async function (next) {

  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);

});

```

  

---

  

## 📊 الميزات الرئيسية

  

### **1. لوحات التحكم المتعددة:**

  

- **AdminDashboard**: إحصائيات شاملة، رسوم بيانية، نسب نمو

- **MerchantDashboard**: طلبات التاجر، الإحصائيات الشخصية

- **EmployeeDashboard**: الطلبات المعلقة، طلبات اليوم

- **DriverDashboard**: التوصيلات المعينة، إحصائيات الأداء

  

### **2. إدارة الطلبات:**

  

- ✅ إنشاء طلبات مع حساب تلقائي للتكلفة

- ✅ دعم طلبات متعددة المنتجات

- ✅ حساب الوزن الإجمالي تلقائياً

- ✅ تتبع حالة الطلب في الوقت الفعلي

- ✅ سجل كامل لتغيرات الحالة

- ✅ تعيين سائقين على الطلبات

- ✅ فلترة وبحث متقدم

- ✅ تصدير إلى Excel و PDF

  

### **3. إدارة المستخدمين:**

  

- ✅ إضافة/تعديل/حذف مستخدمين (admin فقط)

- ✅ صلاحيات محددة لكل نوع

- ✅ بحث وفلترة متقدمة

- ✅ تتبع نشاط المستخدمين

  

### **4. إدارة السائقين:**

  

- ✅ تعيين مدن محددة لكل سائق

- ✅ تتبع حالة التوفر

- ✅ عرض السائقين المتاحين حسب المدينة

- ✅ إحصائيات الأداء (توصيلات اليوم/الأسبوع/الإجمالي)

- ✅ معدل نجاح التسليم

  

### **5. إدارة المناطق:**

  

- ✅ إضافة/تعديل محافظات ومدن

- ✅ ضبط تكلفة الشحن لكل مدينة

- ✅ تفعيل/إلغاء تفعيل المناطق

- ✅ حماية من حذف محافظات تحتوي على مدن

  

### **6. إعدادات الشحن:**

  

- ✅ إدارة أنواع الشحن (عادي، سريع، إلخ)

- ✅ ضبط قيم التعديل (+/-) لكل نوع

- ✅ ضبط حد الوزن الأساسي

- ✅ ضبط تكلفة الوزن الإضافي

- ✅ ضبط تكلفة توصيل القرى

  

### **7. التقارير والتصدير:**

  

- ✅ تصدير الطلبات إلى Excel

- ✅ تصدير تقارير PDF شاملة

- ✅ إحصائيات يومية وأسبوعية

- ✅ رسوم بيانية تفاعلية

  

---

## 🚀 سير عمل الطلبات (Order Flow)

### **1. إنشاء الطلب:**

  

```

التاجر/الموظف → يملأ النموذج

    ↓

يختار: المحافظة → المدينة → نوع الشحن

    ↓

يضيف منتجات (اسم، كمية، وزن)

    ↓

يحسب النظام: الوزن الإجمالي + التكلفة تلقائياً

    ↓

يراجع التفاصيل → يؤكد الطلب

    ↓

يُحفظ الطلب بحالة "Pending"

```

  

### **2. معالجة الطلب:**

  

```

Admin/Employee → يفتح "إدارة الطلبات"

    ↓

يجد الطلب الجديد (Pending)

    ↓

يغير الحالة إلى "Processing"

    ↓

يعيّن سائقاً مناسباً (حسب المدينة)

    ↓

يُرسل إشعار للسائق

```

  

### **3. التوصيل:**

  

```

السائق → يفتح "توصيلاتي"

    ↓

يرى الطلبات المعينة له

    ↓

يستلم الطرد → يغير الحالة إلى "On the Way"

    ↓

يصل إلى العميل → يغير الحالة إلى "Delivered"

    ↓

يتم تحديث الإحصائيات تلقائياً

```

  

### **4. حالات خاصة:**

  

#### **إلغاء الطلب:**

  

- **التاجر**: يمكنه الإلغاء إذا كانت الحالة `Pending` أو `Processing`

- **Admin**: يمكنه الإلغاء في أي وقت

- يتم تسجيل سبب الإلغاء في `stateHistory`

  

#### **إرجاع الطرد:**

- السائق يمكنه تغيير `On the Way` إلى `Processing` (فشل التسليم)

- Admin يمكنه إعادة أي طلب لأي حالة

  

---

  

## 📈 الإحصائيات والتحليلات

  

### **Admin Dashboard Stats:**

  

- **اليوم:**

  - عدد الطلبات الجديدة
  - الإيرادات من الطلبات المكتملة
  - عدد الطلبات المعلقة
  - نسبة التغيير عن الأسبوع الماضي

  

- **الأسبوع:**

  - رسم بياني للطلبات (7 أيام)
  - إجمالي عدد المستخدمين
  - إجمالي الإيرادات

  

### **Merchant Dashboard Stats:**


- إجمالي الطلبات
- الطلبات النشطة (Pending + Processing + On the Way)
- الطلبات المكتملة (Delivered)
- رسم بياني للطلبات الأسبوعية

  

### **Driver Dashboard Stats:**


- التوصيلات اليوم
- التوصيلات هذا الأسبوع
- إجمالي التوصيلات
- الطلبات المعلقة
- معدل نجاح التسليم

  
---

  

## 🧪 أمثلة عملية (Use Cases)

### **Use Case 1: تاجر يُنشئ طلباً**

**الخطوات:**

  

1. يسجل دخوله كـ Merchant

2. ينتقل إلى "إنشاء طلب جديد"

3. يملأ:

   - نوع الطلب: "من الباب للباب"
   - بيانات العميل: (اسم، هاتف، بريد)
   - العنوان: القاهرة → مدينة نصر → شارع...
   - نوع الشحن: "عادي"
   - نوع الدفع: "واجبة التحصيل"

4. يضيف منتجات:

   - منتج 1: قميص (كمية: 2، وزن: 0.5 كجم)
   - منتج 2: حذاء (كمية: 1، وزن: 1.5 كجم)

5. النظام يحسب:

   - إجمالي الوزن: 2.5 كجم
   - التكلفة: 50 جنيه (حسب مدينة نصر + وزن أساسي)

6. يؤكد الطلب

7. يُحفظ برقم `ORD-1234567890-0001` وحالة `Pending`

  

---

  

### **Use Case 2: موظف يُعيّن سائقاً**

**الخطوات:**

1. الموظف يفتح "إدارة الطلبات"
2. يرى طلب `ORD-1234567890-0001` بحالة `Pending`
3. يغير الحالة إلى `Processing`
4. يضغط على "تعيين سائق"
5. النظام يعرض السائقين المتاحين في "مدينة نصر"
6. يختار السائق "أحمد محمد"
7. يتم تحديث `assignedDriver` في Order
8. السائق يرى الطلب في "توصيلاتي"

  

---

  

### **Use Case 3: سائق يُسلّم طلباً**


**الخطوات:**

1. السائق يفتح "توصيلاتي"
2. يرى طلب `ORD-1234567890-0001` بحالة `Processing`
3. يستلم الطرد → يغير الحالة إلى `On the Way`
4. يصل إلى العميل
5. يُسلّم الطرد → يغير الحالة إلى `Delivered`
6. يُحدث النظام:
   - `status = "Delivered"`
   - يُضاف سجل في `stateHistory`
   - تُحدث إحصائيات السائق
   - تُحدث إحصائيات التاجر

---

### **Use Case 4: Admin يُضيف مدينة جديدة**

**الخطوات:**


1. الAdmin يفتح "إدارة المناطق"
2. يختار محافظة "القاهر"
3. يضط "إضافة مدينة"
4. يملأ
   - اسم المدينة: "مدينة اشروق"
   - تكلفة الشن: 60 جنيه
1. يؤكد الإضافة
2. تُصبح المدينة متاحة فوراً لجميع المستخدمين

  

---
## 🛡️ الأمان (Security)

### **تدابير الأمان المُطبقة:**

1. **تشفير كلمات المرور**: bcrypt مع salt rounds = 10

2. **JWT Authentication**: توكن صالح لمدة 7 أيام
3. **Role-Based Access Control (RBAC)**: صلاحيات محددة لكل دور
4. **Input Validation**: التحقق من جميع المدخلات
5. **XSS Protection**: تنظيف المدخلات
6. **SQL Injection Protection**: استخدام Mongoose (NoSQL)
7. **CORS**: مُفعّل فقط للنطاقات المُحددة
8. **Rate Limiting**: (يُنصح بإضافته في Production)
9. **Helmet.js**: (يُنصح بإضافته لحماية Headers)

---
## 📝 ملاحظات للتطوير المستقبلي

### **ميزات مقترحة:**

- ✨ نظام إشعارات فوري (WebSocket/Pusher)
- ✨ تطبيق موبايل للسائقين (React Native)
- ✨ تتبع موقع السائق في الوقت الفعلي (GPS)
- ✨ نظام تقييم السائقين
- ✨ تكامل مع بوابات دفع إلكتروني
- ✨ اAPI للتكامل مع منصات التجارة الإلكترونية
- ✨ نظام كوبونات وخصومات
- ✨ تقارير مالية متقدمة
- ✨ نظام شكاوى ودعم فني
- ✨ اMulti-tenancy (دعم عدة شركات)
### **تحسينات تقنية:**  

- 🔧 Unit Tests + Integration Tests
- 🔧 CI/CD Pipeline
- 🔧 Docker + Docker Compose
- 🔧 Redis للـ Caching
- 🔧 Bull Queue لمعالجة المهام الثقيلة
- 🔧 Winston Logger
- 🔧 Rate Limiting
- 🔧 API Documentation (Swagger)
- 🔧 GraphQL API (اختياري)

  