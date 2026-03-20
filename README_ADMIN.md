# 🏆 Pollada FIFA 2026 - Sistema de Pronósticos

Sistema completo de pronósticos deportivos para el Mundial FIFA 2026 con Firebase y administración en tiempo real.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Panel de Administración](#panel-de-administración)
- [Sistema de Puntos](#sistema-de-puntos)
- [Uso del Sistema](#uso-del-sistema)
- [APIs de Fútbol (Futuro)](#apis-de-fútbol-futuro)
- [Estructura del Proyecto](#estructura-del-proyecto)

## ✨ Características

### Para Usuarios
- ✅ Login con correo institucional USIL
- ✅ Registro de pronósticos para 8 partidos de cuartos de final
- ✅ Guardado automático en la nube (Firebase)
- ✅ Ranking en tiempo real
- ✅ Visualización de puntos acumulados
- ✅ Interfaz moderna y responsive

### Para Administradores
- ✅ Panel de administración protegido
- ✅ Ingreso de resultados reales
- ✅ Cálculo automático de puntos
- ✅ Recalculación masiva de puntos
- ✅ Actualización en tiempo real del ranking

## ⚙️ Panel de Administración

### Acceso al Panel

1. **URL**: `admin.html`
2. **Correos autorizados** (definidos en `admin.js`):
   - `jlopezp@usil.edu.pe`
   - `joshua@usil.edu.pe`

### Funciones del Panel

#### 1. Ingresar Resultados Reales
- Para cada partido, ingresa el marcador final (ej: 2 - 1)
- Click en "Guardar Resultado"
- El sistema automáticamente recalcula los puntos de todos los participantes

#### 2. Recalcular Puntos
- Botón "🔄 Recalcular Todos los Puntos"
- Procesa todas las predicciones vs resultados reales
- Actualiza el ranking en tiempo real

#### 3. Estados de Partidos
- **Pendiente**: Aún no se ha ingresado el resultado
- **Finalizado**: Resultado guardado, puntos calculados

## 🎯 Sistema de Puntos

El sistema calcula puntos automáticamente según estas reglas:

| Tipo de Acierto | Puntos | Ejemplo |
|----------------|--------|---------|
| **Marcador Exacto** | 5 pts | Pronóstico: 2-1, Real: 2-1 ✅ |
| **Ganador Correcto** | 3 pts | Pronóstico: 2-1, Real: 3-0 ✅ (ambos gana equipo 1) |
| **Empate Acertado** | 2 pts | Pronóstico: 1-1, Real: 2-2 ✅ (ambos empate) |
| **Fallo Completo** | 0 pts | Pronóstico: 2-1, Real: 0-2 ❌ |

### Lógica de Cálculo (en `admin.js`)

```javascript
function calculatePoints(prediction, result) {
    // Marcador exacto = 5 puntos
    if (p1 === r1 && p2 === r2) return 5;

    // Ganador/Empate correcto = 3 o 2 puntos
    const predWinner = p1 > p2 ? 1 : (p1 < p2 ? 2 : 0);
    const realWinner = r1 > r2 ? 1 : (r1 < r2 ? 2 : 0);

    if (predWinner === realWinner) {
        return predWinner === 0 ? 2 : 3; // Empate=2, Ganador=3
    }

    return 0;
}
```

## 🚀 Uso del Sistema

### Para Participantes

1. **Ingresar a la web**: Abre `index.html`
2. **Login**: Ingresa nombre y correo USIL
3. **Hacer pronósticos**: Completa los 8 partidos
4. **Guardar**: Click en "Enviar pronósticos"
5. **Ver ranking**: Click en "Ranking" para ver la tabla

### Para Administradores

1. **Acceder al panel**: Abre `admin.html` o click en "⚙️ Admin" en el footer
2. **Login admin**: Ingresa tu correo autorizado
3. **Esperar resultados reales**: Cuando termine un partido
4. **Ingresar marcador**: Escribe el resultado final (ej: Brasil 2 - Argentina 1)
5. **Guardar**: Click en "💾 Guardar Resultado"
6. **Verificar**: El ranking se actualiza automáticamente

### Proceso Diario (Durante el Mundial)

```
Día del partido:
1. Partido termina (ej: Brasil 2-1 Argentina)
2. Admin entra al panel
3. Admin ingresa: 2 - 1
4. Click "Guardar Resultado"
5. Sistema calcula puntos de todos
6. Ranking se actualiza automáticamente
```

## 🌐 APIs de Fútbol (Futuro)

Para **automatizar** la obtención de resultados reales, puedes integrar APIs de fútbol:

### Opciones de APIs

#### 1. **API-FOOTBALL** (Recomendado)
- **URL**: https://www.api-football.com/
- **Plan Gratis**: 100 requests/día
- **Datos**: Resultados en tiempo real, estadísticas
- **Costo**: Gratis para desarrollo

```javascript
// Ejemplo de integración
async function fetchRealResults() {
    const response = await fetch(
        'https://v3.football.api-sports.io/fixtures?date=2026-07-09',
        {
            headers: {
                'x-rapidapi-key': 'TU_API_KEY'
            }
        }
    );
    const data = await response.json();
    // Procesar resultados...
}
```

#### 2. **FOOTBALL-DATA.ORG**
- **URL**: https://www.football-data.org/
- **Plan Gratis**: 10 requests/minuto
- **Ideal para**: Competiciones internacionales

#### 3. **THE SPORTS DB**
- **URL**: https://www.thesportsdb.com/
- **Plan Gratis**: Ilimitado, con delay de 1 día
- **Ideal para**: Datos históricos

### Implementación Sugerida

```javascript
// En admin.js - Agregar función automática
async function autoFetchResults() {
    const today = new Date().toISOString().split('T')[0];

    // Llamar a API
    const fixtures = await fetchFromAPI(today);

    // Para cada partido del día
    for (const fixture of fixtures) {
        if (fixture.status === 'FT') { // Full Time
            await saveResult(fixture.id, {
                t1: fixture.score.home,
                t2: fixture.score.away
            });
        }
    }

    // Recalcular puntos
    await recalculateAllPoints();
}

// Ejecutar cada hora durante el Mundial
setInterval(autoFetchResults, 3600000);
```

### Ventajas de API Automática
- ✅ No necesitas ingresar resultados manualmente
- ✅ Actualización en tiempo real
- ✅ Sin errores de transcripción
- ✅ Datos oficiales verificados

### Desventajas
- ⚠️ Requiere suscripción/API key
- ⚠️ Límites de requests
- ⚠️ Depende de servicio externo

## 📁 Estructura del Proyecto

```
SISTEMA POLLADA/
│
├── index.html          # Página principal (usuarios)
├── admin.html          # Panel administrativo
├── script.js           # Lógica principal
├── admin.js            # Lógica del admin panel
├── styles.css          # Estilos globales
├── usil_emails.json    # Lista blanca de correos
├── test_debug.html     # Herramienta de testing
└── README_ADMIN.md     # Este archivo
```

## 🔒 Seguridad

### Correos Autorizados
La lista blanca está en `usil_emails.json` (1444 correos)

### Admins Autorizados
Definidos en `admin.js` línea 34:
```javascript
const ADMIN_EMAILS = [
    'jlopezp@usil.edu.pe',
    'joshua@usil.edu.pe'
];
```

Para agregar más admins, edita este array.

## 📊 Colecciones Firebase

### 1. `users` - Información de usuarios
```javascript
{
    email: "usuario@usil.edu.pe",
    name: "Juan Pérez",
    lastLogin: timestamp
}
```

### 2. `predictions` - Pronósticos
```javascript
{
    email: "usuario@usil.edu.pe",
    name: "Juan Pérez",
    predictions: {
        "1": { t1: 2, t2: 1 },
        "2": { t1: 1, t2: 1 },
        // ...
    },
    totalPoints: 15,
    completedMatches: 8,
    lastCalculated: timestamp
}
```

### 3. `results` - Resultados reales
```javascript
{
    matchId: 1,
    t1: 2,
    t2: 1,
    completed: true,
    updatedAt: timestamp,
    updatedBy: "admin@usil.edu.pe"
}
```

## 🎓 Preguntas Frecuentes

### ¿Se actualiza automáticamente?
**Sí**, el ranking usa `onSnapshot` de Firebase, se actualiza en tiempo real sin recargar la página.

### ¿Debo ingresar resultados todos los días?
**Sí**, después de cada partido debes ingresar el resultado en `admin.html`. O puedes integrar una API.

### ¿Puedo modificar las reglas de puntos?
**Sí**, edita la función `calculatePoints()` en `admin.js`.

### ¿Qué pasa si me equivoco al ingresar un resultado?
Simplemente corrígelo en el panel admin y click "Recalcular Todos los Puntos".

## 🚀 Próximas Mejoras

- [ ] Integración con API de fútbol en tiempo real
- [ ] Notificaciones push cuando se actualizan resultados
- [ ] Estadísticas avanzadas por participante
- [ ] Historial de aciertos/fallos
- [ ] Predicciones con IA (modelo de ML)
- [ ] Exportar ranking a PDF
- [ ] Sistema de premios automático

---

**Desarrollado para USIL - Pollada FIFA 2026** 🏆⚽