import { useState } from 'react'
import './App.css'

// Veri setindeki 30 özelliğin gerçek isimleri
const FEATURE_NAMES = [
  'Mean Radius', 'Mean Texture', 'Mean Perimeter', 'Mean Area', 'Mean Smoothness',
  'Mean Compactness', 'Mean Concavity', 'Mean Concave Points', 'Mean Symmetry', 'Mean Fractal Dim',
  'Radius Error', 'Texture Error', 'Perimeter Error', 'Area Error', 'Smoothness Error',
  'Compactness Error', 'Concavity Error', 'Concave Points Error', 'Symmetry Error', 'Fractal Dim Error',
  'Worst Radius', 'Worst Texture', 'Worst Perimeter', 'Worst Area', 'Worst Smoothness',
  'Worst Compactness', 'Worst Concavity', 'Worst Concave Points', 'Worst Symmetry', 'Worst Fractal Dim'
];

function App() {
  // 30 adet boş değerden oluşan bir dizi (array) oluşturuyoruz
  const [features, setFeatures] = useState(Array(30).fill(''));
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sihirli Buton 1: İyi Huylu Tümör Örneği
  const fillBenign = () => {
    const benignData = [13.54, 14.36, 87.46, 566.3, 0.09779, 0.08129, 0.06664, 0.04781, 0.1885, 0.05766, 0.2699, 0.7886, 2.058, 23.56, 0.008462, 0.0146, 0.02387, 0.01315, 0.0198, 0.0023, 15.11, 19.26, 99.7, 711.2, 0.144, 0.1773, 0.239, 0.1288, 0.2977, 0.07259];
    setFeatures(benignData.map(String)); // Kutulara yazdırabilmek için string'e çeviriyoruz
    setError('');
    setResult(null);
  };

  // Sihirli Buton 2: Kötü Huylu Tümör Örneği
  const fillMalignant = () => {
    const malignantData = [17.99, 10.38, 122.8, 1001.0, 0.1184, 0.2776, 0.3001, 0.1471, 0.2419, 0.07871, 1.095, 0.9053, 8.589, 153.4, 0.006399, 0.04904, 0.05373, 0.01587, 0.03003, 0.006193, 25.38, 17.33, 184.6, 2019.0, 0.1622, 0.6656, 0.7119, 0.2654, 0.4601, 0.1189];
    setFeatures(malignantData.map(String));
    setError('');
    setResult(null);
  };

  // Tekil kutu değiştiğinde çalışacak fonksiyon
  const handleInputChange = (index, value) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    // Boş kutu var mı kontrolü
    if (features.some(val => val.trim() === '')) {
      setError("Lütfen tüm 30 değeri de eksiksiz giriniz.");
      setLoading(false);
      return;
    }

    // Metinleri ondalıklı sayılara (float) çeviriyoruz
    const featureArray = features.map(item => parseFloat(item));

    if (featureArray.some(isNaN)) {
      setError("Lütfen sadece geçerli sayılar giriniz.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/predict/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ features: featureArray }),
      });

      if (!response.ok) {
        throw new Error("Sunucuya bağlanılamadı. FastAPI'nin çalıştığından emin olun.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>🩺 Meme Kanseri Sınıflandırma</h1>
        <p>Hücre çekirdeği laboratuvar verilerini girerek model tahminini görüntüleyin.</p>
      </header>

      <main className="main-content">
        <div className="buttons-container">
          <button onClick={fillBenign} className="btn btn-benign">Örnek Doldur (İyi Huylu)</button>
          <button onClick={fillMalignant} className="btn btn-malignant">Örnek Doldur (Kötü Huylu)</button>
          <button onClick={() => setFeatures(Array(30).fill(''))} className="btn btn-clear">Temizle</button>
        </div>

        <form onSubmit={handlePredict} className="form-container">
          <div className="grid-container">
            {FEATURE_NAMES.map((name, index) => (
              <div key={index} className="input-group">
                <label>{name}</label>
                <input
                  type="number"
                  step="any"
                  value={features[index]}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>
          
          <button type="submit" className="btn btn-submit" disabled={loading}>
            {loading ? 'Analiz Ediliyor...' : 'Tahmin Et'}
          </button>
        </form>

        {error && <div className="error-box">{error}</div>}

        {result && (
          <div className={`result-box ${result.prediction.includes('İyi') ? 'result-safe' : 'result-danger'}`}>
            <h2>Sonuç: {result.prediction}</h2>
            <p>Olasılık Skoru: <strong>%{ (result.probability * 100).toFixed(2) }</strong></p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App