# 📋 Manual del Panel de Administración

## 🔐 Acceso al Panel

1. **URL**: Abre `admin.html` en tu navegador o haz clic en "⚙️ Admin" en el footer
2. **Login**: Ingresa uno de estos correos autorizados:
   - `jlopezp@usil.edu.pe`
   - `joshua@usil.edu.pe`
3. Click en "Ingresar"

## ⚙️ Funciones Principales

### 1. Ingresar Resultados Reales

Cuando un partido finaliza:

1. Ingresa el marcador real en los dos campos (ej: `2 - 1`)
2. Click en **"💾 Guardar Resultado"**
3. ✅ El sistema automáticamente:
   - Guarda el resultado en Firestore
   - Recalcula los puntos de TODOS los participantes
   - Actualiza el ranking en tiempo real

### 2. Cálculo de Puntos

El sistema calcula automáticamente según estas reglas:

- **5 puntos** - Marcador exacto (ej: pronosticó 2-1 y fue 2-1)
- **3 puntos** - Ganador correcto (ej: pronosticó 2-1 y fue 3-0)
- **2 puntos** - Empate acertado (ej: pronosticó 1-1 y fue 2-2)
- **0 puntos** - No acertó nada

### 3. Recalcular Puntos

Si necesitas recalcular todos los puntos:

1. Click en **"🔄 Recalcular Todos los Puntos"**
2. Espera la confirmación
3. Los puntos se actualizarán en la base de datos

**¿Cuándo usar esto?**
- Si corregiste un resultado mal ingresado
- Si hubo un error en el cálculo
- Para verificar que todo está correcto

### 4. Estadísticas

El panel muestra en tiempo real:
- 👥 **Participantes**: Total de usuarios registrados
- 📊 **Pronósticos**: Total de pronósticos guardados
- ✅ **Finalizados**: Partidos con resultado ingresado
- ⏳ **Pendientes**: Partidos sin resultado

## 📅 Flujo de Trabajo Diario

### Antes del partido
1. Los usuarios ingresan sus pronósticos
2. Tú no necesitas hacer nada

### Durante el partido
1. Espera a que termine
2. Observa el resultado real

### Después del partido
1. Abre el panel admin
2. Ingresa el resultado real
3. Click en "Guardar"
4. ¡Listo! Los puntos se calculan automáticamente

## 🔥 Consejos

### ✅ Buenas Prácticas
- Ingresa los resultados **inmediatamente** después del partido
- Verifica el marcador antes de guardar
- Si te equivocas, simplemente ingresa el correcto y guarda de nuevo

### ❌ Evita
- No ingreses resultados parciales (espera al final del partido)
- No cierres el navegador sin confirmar que se guardó
- No compartas tu acceso admin con otros

## 🛠️ Resolución de Problemas

### "Error al guardar"
- Verifica tu conexión a internet
- Recarga la página e intenta de nuevo
- Verifica que ambos marcadores sean números válidos (0-15)

### "No puedo acceder"
- Verifica que tu correo esté en la lista de admins
- Limpia la caché del navegador
- Intenta en modo incógnito

### "Los puntos no se actualizan"
- Click en "Recalcular Todos los Puntos"
- Recarga la página principal del usuario
- Verifica que el resultado se guardó correctamente

## 🔒 Agregar Más Administradores

Para agregar más administradores, edita el archivo `admin.js`:

```javascript
// Línea 43-46
const ADMIN_EMAILS = [
    'jlopezp@usil.edu.pe',
    'joshua@usil.edu.pe',
    'nuevo-admin@usil.edu.pe'  // ← Agrega aquí
];
```

## 📱 Acceso Móvil

El panel admin funciona en móviles:
- Usa Chrome o Safari actualizado
- Orientación horizontal recomendada
- Conexión estable preferida

## ⚡ Atajos de Teclado

- **Enter** después de ingresar correo → Login
- **Tab** entre campos de marcador
- **Enter** en el segundo marcador → Guardar (próximamente)

---

**¿Necesitas ayuda?** Contacta al desarrollador: jlopezp@usil.edu.pe
