"""
ParkPulse AI - Model Training Script
Trains a Random Forest Regressor on historical parking utilization data
and computes Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE).
"""

import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'synthetic_occupancy.csv')
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'parking_rf_model.pkl')

def train_model():
    print("Loading historical occupancy dataset...")
    df = pd.read_csv(DATA_PATH)

    features = ['hour', 'day_of_week', 'is_weekend', 'is_holiday', 'lag_occupancy']
    target = 'actual_occupancy'

    X = df[features]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print(f"Training Random Forest Regressor (n_estimators=100) on {len(X_train)} samples...")
    model = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))

    print("\n--- Model Evaluation Results ---")
    print(f"Mean Absolute Error (MAE): {mae:.2f} slots")
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f} slots")

    joblib.dump(model, MODEL_PATH)
    print(f"Model successfully saved to {MODEL_PATH}\n")

if __name__ == '__main__':
    train_model()
