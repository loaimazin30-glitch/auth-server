#!/usr/bin/env python3
"""
keygen.py
---------
مولد توقيع ترخيص / تفعيل التطبيق وفق الشروط المحددة.

شروط الترخيص:
  • Endpoint:        POST /validate
  • Max URL length:  52 حرفاً
  • Response fields: valid, reason, expires, sig
  • Message format:  "<valid>|<reason>|<expires>"   (UTF-8)
  • Signature:       HMAC-SHA256, hex (64 char)
  • Secret (hex):    b309258d2e096b3bdfece839d7b38c936ae7b9af25ab775a70a358d9d921c05e
"""

import hmac
import hashlib
import json


# ----------------------------------------------------------------------
# ثوابت الترخيص
# ----------------------------------------------------------------------
SECRET_HEX = "b309258d2e096b3bdfece839d7b38c936ae7b9af25ab775a70a358d9d921c05e"
SECRET_KEY = bytes.fromhex(SECRET_HEX)          # تحويل السر إلى بايتات

ENDPOINT_PATH = "/validate"
MAX_URL_LEN   = 52                              # الحد الأقصى لطول الرابط الكامل


# ----------------------------------------------------------------------
# دوال التوليد
# ----------------------------------------------------------------------
def build_message(valid: bool, reason: str, expires: str) -> str:
    """
    يبني السلسلة الخام التي سيتم توقيعها.
    التنسيق:  "true|none|2028-12-31"
    """
    return f"{'true' if valid else 'false'}|{reason}|{expires}"


def sign_message(message: str, key: bytes = SECRET_KEY) -> str:
    """
    يوقّع الرسالة باستخدام HMAC-SHA256 ويُرجع التوقيع بصيغة Hex (64 حرفاً).
    """
    mac = hmac.new(key, message.encode("utf-8"), hashlib.sha256)
    return mac.hexdigest()


def generate_license(valid: bool = True,
                     reason: str = "none",
                     expires: str = "2028-12-31") -> dict:
    """
    يُولّد كائن JSON الكامل للرد على نقطة /validate.
    """
    message = build_message(valid, reason, expires)
    signature = sign_message(message)

    response = {
        "valid":   valid,
        "reason":  reason,
        "expires": expires,
        "sig":     signature,
    }
    return response


def verify_license(payload: dict) -> bool:
    """
    يتحقّق من صحة توقيع رد الترخيص.
    """
    expected_sig = sign_message(
        build_message(payload["valid"], payload["reason"], payload["expires"])
    )
    return hmac.compare_digest(expected_sig, payload.get("sig", ""))


# ----------------------------------------------------------------------
# نقطة التشغيل
# ----------------------------------------------------------------------
def main() -> None:
    license_obj = generate_license(
        valid=True,
        reason="ok",
        expires="2099-12-31T23:59:59Z",
    )

    raw_message = build_message(
        license_obj["valid"], license_obj["reason"], license_obj["expires"]
    )

    print("=" * 60)
    print("  License / Activation Key Generator")
    print("=" * 60)
    print(f"Endpoint        : POST {ENDPOINT_PATH}")
    print(f"Max URL length  : {MAX_URL_LEN} chars")
    print(f"Raw message     : {raw_message}")
    print(f"Signature (hex) : {license_obj['sig']}  (len={len(license_obj['sig'])})")
    print("-" * 60)
    print("JSON Response:")
    print(json.dumps(license_obj, ensure_ascii=False, indent=2))
    print("-" * 60)
    print(f"Verification    : {'VALID ✓' if verify_license(license_obj) else 'INVALID ✗'}")
    print("=" * 60)


if __name__ == "__main__":
    main()
