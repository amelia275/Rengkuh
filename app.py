import os
import shutil
from flask import Flask, send_from_directory

# Initialize Flask app to serve templates, static files, and markdown prompts
app = Flask(__name__, static_folder='static', template_folder='templates')

# Function to copy the caregiver image from downloads if present
def copy_caregiver_image():
    src = r"C:\Users\LENOVO\Downloads\granddaughter-talking-with-her-grandmother-sitting-wheelchair-cheerful-concept-happy-family.jpg"
    dest_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'assets')
    dest = os.path.join(dest_dir, 'caregiver_illustration.jpg')
    
    if os.path.exists(src):
        try:
            os.makedirs(dest_dir, exist_ok=True)
            shutil.copy(src, dest)
            print(f"Gambar berhasil disalin ke {dest}")
        except Exception as e:
            print(f"Gagal menyalin gambar: {str(e)}")
    else:
        print(f"Gambar sumber tidak ditemukan di {src}")

# Run the image copy before starting the web server
copy_caregiver_image()

@app.route('/')
def index():
    return send_from_directory('templates', 'index.html')

@app.route('/prompts/<path:path>')
def serve_prompts(path):
    return send_from_directory('prompts', path)

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    # Retrieve port configuration
    port = int(os.getenv("FLASK_PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
