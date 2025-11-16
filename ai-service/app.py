from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import mimetypes

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Simple Media Categorizer"
    })

@app.route('/classify', methods=['POST'])
def classify_media():
    """
    Accepts media file (image or video), categorizes as 'images' or 'videos'
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    try:
        # Get the content type from the request
        content_type = file.content_type or ''

        # Fallback to mime type detection from filename
        if not content_type:
            guessed_type, _ = mimetypes.guess_type(file.filename)
            content_type = guessed_type or ''

        print(f"📁 Processing file: {file.filename} (type: {content_type})")

        # Determine if it's an image or video
        if content_type.startswith('image/'):
            tags = ['images', 'media', 'image']
            category = 'Images'
            media_type = 'image'
        elif content_type.startswith('video/'):
            tags = ['videos', 'media', 'video']
            category = 'Videos'
            media_type = 'video'
        else:
            # Default to images if unable to determine
            tags = ['images', 'media', 'unknown']
            category = 'Images'
            media_type = 'image'

        print(f"✅ Category: {category}, Type: {media_type}")

        return jsonify({
            "tags": tags,
            "category": category,
            "media_type": media_type,
            "content_type": content_type
        })

    except Exception as e:
        print(f"❌ Error processing file: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"🚀 Starting Simple Media Categorizer Service on port {port}")
    print(f"📊 Categorizes files into: Images or Videos")
    app.run(host='0.0.0.0', port=port, debug=True)