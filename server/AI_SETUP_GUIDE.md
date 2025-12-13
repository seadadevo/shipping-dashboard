# 🤖 تعليمات تشغيل الـ AI Assistant

## المشكلة الحالية

الـ AI مش شغال لأن **API Keys** مش موجودة في ملف `.env`

## الحل: إضافة API Keys

### 1. احصل على API Keys

#### OpenRouter API Key (مطلوب)

1. اذهب إلى: https://openrouter.ai/
2. سجل دخول أو أنشئ حساب
3. اذهب إلى Settings → API Keys
4. انسخ الـ API Key

#### Google Gemini API Key (اختياري)

1. اذهب إلى: https://makersuite.google.com/app/apikey
2. سجل دخول بحساب Google
3. انقر Create API Key
4. انسخ المفتاح

### 2. أضف الـ Keys في ملف `.env`

افتح ملف `.env` في مجلد `server` وأضف:

```env
# الـ Keys الموجودة (لا تغيرها)
MONGO_URI=mongodb+srv://...
PORT=5000
JWT_SECRET=...
JWT_EXPIRES_IN=90d

# أضف هذه السطور الجديدة
API_KEY=sk-or-v1-your-openrouter-key-here
GEMINI_API_KEY=your-gemini-key-here
```

### 3. أعد تشغيل السيرفر

```bash
cd server
npm start
```

## كيف تستخدم الـ AI

### 1. رفع ملف (Upload)

- اذهب إلى صفحة الـ AI في Dashboard
- ارفع ملف (PDF, CSV, Image, Text)
- الـ AI هيقرأ ويحفظ المحتوى

### 2. اسأل أسئلة (Chat)

- اكتب سؤالك بالعربي أو الإنجليزي
- الـ AI هيجاوب بالعربي دايماً
- يقدر يحلل بيانات ويعمل charts

## أنواع الملفات المدعومة

- **PDF** - لقراءة المستندات
- **CSV** - لتحليل البيانات
- **Images (JPG, PNG)** - OCR لقراءة النصوص
- **Text Files** - ملفات نصية عادية

## مميزات الـ AI

✅ يجاوب بالعربي دائماً
✅ يحلل البيانات (Data Analysis)
✅ يعمل توقعات (Predictions)
✅ يولد Charts تلقائياً
✅ يدعم OCR للصور

## إذا واجهت مشاكل

### خطأ: "API_KEY not configured"

- تأكد إنك ضفت `API_KEY` في `.env`
- تأكد إنك أعدت تشغيل السيرفر

### خطأ: "Failed to generate embeddings"

- تأكد من صحة الـ API Key
- تأكد إن عندك رصيد في حساب OpenRouter

### الـ AI بيرد بالإنجليزي

- ده عادي لو الـ model مش ملتزم
- جرب تسأل مرة تانية

## التكلفة

- **OpenRouter**: يختلف حسب الـ model المستخدم
- **Gemini**: مجاني لحد معين من الطلبات

## ملاحظات مهمة

⚠️ **لا تشارك API Keys مع أحد**
⚠️ **لا ترفع ملف `.env` على GitHub**
⚠️ **استخدم `.gitignore` لحماية الـ Keys**

---

تم التحديث: 12 ديسمبر 2025
