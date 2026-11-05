"""
ParkPulse AI - Flask Microservice for Model Serving
Exposes POST /predict and GET /health endpoints
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'parking_rf_model.pkl')
model = None

if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    print("Pre-trained Random Forest model loaded successfully.")
else:
    print("Warning: Model file not found. Run train.py first to generate parking_rf_model.pkl.")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "ParkPulse AI Python Prediction Microservice",
        "model_loaded": model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json() or {}
    hour = data.get('hour', 12)
    day_of_week = data.get('day_of_week', 2)
    is_weekend = data.get('is_weekend', 0)
    is_holiday = data.get('is_holiday', 0)
    lag_occupancy = data.get('lag_occupancy', 10)
    capacity = data.get('capacity', 20)

    if model:
        features = np.array([[hour, day_of_week, is_weekend, is_holiday, lag_occupancy]])
        prediction = float(model.predict(features)[0])
    else:
        # Fallback heuristic
        factor = 0.85 if 9 <= hour <= 18 else 0.35
        prediction = capacity * factor

    pred_slots = int(min(capacity, max(0, round(prediction))))
    available = capacity - pred_slots
    occ_rate = round((pred_slots / capacity) * 100, 1)

    demand = "MEDIUM"
    if occ_rate >= 80:
        demand = "HIGH"
    elif occ_rate < 45:
        demand = "LOW"

    return jsonify({
        "hour": hour,
        "predicted_occupied": pred_slots,
        "predicted_available": available,
        "occupancy_rate": occ_rate,
        "demand_category": demand
    })

if __name__ == '__main__':
    port = int(os.environ.get('AI_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
