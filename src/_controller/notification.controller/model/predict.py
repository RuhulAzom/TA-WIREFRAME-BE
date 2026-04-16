import numpy as np
from keras.models import load_model
import json
import sys

if __name__ == "__main__":
    # MEMUAT MODEL YANG SUDAH DILATIH
    # model = load_model('antraknosa.keras')
    model = load_model(sys.argv[2])


    # MENERIMA DATA INPUT DARI COMMAND LINE ARGUMENT
    # Format: [[suhu, rh], [suhu, rh], ..., [suhu, rh]] (8 pairs)
    try:
        input_data = json.loads(sys.argv[1])
        data_array = np.array([input_data], dtype=float)
        
        # NORMALISASI DATA
        data_array[:, :, 0] /= 40.0   # Suhu dibagi 40
        data_array[:, :, 1] /= 100.0  # RH dibagi 100
        
        # PREDIKSI
        prediction = model.predict(data_array, verbose=0)
        risk_percentage = float(prediction[0][0] * 100)
        
        # OUTPUT SEBAGAI JSON
        result = {
            "success": True,
            "risk_percentage": round(risk_percentage, 2),
            "prediction": float(prediction[0][0])
        }
        print(json.dumps(result))
    except Exception as e:
        result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(result))

