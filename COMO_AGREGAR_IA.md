# 🤖 Cómo Agregar Predicciones con IA

## ¿Qué es esto?

Este documento explica cómo podrías agregar un **modelo de IA** que prediga los resultados de los partidos automáticamente, para comparar con los pronósticos de los participantes.

## Opciones para Implementar IA Predictiva

### 🔥 Opción 1: APIs de Predicción Deportiva (Más Fácil)

Usa servicios que ya tienen modelos entrenados:

#### **API-FOOTBALL** (Recomendado)
- **URL**: https://www.api-football.com/
- **Características**:
  - Predicciones basadas en estadísticas reales
  - Probabilidades de victoria, empate, goles
  - Actualizaciones en tiempo real
  - $0 para uso limitado / ~$30/mes para uso completo

**Ejemplo de implementación**:

```javascript
// En un nuevo archivo: ai-predictions.js

const API_KEY = 'TU_API_KEY_AQUI';
const API_URL = 'https://v3.football.api-sports.io';

async function getPrediction(fixtureId) {
    const response = await fetch(`${API_URL}/predictions?fixture=${fixtureId}`, {
        headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': 'v3.football.api-sports.io'
        }
    });

    const data = await response.json();
    const prediction = data.response[0].predictions;

    return {
        winner: prediction.winner.name, // Equipo ganador
        scoreHome: parseInt(prediction.goals.home), // Goles casa
        scoreAway: parseInt(prediction.goals.away), // Goles visitante
        confidence: prediction.percent.home // % confianza
    };
}

// Guardar predicción en Firestore
async function saveAIPrediction(matchId, prediction) {
    const docRef = doc(db, 'ai_predictions', String(matchId));
    await setDoc(docRef, {
        matchId: matchId,
        predictedHome: prediction.scoreHome,
        predictedAway: prediction.scoreAway,
        confidence: prediction.confidence,
        winner: prediction.winner,
        createdAt: serverTimestamp()
    });
}
```

#### **Otras APIs**:
- **Sportmonks** - https://www.sportmonks.com/
- **The Odds API** - https://the-odds-api.com/
- **FD API Sports** - https://rapidapi.com/fluis.lacasse/api/footapi7

### 🧠 Opción 2: Modelo de Machine Learning Propio (Más Avanzado)

Entrena tu propio modelo con datos históricos:

#### **Paso 1: Recolectar Datos**

```python
# scraper.py - Obtener datos históricos
import pandas as pd
from football_data_api import MatchAPI

# Obtener últimos 5 años de datos
matches = MatchAPI.get_matches(years=5)
df = pd.DataFrame(matches)

# Características relevantes
features = [
    'team1_ranking',
    'team2_ranking',
    'team1_recent_form',  # últimos 5 partidos
    'team2_recent_form',
    'head_to_head_history',  # historial entre equipos
    'goals_scored_avg',
    'goals_conceded_avg',
    'home_advantage',
    'tournament_stage'
]
```

#### **Paso 2: Entrenar Modelo**

```python
# train_model.py
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

# Preparar datos
X = df[features]
y = df['result']  # 'home_win', 'away_win', 'draw'

# Dividir en train/test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Entrenar modelo
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Guardar modelo
joblib.dump(model, 'football_predictor.pkl')

# Precisión
accuracy = model.score(X_test, y_test)
print(f"Precisión: {accuracy * 100:.2f}%")
```

#### **Paso 3: Crear API con el Modelo**

```python
# app.py - Flask API
from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)
model = joblib.load('football_predictor.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    features = np.array([
        data['team1_ranking'],
        data['team2_ranking'],
        data['team1_form'],
        # ... más features
    ]).reshape(1, -1)

    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0]

    return jsonify({
        'winner': prediction,
        'confidence': float(max(probability)),
        'predicted_score': {
            'home': int(np.random.poisson(data['team1_avg_goals'])),
            'away': int(np.random.poisson(data['team2_avg_goals']))
        }
    })

if __name__ == '__main__':
    app.run(port=5000)
```

#### **Paso 4: Integrar con tu App**

```javascript
// prediction-service.js
async function getAIPrediction(match) {
    const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            team1_ranking: match.team1.fifaRanking,
            team2_ranking: match.team2.fifaRanking,
            team1_form: await getRecentForm(match.team1.name),
            team2_form: await getRecentForm(match.team2.name),
            // ... más datos
        })
    });

    return await response.json();
}
```

### 🏆 Opción 3: Usar Modelos Pre-entrenados (Balance)

Usa modelos ya disponibles:

#### **FiveThirtyEight SPI**
- **URL**: https://projects.fivethirtyeight.com/soccer-api/
- Sistema de Poder de Índice (SPI)
- Predicciones gratuitas
- Muy confiable

#### **Poisson Distribution Model** (Básico pero efectivo)

```javascript
// simple-predictor.js
function poissonProbability(lambda, k) {
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function predictScore(team1AvgGoals, team2AvgGoals) {
    // Simulación de marcador más probable
    let maxProb = 0;
    let predictedScore = { home: 0, away: 0 };

    for (let i = 0; i <= 5; i++) {
        for (let j = 0; j <= 5; j++) {
            const prob = poissonProbability(team1AvgGoals, i) *
                        poissonProbability(team2AvgGoals, j);

            if (prob > maxProb) {
                maxProb = prob;
                predictedScore = { home: i, away: j };
            }
        }
    }

    return predictedScore;
}
```

## 📊 Cómo Mostrar las Predicciones en tu App

### 1. Agregar a la interfaz

```html
<!-- En cada tarjeta de partido -->
<div class="ai-prediction">
    <div class="ai-badge">🤖 Predicción IA</div>
    <div class="ai-score">
        <span class="ai-score-home">2</span>
        <span>-</span>
        <span class="ai-score-away">1</span>
    </div>
    <div class="ai-confidence">Confianza: 67%</div>
</div>
```

### 2. Agregar CSS

```css
.ai-prediction {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
    text-align: center;
}

.ai-badge {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    opacity: 0.9;
    margin-bottom: 0.5rem;
}

.ai-score {
    font-size: 1.5rem;
    font-weight: 700;
    display: flex;
    gap: 1rem;
    justify-content: center;
    align-items: center;
}

.ai-confidence {
    font-size: 0.8rem;
    opacity: 0.8;
    margin-top: 0.5rem;
}
```

### 3. Comparar con usuario

```javascript
function compareWithAI(userPrediction, aiPrediction, realResult) {
    const userPoints = calculatePoints(userPrediction, realResult);
    const aiPoints = calculatePoints(aiPrediction, realResult);

    return {
        userPoints: userPoints,
        aiPoints: aiPoints,
        winner: userPoints > aiPoints ? 'user' : (userPoints < aiPoints ? 'ai' : 'tie'),
        message: userPoints > aiPoints
            ? '🎉 ¡Le ganaste a la IA!'
            : '🤖 La IA fue mejor esta vez'
    };
}
```

## 🎯 Recomendación Final

**Para empezar rápido**: Usa **API-FOOTBALL** (Opción 1)
- 15 minutos de setup
- Predicciones confiables
- No requiere conocimientos de ML

**Para aprender y personalizar**: Empieza con **Poisson Model** (Opción 3)
- Simple de entender
- Puedes mejorarlo gradualmente
- Sin costos

**Para máximo control**: Entrena tu **propio modelo** (Opción 2)
- Requiere tiempo y datos
- Puedes optimizarlo para tu caso específico
- Aprenderás ML en el proceso

## 📦 Recursos Adicionales

- **Dataset Kaggle**: https://www.kaggle.com/martj42/international-football-results-from-1872-to-2017
- **Tutorial ML para fútbol**: https://www.youtube.com/watch?v=Aq6Qx9JNLhI
- ** estadísticas**: https://www.transfermarkt.com/

---

**Nota**: Si decides implementar esto, puedo ayudarte con el código específico para la opción que elijas.
