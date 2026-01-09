import cv2
import numpy as np
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import io
import base64

app = Flask(__name__)
CORS(app)

def process_inpaint(image_bytes, mask_bytes):
    # Decode image
    nparr_img = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr_img, cv2.IMREAD_COLOR)
    
    # Decode mask
    nparr_mask = np.frombuffer(mask_bytes, np.uint8)
    mask = cv2.imdecode(nparr_mask, cv2.IMREAD_GRAYSCALE)
    
    if img is None or mask is None:
        return None

    # Apply Inpainting
    result = cv2.inpaint(img, mask, 3, cv2.INPAINT_TELEA)
    
    # Encode back to bytes
    _, buffer = cv2.imencode('.png', result)
    return buffer.tobytes()

@app.route('/inpaint', methods=['POST'])
def inpaint():
    if 'image' not in request.files or 'mask' not in request.files:
        return jsonify({"error": "Missing image or mask"}), 400
    
    image_file = request.files['image'].read()
    mask_file = request.files['mask'].read()
    
    result_bytes = process_inpaint(image_file, mask_file)
    
    if result_bytes is None:
        return jsonify({"error": "Processing failed"}), 500
        
    return send_file(
        io.BytesIO(result_bytes),
        mimetype='image/png',
        as_attachment=True,
        download_name='result.png'
    )

if __name__ == '__main__':
    app.run(debug=True, port=5000)
