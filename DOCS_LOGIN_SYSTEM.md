# 🔐 شرح نظام تسجيل الدخول (Login System)

## 📋 نظرة عامة

نظام تسجيل الدخول في المشروع بيستخدم **JWT (JSON Web Tokens)** للـ authentication، وبيدعم 4 أنواع مستخدمين:

- **Admin** (مدير النظام)
- **Employee** (موظف)
- **Merchant** (تاجر)
- **Driver** (سائق)

---

## 📁 الملفات الأساسية للمذاكرة

### 🎨 Frontend (Client Side)

#### 1️⃣ `client/src/components/Auth/Login.tsx`

**الوظيفة:** صفحة تسجيل الدخول (واجهة المستخدم)

**المكونات الرئيسية:**

```typescript
- Form fields: email, password
- Validation: باستخدام regex patterns
- Error handling: عرض رسائل الخطأ
- Submit handler: إرسال البيانات للـ API
```

**Flow:**

1. المستخدم يدخل الإيميل والباسورد
2. التحقق من صحة البيانات (validation)
3. إرسال POST request إلى `/api/auth/login`
4. حفظ الـ token في localStorage
5. حفظ بيانات المستخدم في Context
6. التحويل للصفحة المناسبة حسب نوع المستخدم

**أهم الـ States:**

```typescript
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
```

**التوجيه حسب نوع المستخدم:**

```typescript
if (userType === "admin") navigate("/admin");
if (userType === "employee") navigate("/employee");
if (userType === "merchant") navigate("/merchant");
if (userType === "driver") navigate("/driver");
```

---

#### 2️⃣ `client/src/contexts/AuthContext.tsx`

**الوظيفة:** إدارة حالة المصادقة في التطبيق (Global State)

**المسؤوليات:**

- حفظ بيانات المستخدم الحالي
- حفظ الـ token
- توفير دوال login/logout
- استرجاع البيانات من localStorage عند تحميل التطبيق

**الـ Context Structure:**

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  loading: boolean;
}
```

**كيف يشتغل:**

1. عند تحميل التطبيق: يقرأ token و user من localStorage
2. عند الـ login: يحفظ البيانات في state و localStorage
3. عند الـ logout: يمسح كل حاجة

---

#### 3️⃣ `client/src/hooks/useAuth.ts`

**الوظيفة:** Custom Hook لاستخدام AuthContext بسهولة

**الاستخدام:**

```typescript
const { user, token, login, logout } = useAuth();
```

**الفائدة:**

- تبسيط الوصول للـ AuthContext
- التحقق من وجود Context
- إعادة استخدام الكود

---

#### 4️⃣ `client/src/lib/api.ts`

**الوظيفة:** Axios instance مع interceptors

**المميزات:**

1. **Request Interceptor:**

   - يضيف الـ token تلقائياً لكل request

   ```typescript
   config.headers["Authorization"] = `Bearer ${token}`;
   ```

2. **Response Interceptor:**
   - يتعامل مع 401 errors (unauthorized)
   - يمسح الـ token ويعمل logout تلقائي

**الكود الأساسي:**

```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);
```

---

### 🔧 Backend (Server Side)

#### 5️⃣ `server/routes/authRoutes.js`

**الوظيفة:** تعريف endpoints الخاصة بالمصادقة

**الـ Routes:**

```javascript
POST /api/auth/register  → تسجيل مستخدم جديد
POST /api/auth/login     → تسجيل الدخول
GET  /api/auth/me        → الحصول على بيانات المستخدم الحالي
```

**الكود:**

```javascript
const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
```

---

#### 6️⃣ `server/controllers/authController.js`

**الوظيفة:** معالجة منطق تسجيل الدخول والتسجيل

**الدوال الرئيسية:**

##### 1. `register` (تسجيل مستخدم جديد)

```javascript
exports.register = async (req, res) => {
  const { name, email, password, userType } = req.body;

  // 1. التحقق من وجود المستخدم
  const existingUser = await User.findOne({ email });

  // 2. تشفير الباسورد
  const hashedPassword = await bcrypt.hash(password, 12);

  // 3. إنشاء المستخدم
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    userType,
  });

  // 4. إنشاء JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.status(201).json({ user, token });
};
```

##### 2. `login` (تسجيل الدخول)

```javascript
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // 1. التحقق من وجود البيانات
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  // 2. البحث عن المستخدم
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // 3. التحقق من الباسورد
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // 4. إنشاء token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  // 5. إرجاع البيانات
  res.status(200).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
    },
    token,
  });
};
```

##### 3. `getMe` (الحصول على بيانات المستخدم)

```javascript
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ user });
};
```

---

#### 7️⃣ `server/middleware/authMiddleware.js`

**الوظيفة:** التحقق من صحة الـ token وحماية الـ routes

**الدوال:**

##### 1. `protect` (حماية الـ routes)

```javascript
exports.protect = async (req, res, next) => {
  let token;

  // 1. استخراج الـ token من Header أو Cookie
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. التحقق من وجود token
  if (!token) {
    return res.status(401).json({
      message: "You are not logged in",
    });
  }

  // 3. التحقق من صحة الـ token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 4. التحقق من وجود المستخدم
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return res.status(401).json({
      message: "User no longer exists",
    });
  }

  // 5. إضافة المستخدم للـ request
  req.user = currentUser;
  next();
};
```

##### 2. `restrictTo` (تقييد الوصول حسب نوع المستخدم)

```javascript
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        message: "You do not have permission",
      });
    }
    next();
  };
};
```

**الاستخدام:**

```javascript
router.get("/orders", protect, restrictTo("admin", "employee"), getAllOrders);
```

---

#### 8️⃣ `server/models/User.js`

**الوظيفة:** Schema الخاص بالمستخدمين في MongoDB

**الحقول:**

```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  userType: {
    type: String,
    enum: ["admin", "employee", "merchant", "driver"],
    required: true
  },
  phone: String,
  address: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}
```

**ملاحظات:**

- `select: false` على password: الباسورد مش بيتجاب تلقائياً في الـ queries
- `unique: true` على email: الإيميل لازم يكون فريد

---

## 🔄 Flow الكامل لعملية تسجيل الدخول

### Frontend → Backend → Frontend

```
1. المستخدم يدخل email و password في Login.tsx
   ↓
2. Form validation (تحقق من صحة البيانات)
   ↓
3. POST request إلى /api/auth/login
   ↓
4. authController.login يستقبل الطلب
   ↓
5. البحث عن المستخدم في قاعدة البيانات
   ↓
6. التحقق من الباسورد (bcrypt.compare)
   ↓
7. إنشاء JWT token
   ↓
8. إرجاع user + token
   ↓
9. Frontend يحفظ token في localStorage
   ↓
10. حفظ user في AuthContext
   ↓
11. التحويل للصفحة المناسبة حسب userType
```

---

## 🔒 أمان النظام (Security)

### 1. Password Hashing

```javascript
// تشفير الباسورد قبل حفظه
const hashedPassword = await bcrypt.hash(password, 12);

// التحقق من الباسورد
const isCorrect = await bcrypt.compare(plainPassword, hashedPassword);
```

### 2. JWT Token

```javascript
// إنشاء token
const token = jwt.sign(
  { id: user._id }, // Payload
  process.env.JWT_SECRET, // Secret key
  { expiresIn: "90d" } // Token expiry
);

// التحقق من token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### 3. Protected Routes

- كل route محمي بـ `protect` middleware
- بعض الـ routes محمية بـ `restrictTo` لتحديد الصلاحيات

### 4. HTTPS Headers

```javascript
Authorization: Bearer <token>
```

---

## 🎯 أنواع المستخدمين والصلاحيات

| User Type    | الصلاحيات                                   |
| ------------ | ------------------------------------------- |
| **Admin**    | كل الصلاحيات - إدارة كاملة للنظام           |
| **Employee** | إدارة الطلبات والمستخدمين                   |
| **Merchant** | إنشاء طلبات جديدة - متابعة طلباته فقط       |
| **Driver**   | عرض الشحنات المخصصة له - تحديث حالة التوصيل |

---

## 📝 Environment Variables المطلوبة

```env
JWT_SECRET=MyJWTSecretKey_GraduationProject_2025!
JWT_EXPIRES_IN=90d
MONGO_URI=mongodb+srv://...
PORT=5000
```

---

## 🧪 كيفية اختبار النظام

### 1. تسجيل الدخول

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "123456"
}
```

**الاستجابة:**

```json
{
  "user": {
    "_id": "...",
    "name": "Admin",
    "email": "admin@example.com",
    "userType": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. طلب محمي

```bash
GET http://localhost:5000/api/auth/me
Authorization: Bearer <token>
```

---

## ⚠️ الأخطاء الشائعة

| Error Code | المعنى                      | الحل                           |
| ---------- | --------------------------- | ------------------------------ |
| 400        | بيانات ناقصة                | تأكد من إرسال email و password |
| 401        | بيانات خاطئة أو token منتهي | راجع الإيميل والباسورد         |
| 403        | لا توجد صلاحية              | المستخدم ليس له حق الوصول      |

---

## 📚 ملخص للمذاكرة

### الملفات الأساسية:

1. ✅ `Login.tsx` - واجهة تسجيل الدخول
2. ✅ `AuthContext.tsx` - إدارة حالة المصادقة
3. ✅ `useAuth.ts` - Hook للوصول للـ Context
4. ✅ `api.ts` - Axios interceptors
5. ✅ `authRoutes.js` - تعريف الـ routes
6. ✅ `authController.js` - منطق المصادقة
7. ✅ `authMiddleware.js` - حماية الـ routes
8. ✅ `User.js` - Schema المستخدمين

### النقاط المهمة للمناقشة:

- 🔐 JWT authentication
- 🔒 Password hashing with bcrypt
- 👥 Multiple user types (4 roles)
- 🛡️ Protected routes & authorization
- 📱 Frontend/Backend separation
- 💾 LocalStorage for persistence
- 🔄 Axios interceptors for token handling

---

## 🎓 أسئلة متوقعة في المناقشة

### Q1: ليه استخدمت JWT بدل Session؟

**الإجابة:**

- JWT stateless (مش محتاج حفظ sessions في السيرفر)
- Scalable (ممكن تشغل أكتر من سيرفر)
- Mobile-friendly (سهل التعامل معاه في الموبايل)

### Q2: إزاي بتحمي الباسوردات؟

**الإجابة:**

- باستخدام bcrypt لعمل hash للباسورد
- Salt rounds = 12 (قوة التشفير)
- الباسورد المشفر بيتحفظ في DB
- مستحيل استرجاع الباسورد الأصلي

### Q3: إزاي بتتأكد إن المستخدم عنده صلاحية؟

**الإجابة:**

- `protect` middleware: بيتأكد من الـ token
- `restrictTo` middleware: بيتأكد من نوع المستخدم
- كل route محمي حسب الصلاحيات المطلوبة

### Q4: لو الـ token انتهى؟

**الإجابة:**

- Response interceptor بيمسك 401 error
- بيعمل logout تلقائي
- بيحول المستخدم لصفحة Login

---

## 🚀 الخطوة التالية

بعد ما تخلص مذاكرة Login System، هنكمل:

1. ✅ **Login System** (انت هنا)
2. ⏭️ **Dashboard System** (الصفحات الرئيسية لكل user type)
3. ⏭️ **Order Management** (إدارة الطلبات)
4. ⏭️ **AI Assistant** (المساعد الذكي)

---

**جاهز للمناقشة! بالتوفيق 🎉**
