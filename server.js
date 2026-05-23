import crypto from "node:crypto";
import express from "express";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";

const app = express();
const port = process.env.PORT || 3000;
const hmacSecret = (process.env.HMAC_SECRET || "").trim();

// استخدام السر من keygen.py إذا لم يكن موجود
const defaultSecret = "b309258d2e096b3bdfece839d7b38c936ae7b9af25ab775a70a358d9d921c05e";
const actualSecret = hmacSecret || defaultSecret;

if (!actualSecret) {
  throw new Error("Missing HMAC_SECRET environment variable");
}

app.use(express.json({ limit: "16kb" }));

const KEYS_FILE = "./keys.json";

// ═══════════════════════════════════════════════════════════
// Functions
// ═══════════════════════════════════════════════════════════

function createSignature(message) {
  const keyBuffer = Buffer.from(actualSecret, "hex");
  return crypto.createHmac("sha256", keyBuffer).update(message).digest("hex");
}

function buildResponse(valid, reason, expires) {
  const validStr = valid ? "true" : "false";
  const signedMessage = `${validStr}|${reason}|${expires}`;
  const sig = createSignature(signedMessage);

  return {
    valid,
    reason,
    expires,
    sig
  };
}

async function loadKeys() {
  try {
    if (!existsSync(KEYS_FILE)) {
      console.warn("⚠️  keys.json not found, creating default file...");
      const defaultData = { keys: [] };
      await fs.writeFile(KEYS_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = await fs.readFile(KEYS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("❌ Error loading keys:", error.message);
    return { keys: [] };
  }
}

async function saveKeys(keysData) {
  try {
    await fs.writeFile(KEYS_FILE, JSON.stringify(keysData, null, 2));
    return true;
  } catch (error) {
    console.error("❌ Error saving keys:", error.message);
    return false;
  }
}

function isExpired(expiryDate) {
  return new Date() > new Date(expiryDate);
}

async function validateKey(key, hwid) {
  const keysData = await loadKeys();
  
  // البحث عن المفتاح
  const keyEntry = keysData.keys.find(k => k.key === key);
  
  if (!keyEntry) {
    return {
      valid: false,
      reason: "Invalid key",
      code: "INVALID_KEY"
    };
  }

  // التحقق من أن المفتاح نشط
  if (!keyEntry.active) {
    return {
      valid: false,
      reason: "Key disabled",
      code: "KEY_DISABLED"
    };
  }

  // التحقق من تاريخ الانتهاء
  if (isExpired(keyEntry.expires)) {
    return {
      valid: false,
      reason: "Key expired",
      code: "KEY_EXPIRED"
    };
  }

  // التحقق من HWID
  if (keyEntry.hwid && keyEntry.hwid !== hwid) {
    return {
      valid: false,
      reason: "HWID mismatch",
      code: "HWID_MISMATCH"
    };
  }

  // تحديث عدد الاستخدامات
  keyEntry.uses = (keyEntry.uses || 0) + 1;
  keyEntry.lastUsed = new Date().toISOString();
  await saveKeys(keysData);

  return {
    valid: true,
    reason: "ok",
    expires: keyEntry.expires,
    code: "SUCCESS"
  };
}

// ═══════════════════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════════════════

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "Golden Auth Endpoint",
    version: "2.0.0",
    endpoint: "/validate",
    features: [
      "✅ JSON-based key storage",
      "✅ HWID binding",
      "✅ Expiry dates",
      "✅ Usage tracking",
      "✅ HMAC-SHA256 signatures"
    ]
  });
});

app.post("/validate", async (req, res) => {
  const { key, hwid } = req.body;

  console.log("🔐 Validation request:", {
    key: key ? `${key.substring(0, 8)}...` : "missing",
    hwid: hwid ? `${hwid.substring(0, 8)}...` : "missing",
    timestamp: new Date().toISOString()
  });

  // التحقق من وجود المفتاح
  if (!key || typeof key !== "string") {
    const response = buildResponse(false, "Missing key", "2025-01-01T00:00:00Z");
    console.log("❌ Missing key");
    return res.status(200).json(response);
  }

  // التحقق من صحة المفتاح
  const validation = await validateKey(key, hwid);
  
  const expires = validation.expires || "2025-01-01T00:00:00Z";
  const response = buildResponse(validation.valid, validation.reason, expires);

  if (validation.valid) {
    console.log(`✅ Valid key: ${key.substring(0, 8)}... (${validation.code})`);
  } else {
    console.log(`❌ Invalid: ${validation.reason} (${validation.code})`);
  }

  res.status(200).json(response);
});

app.get("/validate", async (_req, res) => {
  const response = buildResponse(false, "Use POST method", "2025-01-01T00:00:00Z");
  res.status(200).json(response);
});

// Admin endpoint لعرض المفاتيح (احذفها في الإنتاج أو احميها بـ password)
app.get("/admin/keys", async (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = req.headers["x-admin-password"];

  if (adminPassword && providedPassword !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const keysData = await loadKeys();
  res.json({
    total: keysData.keys.length,
    keys: keysData.keys.map(k => ({
      key: k.key,
      hwid: k.hwid,
      expires: k.expires,
      active: k.active,
      uses: k.uses || 0,
      lastUsed: k.lastUsed || "never",
      note: k.note
    }))
  });
});

// ═══════════════════════════════════════════════════════════
// Server Start
// ═══════════════════════════════════════════════════════════

app.listen(port, async () => {
  console.log("\n" + "═".repeat(60));
  console.log("  🔐 Golden Auth Endpoint v2.0");
  console.log("═".repeat(60));
  console.log(`✅ Server running on port ${port}`);
  console.log(`✅ HMAC Secret: ${actualSecret.substring(0, 16)}...`);
  
  const keysData = await loadKeys();
  const activeKeys = keysData.keys.filter(k => k.active).length;
  console.log(`✅ Loaded ${keysData.keys.length} keys (${activeKeys} active)`);
  
  console.log("\n📍 Endpoints:");
  console.log(`   POST /validate      - Validate key + hwid`);
  console.log(`   GET  /admin/keys    - View all keys (protected)`);
  console.log("═".repeat(60) + "\n");
});
