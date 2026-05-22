import crypto from "node:crypto";
import express from "express";

const app = express();
const port = process.env.PORT || 3000;
const hmacSecret = process.env.HMAC_SECRET;

if (!hmacSecret) {
  throw new Error("Missing HMAC_SECRET environment variable");
}

app.use(express.json({ limit: "16kb" }));

function signLicenseResponse({ valid, reason, expires }) {
  const message = `${valid}|${reason}|${expires}`;
  return crypto.createHmac("sha256", hmacSecret).update(message).digest("hex");
}

app.get("/", (_req, res) => {
  res.json({ ok: true });
});

app.post("/validate", (req, res) => {
  const valid = true;
  const reason = "ok";
  const expires = "2099-12-31T23:59:59Z";
  const sig = signLicenseResponse({ valid, reason, expires });

  res.json({
    valid,
    reason,
    expires,
    sig
  });
});

app.listen(port, () => {
  console.log(`Auth endpoint listening on port ${port}`);
});
