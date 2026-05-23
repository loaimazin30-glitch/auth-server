#!/usr/bin/env node
import crypto from "node:crypto";
import readline from "node:readline";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";

const KEYS_FILE = "./keys.json";
const SECRET_HEX = "b309258d2e096b3bdfece839d7b38c936ae7b9af25ab775a70a358d9d921c05e";

// ═══════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════

function generateRandomKey() {
  const prefix = ["GOLD", "PREMIUM", "PRO", "ELITE"][Math.floor(Math.random() * 4)];
  const year = new Date().getFullYear();
  const random1 = crypto.randomBytes(4).toString("hex").toUpperCase();
  const random2 = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${year}-${random1}-${random2}`;
}

function generateRandomHWID() {
  return `HWID-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
}

async function loadKeys() {
  try {
    if (!existsSync(KEYS_FILE)) {
      return { keys: [] };
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

function createSignature(message) {
  const keyBuffer = Buffer.from(SECRET_HEX, "hex");
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

// ═══════════════════════════════════════════════════════════
// Input Helper
// ═══════════════════════════════════════════════════════════

function question(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ═══════════════════════════════════════════════════════════
// Main Program
// ═══════════════════════════════════════════════════════════

async function main() {
  console.log("\n" + "═".repeat(70));
  console.log("  🔑 Golden Auth - Key Generator v2.0");
  console.log("═".repeat(70) + "\n");

  console.log("📝 Choose an option:");
  console.log("  1. Generate new key (interactive)");
  console.log("  2. Generate new key (automatic)");
  console.log("  3. List all keys");
  console.log("  4. Test signature generation");
  console.log("  5. Exit\n");

  const choice = await question("➡️  Enter choice (1-5): ");

  switch (choice) {
    case "1":
      await generateInteractive();
      break;
    case "2":
      await generateAutomatic();
      break;
    case "3":
      await listKeys();
      break;
    case "4":
      await testSignature();
      break;
    case "5":
      console.log("\n👋 Goodbye!\n");
      process.exit(0);
    default:
      console.log("❌ Invalid choice");
      process.exit(1);
  }
}

async function generateInteractive() {
  console.log("\n🎯 Interactive Key Generation\n");

  const key = await question(`Key (Enter for random): `);
  const hwid = await question(`HWID (Enter for random): `);
  const expiresInput = await question(`Expires (YYYY-MM-DD or 'never'): `);
  const note = await question(`Note (optional): `);

  const finalKey = key || generateRandomKey();
  const finalHWID = hwid || generateRandomHWID();
  
  let finalExpires;
  if (expiresInput.toLowerCase() === "never" || !expiresInput) {
    finalExpires = "2099-12-31T23:59:59Z";
  } else {
    finalExpires = `${expiresInput}T23:59:59Z`;
  }

  const newKeyEntry = {
    key: finalKey,
    hwid: finalHWID,
    expires: finalExpires,
    active: true,
    created: new Date().toISOString(),
    uses: 0,
    note: note || "Generated via keygen"
  };

  const keysData = await loadKeys();
  keysData.keys.push(newKeyEntry);
  
  if (await saveKeys(keysData)) {
    console.log("\n" + "═".repeat(70));
    console.log("✅ Key Generated Successfully!");
    console.log("═".repeat(70));
    console.log(`Key:     ${newKeyEntry.key}`);
    console.log(`HWID:    ${newKeyEntry.hwid}`);
    console.log(`Expires: ${newKeyEntry.expires}`);
    console.log(`Note:    ${newKeyEntry.note}`);
    console.log("═".repeat(70) + "\n");
  }
}

async function generateAutomatic() {
  console.log("\n⚡ Automatic Key Generation\n");

  const count = await question(`How many keys to generate? (1-100): `);
  const numKeys = Math.min(100, Math.max(1, parseInt(count) || 1));

  const keysData = await loadKeys();
  const newKeys = [];

  for (let i = 0; i < numKeys; i++) {
    const newKeyEntry = {
      key: generateRandomKey(),
      hwid: generateRandomHWID(),
      expires: "2099-12-31T23:59:59Z",
      active: true,
      created: new Date().toISOString(),
      uses: 0,
      note: `Auto-generated ${i + 1}/${numKeys}`
    };
    keysData.keys.push(newKeyEntry);
    newKeys.push(newKeyEntry);
  }

  if (await saveKeys(keysData)) {
    console.log(`\n✅ Generated ${numKeys} keys successfully!\n`);
    newKeys.forEach((k, i) => {
      console.log(`${i + 1}. ${k.key} | ${k.hwid}`);
    });
    console.log("");
  }
}

async function listKeys() {
  console.log("\n📊 All Keys\n");

  const keysData = await loadKeys();
  
  if (keysData.keys.length === 0) {
    console.log("❌ No keys found\n");
    return;
  }

  console.log("═".repeat(100));
  console.log(`Total: ${keysData.keys.length} keys\n`);
  
  keysData.keys.forEach((k, i) => {
    console.log(`[${i + 1}] ${k.active ? '✅' : '❌'} ${k.key}`);
    console.log(`    HWID:    ${k.hwid}`);
    console.log(`    Expires: ${k.expires}`);
    console.log(`    Uses:    ${k.uses || 0}`);
    console.log(`    Note:    ${k.note || 'N/A'}`);
    console.log(``);
  });
  console.log("═".repeat(100) + "\n");
}

async function testSignature() {
  console.log("\n🔬 Test Signature Generation\n");

  const valid = true;
  const reason = "ok";
  const expires = "2099-12-31T23:59:59Z";

  const response = buildResponse(valid, reason, expires);

  console.log("═".repeat(70));
  console.log("Test License Response:");
  console.log("═".repeat(70));
  console.log(JSON.stringify(response, null, 2));
  console.log("═".repeat(70));
  console.log(`\nSignature length: ${response.sig.length} chars`);
  console.log(`Expected: 64 chars (HMAC-SHA256 hex)\n`);
}

// Run
main().catch(console.error);
