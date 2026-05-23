# 🚀 تثبيت Golden Auth Endpoint v2.0

## خطوات التثبيت السريع

### 1️⃣ فك الضغط
```bash
unzip golden-auth-endpoint-v2.zip
cd golden-auth-endpoint-v2
```

### 2️⃣ تثبيت المكتبات
```bash
npm install
# أو
yarn install
```

### 3️⃣ تشغيل السيرفر
```bash
npm start
```

السيرفر سيعمل على: **http://localhost:3000**

---

## 🔧 إعداد Railway

### الطريقة 1: من GitHub
1. ارفع المشروع على GitHub
2. افتح [Railway.app](https://railway.app)
3. اضغط **New Project** → **Deploy from GitHub**
4. اختر المستودع
5. أضف Environment Variables:
   ```
   HMAC_SECRET=b309258d2e096b3bdfece839d7b38c936ae7b9af25ab775a70a358d9d921c05e
   ADMIN_PASSWORD=كلمة_سر_قوية_هنا
   PORT=3000
   ```
6. اضغط **Deploy**

### الطريقة 2: Railway CLI
```bash
# تثبيت Railway CLI
npm install -g @railway/cli

# تسجيل الدخول
railway login

# ربط المشروع
railway init

# إضافة متغيرات البيئة
railway variables set HMAC_SECRET=b309258d2e096b3bdfece839d7b38c936ae7b9af25ab775a70a358d9d921c05e
railway variables set ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD
railway variables set PORT=3000

# نشر
railway up
```

---

## 🔑 إدارة المفاتيح

### إضافة مفتاح جديد (تفاعلي)
```bash
node keygen.js
# اختر: 1
```

### إضافة مفاتيح بالجملة
```bash
node keygen.js
# اختر: 2
# أدخل العدد (مثلاً: 10)
```

### عرض كل المفاتيح
```bash
node keygen.js
# اختر: 3
```

### تعديل يدوي
عدّل ملف `keys.json` مباشرة:
```json
{
  "keys": [
    {
      "key": "YOUR-NEW-KEY-2025",
      "hwid": "client-device-id",
      "expires": "2026-12-31T23:59:59Z",
      "active": true,
      "created": "2025-01-15T10:00:00Z",
      "uses": 0,
      "note": "Customer ABC - Premium License"
    }
  ]
}
```

---

## 🧪 اختبار النظام

### اختبار مفتاح صحيح
```bash
curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d '{"key":"DEMO-2025-ABCD1234","hwid":"demo-hardware-001"}'
```

**النتيجة المتوقعة:**
```json
{
  "valid": true,
  "reason": "ok",
  "expires": "2099-12-31T23:59:59Z",
  "sig": "a7373f7daf511fcbf7a02b64599b6d3eca7a0863c26d07506c8c2db6b3f1417c"
}
```

### اختبار مفتاح خاطئ
```bash
curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d '{"key":"WRONG-KEY","hwid":"any-device"}'
```

**النتيجة المتوقعة:**
```json
{
  "valid": false,
  "reason": "Invalid key",
  "expires": "2025-01-01T00:00:00Z",
  "sig": "..."
}
```

### عرض المفاتيح (Admin)
```bash
curl http://localhost:3000/admin/keys \
  -H "X-Admin-Password: YOUR_ADMIN_PASSWORD"
```

---

## 📋 حالات الخطأ

| الحالة | الرسالة | السبب |
|--------|---------|-------|
| `Invalid key` | المفتاح غير موجود | المفتاح غير مسجل في keys.json |
| `Key disabled` | المفتاح معطل | `active: false` في keys.json |
| `Key expired` | المفتاح منتهي | تاريخ انتهاء الصلاحية مر |
| `HWID mismatch` | HWID لا يطابق | الجهاز مختلف عن المسجل |
| `Missing key` | مفتاح مفقود | لم يتم إرسال key في الطلب |

---

## 🔒 نصائح الأمان

1. **لا تشارك HMAC_SECRET علناً** - احفظه في متغيرات البيئة
2. **أضف keys.json إلى .gitignore** - لا ترفعه على GitHub العام
3. **استخدم HTTPS في الإنتاج** - لا تستخدم HTTP
4. **احذف /admin/keys في الإنتاج** - أو احميه بـ IP whitelist
5. **استخدم كلمة سر قوية للـ ADMIN_PASSWORD**
6. **راقب ملف keys.json** - تأكد من عدم تعرضه للاختراق

---

## 📞 الدعم

للمشاكل أو الأسئلة، راجع:
- **README.md** - الشرح الكامل
- **keygen.py** - للتوقيعات Python
- **keygen.js** - لإدارة المفاتيح

---

✅ **جاهز للاستخدام!**

تم البناء بواسطة **Emergent AI** 🤖
