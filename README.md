# 🔐 Golden Auth Endpoint v2.0

## الوصف
Endpoint للمصادقة والتحقق من المنتج بنظام مفاتيح محمي.

## الميزات
✅ **تخزين JSON**: جميع المفاتيح في `keys.json`  
✅ **ربط HWID**: كل مفتاح مربوط بجهاز واحد  
✅ **تواريخ انتهاء**: لكل مفتاح تاريخ انتهاء خاص  
✅ **تتبع الاستخدام**: يسجل عدد الاستخدامات  
✅ **HMAC-SHA256**: توقيع آمن  

---

## التثبيت

### 1. تثبيت المكتبات
```bash
npm install
# أو
yarn install
```

### 2. إعداد متغيرات البيئة (اختياري)
أنشئ ملف `.env`:
```env
PORT=3000
HMAC_SECRET=b309258d2e096b3bdfece839d7b38c936ae7b9af25ab775a70a358d9d921c05e
ADMIN_PASSWORD=your-secret-admin-password
```

### 3. تشغيل السيرفر
```bash
npm start
# أو
node server.js
```

---

## الاستخدام

### 🔑 توليد مفاتيح جديدة

#### طريقة 1: استخدام keygen.js (تفاعلي)
```bash
node keygen.js
```
سيظهر لك قائمة:
- **1**: توليد مفتاح تفاعلي (تدخل البيانات يدوياً)
- **2**: توليد أوتوماتيكي (عدد من المفاتيح)
- **3**: عرض كل المفاتيح
- **4**: اختبار التوقيع

#### طريقة 2: تعديل keys.json يدوياً
فقط أضف مدخل جديد في `keys.json`:
```json
{
  "keys": [
    {
      "key": "YOUR-CUSTOM-KEY-123",
      "hwid": "user-device-hwid-abc",
      "expires": "2026-12-31T23:59:59Z",
      "active": true,
      "created": "2025-01-15T10:00:00Z",
      "uses": 0,
      "note": "License for customer XYZ"
    }
  ]
}
```

---

### 📡 API Endpoints

#### 1. التحقق من المفتاح
```bash
POST /validate
Content-Type: application/json

{
  "key": "DEMO-2025-ABCD1234",
  "hwid": "demo-hardware-001"
}
```

**استجابة ناجحة:**
```json
{
  "valid": true,
  "reason": "ok",
  "expires": "2099-12-31T23:59:59Z",
  "sig": "a1b2c3d4..."
}
```

**استجابة فاشلة:**
```json
{
  "valid": false,
  "reason": "Invalid key",
  "expires": "2025-01-01T00:00:00Z",
  "sig": "..."
}
```

#### 2. عرض كل المفاتيح (محمي)
```bash
GET /admin/keys
X-Admin-Password: your-secret-admin-password
```

**استجابة:**
```json
{
  "total": 2,
  "keys": [
    {
      "key": "DEMO-2025-ABCD1234",
      "hwid": "demo-hardware-001",
      "expires": "2099-12-31T23:59:59Z",
      "active": true,
      "uses": 15,
      "lastUsed": "2025-01-20T14:30:00Z",
      "note": "Demo key"
    }
  ]
}
```

---

## أمثلة الاختبار

### باستخدام curl
```bash
# مفتاح صحيح
curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d '{"key":"DEMO-2025-ABCD1234","hwid":"demo-hardware-001"}'

# مفتاح خاطئ
curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d '{"key":"INVALID-KEY","hwid":"any-hwid"}'

# عرض كل المفاتيح
curl http://localhost:3000/admin/keys \
  -H "X-Admin-Password: your-secret-admin-password"
```

### باستخدام JavaScript
```javascript
const response = await fetch('http://localhost:3000/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: 'DEMO-2025-ABCD1234',
    hwid: 'demo-hardware-001'
  })
});

const data = await response.json();
console.log(data.valid ? '✅ Valid!' : '❌ Invalid!');
```

---

## النشر على Railway

### 1. رفع الملفات
رفّع كل الملفات إلى مستودع GitHub أو رفعها مباشرة إلى Railway.

### 2. إعداد Environment Variables في Railway
```
HMAC_SECRET=b309258d2e096b3bdfece839d7b38c936ae7b9af25ab775a70a358d9d921c05e
ADMIN_PASSWORD=your-admin-password-here
PORT=3000
```

### 3. Deploy
Railway سيكتشف `package.json` ويشغل `npm start` أوتوماتيكياً.

---

## الأمان

⚠️ **مهم:**
- لا تشارك `HMAC_SECRET` علناً
- لا ترفع `keys.json` للمستودع العام (add to `.gitignore`)
- احذف `/admin/keys` endpoint أو احميه بكلمة سر قوية في الإنتاج
- استخدم HTTPS في الإنتاج

---

## هيكل الملفات
```
.
├── server.js          # السيرفر الرئيسي
├── keygen.js          # مولد المفاتيح (Node.js)
├── keygen.py          # مولد التوقيعات (Python)
├── keys.json          # قاعدة المفاتيح
├── package.json       # معلومات المشروع
└── README.md          # هذا الملف
```

---

## الدعم
للمساعدة أو المشاكل، راجع الكود أو اتصل بالدعم الفني.

---

✅ **جاهز للاستخدام!**
