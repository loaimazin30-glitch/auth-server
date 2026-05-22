from flask import Flask, request, jsonify
import hmac
import hashlib
import os

app = Flask(__name__)

HEX_SECRET = "b309258d2e096b3bdfece839d7b38c936ae7b9af25ab775a70a358d9d921c05e"
HMAC_SECRET = bytes.fromhex(HEX_SECRET)

@app.route('/validate', methods=['POST'])
def validate_license():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400
        
        user_key = data.get("key")
        hwid = data.get("hwid")
        
        valid_status = "true"
        reason = "none"
        expires = "2028-12-31" 
        
        signed_message = f"{valid_status}|{reason}|{expires}".encode('utf-8')
        
        computed_sig = hmac.new(HMAC_SECRET, signed_message, hashlib.sha256).hexdigest()
        
        return jsonify({
            "sig": computed_sig,
            "valid": True,
            "reason": reason,
            "expires": expires
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':

    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)