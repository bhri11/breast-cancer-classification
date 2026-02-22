from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import joblib
import numpy as np

# 1. API Uygulamasını Başlatma
app = FastAPI(title="Breast Cancer Classification API", version="1.0")

# 2. CORS Ayarları (Önemli!)
# React (Frontend) tarafının bu API'ye engelsiz istek atabilmesi için gereklidir.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Canlıya alırken bunu React sitemizin adresiyle değiştireceğiz
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Model ve Scaler Yükleme
# Global alanda yüklüyoruz ki her istekte model baştan yüklenip sistemi yormasın (Performans optimizasyonu).
try:
    model = tf.keras.models.load_model('linearclassifier.h5')
    scaler = joblib.load('scaler.pkl')
except Exception as e:
    print(f"Model veya Scaler yüklenirken hata oluştu: {e}")

# 4. Veri Doğrulama Modeli (OOP ve Clean Code)
# Pydantic kullanarak kullanıcıdan tam olarak ne beklediğimizi tanımlıyoruz.
class TumorData(BaseModel):
    features: list[float]

    class Config:
        json_schema_extra = {
            "example": {
                "features": [17.99, 10.38, 122.8, 1001.0, 0.1184, 0.2776, 0.3001, 0.1471, 0.2419, 0.07871, 1.095, 0.9053, 8.589, 153.4, 0.006399, 0.04904, 0.05373, 0.01587, 0.03003, 0.006193, 25.38, 17.33, 184.6, 2019.0, 0.1622, 0.6656, 0.7119, 0.2654, 0.4601, 0.1189]
            }
        }

# 5. Tahmin Uç Noktası (Endpoint)
@app.post("/predict/")
async def predict_tumor(data: TumorData):
    # Validasyon: Tam 30 özellik (feature) girilmek zorunda.
    if len(data.features) != 30:
        raise HTTPException(status_code=400, detail="Lütfen tam 30 adet değer gönderin.")

    try:
        # Gelen veriyi modelin istediği formata (1, 30) dönüştür
        input_data = np.array(data.features).reshape(1, -1)
        
        # Veriyi eğitimdeki gibi ölçeklendir
        scaled_data = scaler.transform(input_data)
        
        # Tahmin yap
        prediction = model.predict(scaled_data)
        probability = float(prediction[0][0])
        
        # Scikit-learn veri setinde: 0 = Malignant (Kötü Huylu), 1 = Benign (İyi Huylu)
        predicted_class = 1 if probability > 0.5 else 0
        class_name = "Benign (İyi Huylu)" if predicted_class == 1 else "Malignant (Kötü Huylu)"
        
        return {
            "prediction": class_name,
            "probability": probability
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# API'nin ayakta olup olmadığını kontrol etmek için basit bir GET isteği
@app.get("/")
async def root():
    return {"message": "Breast Cancer Classification API Sistemde!"}