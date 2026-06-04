# Zouma Gift Shop Management System Backend & Dashboard

نظام الإدارة المالي المتكامل لـ محل هدايا زوما. يجمع هذا التطبيق بين واجهة كاملة بلغة React (Vite) وخلفية متكاملة بـ Node.js + Express وقاعدة بيانات متصلة بـ Supabase (PostgreSQL) مأمّنة بالكامل برموز التواقيع الرقمية JWT وتطبيق معايير الصلاحيات الموظفين والمدراء.

---

## 🚀 التقنيات المستخدمة

- **الواجهة الأمامية**: React 19 + Tailwind CSS v4 + Lucide React Icons
- **الخلفية والـ API**: Node.js + Express + JS JWT
- **الحماية والتشفير**: تشفير كلمات المرور باستخدام مكتبة `bcryptjs`
- **قاعدة البيانات**: Supabase (PostgreSQL)

---

## 🗄️ هيكل البيانات (Database Schema)

كل الهياكل الخاصة بالجداول تجدها مكتوبة بصيغة SQL بيور داخل الملف المرفق:  
`/db/schema.sql`

تشمل الجداول التالية:
1. `clients` (العملاء والزبائن والتسجيل الرقمي المتفرد)
2. `products` (كتالوج المنتجات والأسعار والمخزون)
3. `orders` (رأس الفواتير والحسابات والتأكيدات)
4. `order_items` (تفاصيل سلة الأوردرات)
5. `users` (الموظفون والمدراء وكلمات المرور المشفرة والصلاحيات الفردية)

---

## 🛠️ كيفية الإعداد والتثبيت المحلي (Setup Guide)

### 1. المتغيرات البيئية
قم بإنشاء ملف `.env` في المجلد الرئيسي وقم بتعبئة المدخلات كالآتي:

```env
PORT=3000
JWT_SECRET=ZoumaGiftShopSecretKey_2026

# رابط الاتصال المباشر بقاعدة بيانات Supabase (PostgreSQL)
# مثال: postgres://postgres.yourproject:password@aws-0-eu-west-2.pooler.supabase.com:5432/postgres
DATABASE_URL=
```

*ملاحظة للمعاينة*: إذا تركت `DATABASE_URL` فارغاً، سيقوم النظام تلقائياً بالتمهيد نحو قاعدة بيانات JSON محلية `/db/zouma_db.json` لتتمكن من تصفح خصائص النظام فورياً بالمتصفح دون حدوث كراش!

### 2. تثبيت الحزم والمكتبات
```bash
npm install
```

### 3. التمهيد والتطوير المحلي
```bash
npm run dev
```

---

## ☁️ خطوات النشر والاستضافة (Deployment on Render / Railway)

### الخيار 1: النشر على Render.com

1. قم بإنشاء حساب على [Render](https://render.com) وقم بربط مستودع الـ GitHub الخاص بك.
2. انقر على **New +** ثم اختر **Web Service**.
3. قم بتحديد المستودع الخاص بك.
4. اضبط الإعدادات التالية في نموذج الإنشاء:
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. انقر على قسم **Advanced** لإضافة المتغيرات البيئية التالية (Environment Variables):
   - `DATABASE_URL` : رابط الـ Connection String لـ Supabase.
   - `JWT_SECRET` : مفتاح تشفير عشوائي خاص بـ JWT.
   - `NODE_ENV` : `production`
6. انقر على **Create Web Service** للتمهيد والبدء الفوري بالتثبيت والنشر!

### الخيار 2: النشر على Railway.app

1. قم بإنشاء مشروع جديد في [Railway](https://railway.app).
2. اختر **Deploy from GitHub repository** وحدد الكود الخاص بك.
3. توجه لإعدادات الخدمة (Variables) وقم بإضافة المتغيرات البيئية:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `PORT` : `3000`
4. سيتعرف Railway تلقائياً على أمر التشغيل `npm start` ويبدأ بالبناء والانطلاق!

---

## 🔑 الحسابات القياسية للولوج المعاين السريع للتجربة

لتسهيل المعاينة قمنا بمصادقة حسابين قياسيين مسبقاً في النظام:

1. **المدير المسؤول (Super Admin)**:
   - البريد الإلكتروني: `admin@zouma.com`
   - كلمة المرور: `admin123`
2. **الموظف (أحمد)**:
   - البريد الإلكتروني: `employee@zouma.com`
   - كلمة المرور: `admin123`
