"""
Description: Flask application for weather prediction using SVM model and Visual Crossing API
"""

# =====================================================================================
# IMPORTS AND DEPENDENCIES
# =====================================================================================

# Core Flask imports
from flask import Flask, render_template, request, jsonify, send_from_directory

# Standard library imports
import os
from datetime import datetime, timedelta, timezone
from collections import Counter

# Third-party imports
import requests # utk mengakses API eksternal 
import joblib # utk loading model ML yg sdh dilatih
import numpy as np # utk manipulasi data
import pandas as pd 
from sklearn.preprocessing import StandardScaler # utk preprocessing data

# =====================================================================================
# APPLICATION CONFIGURATION
# =====================================================================================

# Initialize Flask application
app = Flask(__name__, static_folder='.', static_url_path='')

# API Configuration
# utk mengakses layanan cuaca visual crossing
VISUAL_CROSSING_API_KEY = "4U9YJTK8HYWFRKZ86G4N68TK7"
VISUAL_CROSSING_BASE_URL = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline"

# Model configuration
# konfigurasi model SVM dan scaler yg digunakan utk prediksi
MODEL_CONFIG = {
    'svm_model_path': 'svm_model_cuaca.pkl',
    'scaler_path': 'scaler_cuaca.pkl',
    'default_location': "Teluk Ambon, Maluku, Indonesia", # lokasi default dan kolom fitur utk machine learning
    'feature_columns': ['temp', 'humidity', 'precip', 'windspeed',
                       'windgust', 'cloudcover', 'visibility',
                       'uvindex', 'solarradiation', 'pressure']
}

# Global model variables
svm_model = None
scaler = None
model_proba_enabled = False

# Weather condition mappings
# mapping kondisi cuaca dari bing ke indo, kondisi cuaca ke icon yg sesuai
CONDITION_TRANSLATIONS = {
    'partially cloudy': 'Sebagian Berawan',
    'clear': 'Cerah',
    'sunny': 'Cerah',
    'rain': 'Hujan',
    'drizzle': 'Hujan',
    'shower': 'Hujan',
    'cloud': 'Berawan',
    'overcast': 'Berawan',
    'snow': 'Salju',
    'storm': 'Badai',
    'thunder': 'Badai',
    'fog': 'Kabut'
}

WEATHER_ICONS = {
    'clear': 'sunny.png',
    'sunny': 'sunny.png',
    'rain': 'rain.png',
    'drizzle': 'rain.png',
    'hujan': 'rain.png',
    'cloud': 'cloudy-day.png',
    'overcast': 'cloudy-day.png',
    'berawan': 'cloudy-day.png',
    'snow': 'snowy.png',
    'storm': 'stormy.png',
    'thunder': 'stormy.png',
    'default': 'cloudy-day.png'
}

DAY_NAMES_INDONESIAN = {
    'Monday': 'Sen',
    'Tuesday': 'Sel', 
    'Wednesday': 'Rab',
    'Thursday': 'Kam',
    'Friday': 'Jum',
    'Saturday': 'Sab',
    'Sunday': 'Min'
}

PREDICTION_LABELS = {
    0: {
        'condition': 'berawan',
        'label': 'Berawan',
        'description': 'Sebagian berawan sepanjang hari dengan kemungkinan hujan sepanjang hari.'
    },
    1: {
        'condition': 'cerah',
        'label': 'Cerah',
        'description': 'Cuaca cerah dan terik dengan sedikit awan.'
    },
    2: {
        'condition': 'hujan',
        'label': 'Hujan',
        'description': 'Berpotensi hujan sepanjang hari dengan intensitas ringan hingga sedang.'
    }
}

# =====================================================================================
# MODEL INITIALIZATION
# =====================================================================================

# memuat model SVM dan scaler yg sdh dilatih, jika gagal aplikasi ttp berjalan dgn prediksi dummy
def initialize_model():
    """Initialize SVM model and scaler with error handling."""
    global svm_model, scaler, model_proba_enabled
    
    try:
        # Load SVM model
        svm_model = joblib.load(MODEL_CONFIG['svm_model_path'])
        
        # Check if model supports probability prediction
        if hasattr(svm_model, 'predict_proba') and callable(getattr(svm_model, 'predict_proba')):
            print("Model SVC berhasil dimuat dan mendukung probabilitas!")
            model_proba_enabled = True
        else:
            print("Model SVC berhasil dimuat, TAPI TIDAK mendukung probabilitas. Pastikan melatih model dengan 'probability=True'.")
        
        # Load scaler
        scaler = joblib.load(MODEL_CONFIG['scaler_path'])
        print("Scaler berhasil dimuat!")
        
        return True
        
    except FileNotFoundError:
        print("\n--- PENTING: FILE MODEL ATAU SCALER TIDAK DITEMUKAN! ---")
        print("Pastikan 'svm_model_cuaca.pkl' dan 'scaler_cuaca.pkl' berada di direktori yang sama dengan app.py.")
        print("Aplikasi akan menggunakan logika prediksi dummy sebagai fallback.")
        print("------------------------------------------------------\n")
        return False
        
    except Exception as e:
        print(f"\n--- ERROR SAAT MEMUAT MODEL ATAU SCALER: {e} ---")
        print("Aplikasi akan menggunakan logika prediksi dummy sebagai fallback.")
        print("------------------------------------------------------\n")
        return False

# Initialize model on startup
initialize_model()

# =====================================================================================
# UTILITY FUNCTIONS
# =====================================================================================

def translate_condition_to_indonesian(condition_en):
    """Translate weather condition from English to Indonesian."""
    if not condition_en:
        return condition_en
        
    condition_en_lower = condition_en.lower()
    
    for english_term, indonesian_term in CONDITION_TRANSLATIONS.items():
        if english_term in condition_en_lower:
            return indonesian_term
    
    return condition_en

def get_weather_icon(condition):
    """Map weather condition to icon filename."""
    if not condition:
        return WEATHER_ICONS['default']
        
    condition_lower = condition.lower()
    
    for condition_key, icon_file in WEATHER_ICONS.items():
        if condition_key in condition_lower:
            return icon_file
    
    return WEATHER_ICONS['default']

def get_day_name_indonesian(date_obj):
    """Get Indonesian day name from date object."""
    english_day = date_obj.strftime('%A')
    return DAY_NAMES_INDONESIAN.get(english_day, english_day[:3])

def validate_date_format(date_string):
    """Validate date string format (YYYY-MM-DD)."""
    try:
        datetime.strptime(date_string, '%Y-%m-%d')
        return True
    except ValueError:
        return False

def create_error_response(message, status_code=404):
    """Create standardized error response."""
    return {
        "error": message,
        "predictedCondition": "default",
        "visualCrossingData": {
            'datetime': '',
            'conditions': 'Tidak tersedia',
            'temp': 'N/A',
            'humidity': 'N/A',
            'windspeed': 'N/A',
            'uvindex': 'N/A',
            'description': message,
            'feelslike': 'N/A',
            'visibility': 'N/A',
            'pressure': 'N/A'
        },
        "modelPredictionResult": message,
        "modelProbability": None
    }

# =====================================================================================
# WEATHER DATA PROCESSING
# =====================================================================================

# mengambil data cuaca dari visual crossing API, error handling yg comprehensive
def get_weather_data_from_vc(target_date_str, location=None):
    """
    Fetch weather data from Visual Crossing API for a specific date.
    
    Args:
        target_date_str (str): Date in YYYY-MM-DD format
        location (str): Location string (optional)
    
    Returns:
        tuple: (weather_data_dict, error_message)
    """
    if location is None:
        location = MODEL_CONFIG['default_location']
    
    url_elements = "datetime,tempmax,tempmin,temp,humidity,windspeed,windgust,precip,preciptype,conditions,cloudcover,pressure,visibility,dewpoint,solarradiation,solarenergy,uvindex,description"
    url_vc = f"{VISUAL_CROSSING_BASE_URL}/{location}/{target_date_str}?key={VISUAL_CROSSING_API_KEY}&unitGroup=metric&include=days&elements={url_elements}&contentType=json"

    try:
        response_vc = requests.get(url_vc)
        response_vc.raise_for_status()
        weather_data_from_vc = response_vc.json()

        if not weather_data_from_vc.get('days'):
            return None, "Tidak ada data cuaca yang ditemukan untuk tanggal ini"

        return weather_data_from_vc['days'][0], None

    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code
        error_messages = {
            401: "API Key Visual Crossing tidak valid atau kuota habis",
            404: "Data cuaca tidak ditemukan untuk tanggal ini"
        }
        return None, error_messages.get(status_code, f"Error dari Visual Crossing API (HTTP {status_code})")
    
    except Exception as e:
        return None, f"Kesalahan saat mengambil data cuaca: {str(e)}"

def get_hourly_based_daily_prediction(target_date_str, location=None):
    """
    Fetch hourly weather data and process it for daily prediction.
    
    Args:
        target_date_str (str): Date in YYYY-MM-DD format
        location (str): Location string (optional)
    
    Returns:
        tuple: (processed_data_dict, error_message)
    """
    if location is None:
        location = MODEL_CONFIG['default_location']
    
    url_elements = "datetime,temp,humidity,windspeed,windgust,precip,preciptype,conditions,cloudcover,pressure,visibility,dewpoint,solarradiation,uvindex,description"
    url_vc = f"{VISUAL_CROSSING_BASE_URL}/{location}/{target_date_str}?key={VISUAL_CROSSING_API_KEY}&unitGroup=metric&include=hours&elements={url_elements}&contentType=json"

    try:
        response = requests.get(url_vc)
        response.raise_for_status()
        data = response.json()

        if not data.get("days") or not data["days"][0].get("hours"):
            return None, "Data per jam tidak tersedia untuk tanggal ini"

        hours = data["days"][0]["hours"]

        # Try to find noon data (12:00)
        noon_data = next((h for h in hours if h["datetime"].startswith("12:00")), None)

        if noon_data:
            selected = noon_data
        else:
            # Fallback: calculate average of all hours
            selected = calculate_hourly_average(hours)
            selected["conditions"] = hours[0].get("conditions", "")
            selected["description"] = hours[0].get("description", "")
            selected["datetime"] = target_date_str

        processed_data = process_hourly_data(selected, target_date_str)
        return processed_data, None

    except requests.exceptions.HTTPError as e:
        return None, f"Error dari API (HTTP {e.response.status_code})"
    except Exception as e:
        return None, f"Kesalahan saat ambil data per jam: {str(e)}"

def calculate_hourly_average(hours):
    """Calculate average values from hourly data."""
    selected = {}
    numeric_keys = ["temp", "humidity", "windspeed", "windgust", "precip",
                   "cloudcover", "pressure", "visibility", "solarradiation", "uvindex"]
    
    for key in numeric_keys:
        values = [h.get(key, 0) for h in hours if h.get(key) is not None]
        selected[key] = round(sum(values) / len(values), 2) if values else 0
    
    return selected

def process_hourly_data(selected, target_date_str):
    """Process hourly data into standardized format."""
    return {
        "datetime": target_date_str,
        "temp": selected.get("temp", 0),
        "humidity": selected.get("humidity", 0),
        "windspeed": selected.get("windspeed", 0),
        "windgust": selected.get("windgust", 0),
        "precip": selected.get("precip", 0),
        "cloudcover": selected.get("cloudcover", 0),
        "pressure": selected.get("pressure", 0),
        "visibility": selected.get("visibility", 0),
        "solarradiation": selected.get("solarradiation", 0),
        "uvindex": selected.get("uvindex", 0),
        "conditions": selected.get("conditions", ""),
        "description": selected.get("description", "")
    }

# =====================================================================================
# MODEL PREDICTION FUNCTIONS
# =====================================================================================

# menggunakan model SVM utk prediksi cuaca
# data preprocessing dgn StandardScaler
# return prediksi,detail,dan probabilitas
def predict_with_your_model(weather_data_for_day):
    """
    Predict weather condition using trained SVM model.
    
    Args:
        weather_data_for_day (dict): Weather data dictionary
    
    Returns:
        tuple: (condition_for_background, model_prediction_detail, probability)
    """
    # Fallback if model or scaler not loaded
    if svm_model is None or scaler is None:
        conditions_vc = weather_data_for_day.get('conditions', '').lower()
        translated_condition = translate_condition_to_indonesian(conditions_vc)
        return translated_condition.lower(), f"Model tidak tersedia. Prediksi dummy: {translated_condition}.", None

    try:
        # Get feature columns from model or use default
        if hasattr(svm_model, "feature_names_in_"):
            feature_columns = list(svm_model.feature_names_in_)
        else:
            feature_columns = MODEL_CONFIG['feature_columns']

        # Prepare input data
        input_data = prepare_model_input(weather_data_for_day, feature_columns)
        
        # Scale data
        input_data_scaled = scaler.transform(input_data)
        input_data_scaled = pd.DataFrame(input_data_scaled, columns=feature_columns)
        
        # Make prediction
        prediction_label = svm_model.predict(input_data_scaled)[0]
        
        # Process prediction results
        condition_info = get_prediction_info(prediction_label)
        model_detail = build_model_detail_string(condition_info, weather_data_for_day)
        
        # Get probability if available
        probability = get_prediction_probability(input_data_scaled) if model_proba_enabled else None
        
        return condition_info['condition'], model_detail, probability

    except Exception as e:
        print(f"Kesalahan saat menjalankan prediksi model: {e}")
        return "berawan", f"Gagal menjalankan model prediksi: {str(e)}", None

def prepare_model_input(weather_data, feature_columns):
    """Prepare weather data for model input."""
    features_dict = {col: weather_data.get(col, 0) for col in feature_columns}
    return pd.DataFrame([features_dict], columns=feature_columns)

def get_prediction_info(prediction_label):
    """Get prediction information based on label."""
    return PREDICTION_LABELS.get(prediction_label, {
        'condition': 'default',
        'label': f'Kondisi tidak spesifik (kode: {prediction_label})',
        'description': ''
    })

def get_prediction_probability(input_data_scaled):
    """Get prediction probability from model."""
    try:
        probabilities = svm_model.predict_proba(input_data_scaled)
        return round(np.max(probabilities) * 100, 2)
    except Exception as e:
        print(f"Error getting probability: {e}")
        return None

def build_model_detail_string(condition_info, weather_data):
    """Build detailed model prediction string."""
    model_detail = f"Prediksi Model: {condition_info['label']}"
    
    if model_proba_enabled:
        probability = get_prediction_probability(None)  # This needs to be passed properly
        if probability:
            model_detail += f" (Probabilitas: {probability}%)"
    
    model_detail += f" {condition_info['description']}"
    model_detail += (f" (Suhu: {weather_data.get('temp', 'N/A')}°C, "
                    f"Kelembaban: {weather_data.get('humidity', 'N/A')}%, "
                    f"Angin: {weather_data.get('windspeed', 'N/A')} km/j)")
    
    return model_detail

# =====================================================================================
# STATIC FILE ROUTES
# =====================================================================================

@app.route('/')
def serve_index():
    """Serve main index.html file."""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files."""
    return send_from_directory('.', path)

# =====================================================================================
# API ROUTES - WEATHER PREDICTION
# =====================================================================================

# endpoint REST API utk prediksi harian dan prediksi per jam, return data dlm format JSON
@app.route('/api/predict_weather')
def predict_weather():
    """API endpoint for daily weather prediction."""
    target_date_str = request.args.get('date')

    # Validate input
    if not target_date_str:
        return jsonify({"error": "Parameter 'date' (tanggal) wajib."}), 400

    if not validate_date_format(target_date_str):
        return jsonify({"error": "Format tanggal tidak valid. Gunakan YYYY-MM-DD."}), 400

    # Get weather data using hourly prediction method
    processed_data, error = get_hourly_based_daily_prediction(target_date_str)
    
    if error:
        error_response = create_error_response(error)
        error_response["visualCrossingData"]["datetime"] = target_date_str
        return jsonify(error_response), 404

    # Make prediction with model
    predicted_condition, model_prediction_detail, probability = predict_with_your_model(processed_data)

    # Prepare response
    response_data = {
        "status": "success",
        "date": target_date_str,
        "visualCrossingData": {
            **processed_data,
            'conditions': processed_data.get('conditions', ''),
            'description': processed_data.get('description', '')
        },
        "predictedCondition": predicted_condition,
        "modelPredictionResult": model_prediction_detail,
        "modelProbability": probability
    }

    return jsonify(response_data)

@app.route('/api/predict_weekly_weather')
def predict_hourly_weather():
    """API endpoint for hourly weather prediction (renamed from weekly)."""
    start_date_str = request.args.get('date')
    jam_awal = int(request.args.get('jam', datetime.now().hour))

    # Handle date input
    if not start_date_str:
        start_date = datetime.now().date()
        start_date_str = start_date.strftime('%Y-%m-%d')
    else:
        if not validate_date_format(start_date_str):
            return jsonify({"error": "Format tanggal tidak valid. Gunakan YYYY-MM-DD."}), 400
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()

    # Generate hourly forecast (keeping 7-hour range for compatibility)
    hourly_forecast = []
    errors = []

    for i in range(7):
        current_date = start_date + timedelta(days=i)
        current_date_str = current_date.strftime('%Y-%m-%d')
        
        # Get daily prediction data
        processed_data, error = get_hourly_based_daily_prediction(current_date_str)
        
        if error:
            errors.append(f"Tanggal {current_date_str}: {error}")
            hourly_forecast.append(create_hourly_error_entry(current_date, current_date_str, error))
        else:
            hourly_forecast.append(create_hourly_success_entry(current_date, current_date_str, processed_data))

    response_data = {
        "status": "success" if not errors else "partial_success",
        "weeklyForecast": hourly_forecast,  # Keep same key name for JS compatibility
        "errors": errors if errors else None,
        "start_date": start_date_str
    }

    return jsonify(response_data)

def create_hourly_error_entry(current_date, current_date_str, error):
    """Create error entry for hourly forecast."""
    return {
        "day": get_day_name_indonesian(current_date),
        "temp": 'N/A',
        "condition": "Tidak tersedia",
        "icon": get_weather_icon("berawan"),
        "date": current_date_str,
        "humidity": 'N/A',
        "windspeed": 'N/A',
        "full_prediction": error,
    }

def create_hourly_success_entry(current_date, current_date_str, processed_data):
    """Create success entry for hourly forecast."""
    predicted_condition, model_prediction_detail, probability = predict_with_your_model(processed_data)
    
    return {
        "day": get_day_name_indonesian(current_date),
        "temp": processed_data.get("temp", 0),
        "condition": predicted_condition,
        "icon": get_weather_icon(predicted_condition),
        "date": current_date_str,
        "humidity": processed_data.get('humidity', 0),
        "windspeed": processed_data.get('windspeed', 0),
        "full_prediction": model_prediction_detail,
        "model_prob": probability
    }

@app.route('/api/predict_hourly_weather')
def predict_detailed_hourly_weather():
    """API endpoint for detailed hourly weather prediction."""
    target_date_str = request.args.get('date')
    hour = int(request.args.get('hour', 12))

    # Validate input
    if not target_date_str:
        return jsonify({"error": "Parameter 'date' wajib."}), 400

    if not validate_date_format(target_date_str):
        return jsonify({"error": "Format tanggal tidak valid. Gunakan YYYY-MM-DD."}), 400

    # Prepare API URL for hourly data
    url_elements = "datetime,temp,humidity,windspeed,feelslike,uvindex,visibility,pressure,conditions,description"
    url_vc = f"{VISUAL_CROSSING_BASE_URL}/{MODEL_CONFIG['default_location']}/{target_date_str}?key={VISUAL_CROSSING_API_KEY}&unitGroup=metric&include=hours&elements={url_elements}&contentType=json"

    try:
        response = requests.get(url_vc)
        response.raise_for_status()
        data = response.json()

        if not data.get("days") or not data["days"][0].get("hours"):
            return jsonify({"error": "Data per jam tidak tersedia"}), 404

        hours = data["days"][0]["hours"]
        selected_hours = process_hourly_forecast(hours, hour, target_date_str)

        return jsonify({"hourlyForecast": selected_hours})

    except Exception as e:
        return jsonify({"error": f"Gagal ambil data per jam: {str(e)}"}), 500

def process_hourly_forecast(hours, start_hour, target_date_str):
    """Process hourly forecast data for selected time range."""
    selected_hours = []
    
    for h in hours:
        jam_int = int(h["datetime"].split(":")[0])
        if start_hour <= jam_int < start_hour + 5:
            predicted_condition, model_detail, prob = predict_with_your_model(h)

            selected_hours.append({
                "datetime": h["datetime"], 
                "date": target_date_str, 
                "temp": h.get("temp", 0),
                "humidity": h.get("humidity", 0),
                "windspeed": h.get("windspeed", 0),
                "feelslike": h.get("feelslike", h.get("temp", 0)),
                "uvindex": h.get("uvindex", 0),
                "visibility": h.get("visibility", 10),
                "pressure": h.get("pressure", 1013),
                "condition": predicted_condition,
                "description": h.get("description", ""),
                "modelPredictionResult": model_detail
            })
    
    return selected_hours

# =====================================================================================
# TEMPLATE ROUTES - LEGACY COMPATIBILITY
# =====================================================================================

@app.route('/home')
def home():
    """Legacy home route for template compatibility."""
    return render_template('index.html')

@app.route('/result')
def result():
    """Legacy result route for template compatibility."""
    tanggal_str = request.args.get('tanggal')
    if not tanggal_str:
        return "Parameter tanggal diperlukan", 400
    
    try:
        tanggal = datetime.strptime(tanggal_str, '%Y-%m-%d')
        target_day_data, error = get_weather_data_from_vc(tanggal_str)
        
        if error:
            hasil = create_legacy_error_result(tanggal, error)
        else:
            hasil = create_legacy_success_result(tanggal, target_day_data)
        
        return render_template('result.html', data=hasil)
    except ValueError:
        return "Format tanggal tidak valid", 400

@app.route('/weekly_result')
def hourly_result():
    """Legacy hourly result route (renamed from weekly)."""
    tanggal_str = request.args.get('tanggal')
    
    if tanggal_str:
        if not validate_date_format(tanggal_str):
            return "Format tanggal tidak valid", 400
        start_date = datetime.strptime(tanggal_str, '%Y-%m-%d').date()
    else:
        start_date = datetime.now().date()

    hasil_hourly = []
    
    for i in range(7):
        tgl = start_date + timedelta(days=i)
        tgl_str = tgl.strftime('%Y-%m-%d')
        
        target_day_data, error = get_weather_data_from_vc(tgl_str)
        
        if error:
            hasil_hourly.append(create_legacy_error_result(tgl, error))
        else:
            hasil_hourly.append(create_legacy_success_result(tgl, target_day_data))

    return render_template('weekly_result.html', data=hasil_hourly)

def create_legacy_error_result(tanggal, error):
    """Create legacy format error result for templates."""
    return {
        'tanggal': tanggal.strftime('%d %B %Y'),
        'cuaca': 'Tidak tersedia',
        'suhu_min': 'N/A',
        'suhu_max': 'N/A',
        'kelembaban': 'N/A',
        'angin': 'N/A',
        'error': error,
        'model_detail': error
    }

def create_legacy_success_result(tanggal, target_day_data):
    """Create legacy format success result for templates."""
    predicted_condition, model_prediction_detail, _ = predict_with_your_model(target_day_data)
    
    return {
        'tanggal': tanggal.strftime('%d %B %Y'),
        'cuaca': predicted_condition,
        'suhu_min': target_day_data.get('tempmin', 'N/A'),
        'suhu_max': target_day_data.get('tempmax', 'N/A'),
        'kelembaban': target_day_data.get('humidity', 'N/A'),
        'angin': target_day_data.get('windspeed', 'N/A'),
        'model_detail': model_prediction_detail
    }

# =====================================================================================
# APPLICATION STARTUP
# =====================================================================================

def print_startup_info():
    """Print application startup information."""
    if "YOUR_VISUAL_CROSSING_API_KEY" in VISUAL_CROSSING_API_KEY:
        print("\n!!! PENTING: Ganti 'YOUR_VISUAL_CROSSING_API_KEY' di app.py dengan API Key Anda yang sebenarnya !!!\n")
    
    print("🌤️ Aplikasi Prediksi Cuaca siap dijalankan!")
    print("✅ Model SVC:", "Dimuat" if svm_model else "Menggunakan fallback")
    print("✅ Scaler:", "Dimuat" if scaler else "Menggunakan fallback") 
    print("🌐 Server akan berjalan di: http://localhost:5000")

if __name__ == '__main__':
    print_startup_info()
    app.run(host='0.0.0.0', port=5000, debug=True)