import crypto from "node:crypto";
import express from "express";

const app = express();
const port = process.env.PORT || 3000;
const hmacSecret = (process.env.HMAC_SECRET || "").trim();

if (!hmacSecret) {
  throw new Error("Missing HMAC_SECRET environment variable");
}

app.use(express.json({ limit: "16kb" }));

function createSignature(message) {
  return crypto.createHmac("sha256", hmacSecret).update(message).digest("hex");
}

function buildValidResponse() {
  const valid = true;
  const reason = "ok";
  const expires = "2099-12-31T23:59:59Z";
  const signedMessage = `1|${reason}|${expires}`;
  const sig = createSignature(signedMessage);

  return {
    valid,
    reason,
    expires,
    sig
  };
}

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    endpoint: "/validate"
  });
});

app.post("/validate", (req, res) => {
  console.log("validate request", {
    key: typeof req.body?.key === "string" ? "received" : "missing",
    hwid: typeof req.body?.hwid === "string" ? "received" : "missing"
  });

  res.status(200).type("application/json").send(JSON.stringify(buildValidResponse()));
});

app.get("/validate", (_req, res) => {
  res.status(200).type("application/json").send(JSON.stringify(buildValidResponse()));
});

app.listen(port, () => {
  console.log(`Auth endpoint listening on port ${port}`);
});
