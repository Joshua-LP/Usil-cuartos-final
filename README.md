# 🏆 Polla Mundial FIFA 2026 - USIL

<div align="center">

![USIL](https://img.shields.io/badge/USIL-30%20A%C3%B1os-C9A961?style=for-the-badge)
![FIFA 2026](https://img.shields.io/badge/FIFA-2026-003366?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Activo-16a34a?style=for-the-badge)

**Sistema de pronósticos deportivos para los Cuartos de Final del Mundial FIFA 2026**

[🚀 Demo en Vivo](https://joshua-lp.github.io/Usil-cuartos-final/) • [📋 Reportar Bug](https://github.com/Joshua-LP/Usil-cuartos-final/issues)

</div>

---

## 📖 Descripción

Sistema web interactivo diseñado exclusivamente para el personal de la **Universidad San Ignacio de Loyola (USIL)** para predecir los resultados de los 8 partidos de cuartos de final del Mundial FIFA 2026.

### ✨ Características Principales

- 🔐 **Acceso Restringido**: Solo correos @usil.edu.pe verificados contra base maestra
- ☁️ **Sincronización en Tiempo Real**: Firebase Firestore
- 🏅 **Ranking en Vivo**: Actualización automática de posiciones con puntos reales
- 📱 **Diseño Responsivo**: Funciona en desktop, tablet y móvil
- 🎨 **Interfaz Premium**: Diseño moderno con colores institucionales USIL
- 💾 **Guardado Automático**: Los pronósticos se guardan en la nube
- ⏱️ **Restricción Temporal**: Pronósticos bloqueados 30 minutos antes del inicio de cada partido
- 🎯 **Sistema de Partidos del Día**: Solo los partidos disponibles se pueden pronosticar
- ✨ **Animaciones Interactivas**: Feedback visual al realizar pronósticos
- 🎖️ **Resultados en Tiempo Real**: Los resultados se actualizan automáticamente cuando el admin los ingresa
- 👨‍💼 **Panel de Administración**: Solo para jlopezp@usil.edu.pe para ingresar resultados reales
- 📊 **Cálculo Automático de Puntos**: Los puntos se calculan automáticamente basándose en resultados reales

---

## 🎯 Sistema de Puntuación

| Resultado | Puntos |
|-----------|--------|
| 🎯 Marcador exacto | **5 puntos** |
| ✅ Ganador correcto | **3 puntos** |
| 🤝 Empate acertado | **2 puntos** |

---

## 🚀 Tecnologías

<div align="center">

| Frontend | Backend | Hosting |
|----------|---------|---------|
| HTML5 | Firebase Firestore | GitHub Pages |
| CSS3 (Custom Design System) | Firebase Authentication | |
| Vanilla JavaScript (ES6+) | | |

</div>

---

## 🏗️ Estructura del Proyecto

```
Usil-cuartos-final/
├── index.html           # Página principal (usuarios)
├── admin.html           # Panel de administración
├── styles.css           # Estilos premium con design tokens
├── script.js            # Lógica principal + Firebase
├── admin.js             # Lógica del panel admin
├── usil-logo.png        # Logo oficial USIL
├── usil_emails.json     # Lista blanca de correos autorizados (1,440)
├── README.md            # Documentación del proyecto
└── .gitignore           # Excluye archivos sensibles
```

---

## 🔧 Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/Joshua-LP/Usil-cuartos-final.git

# Navegar al directorio
cd Usil-cuartos-final

# Abrir en navegador
# Simplemente abre index.html en tu navegador
# (o usa Live Server en VS Code)
```

> **Nota**: Firebase ya está configurado y apunta a la base de datos en la nube.

---

## 📊 Datos del Mundial FIFA 2026

### ⚽ Cuartos de Final

| # | Fecha | Hora | Partido |
|---|-------|------|---------|
| QF1 | 09 Jul | 15:00 | 🇧🇷 Brasil vs Argentina 🇦🇷 |
| QF2 | 09 Jul | 19:00 | 🇪🇸 España vs Francia 🇫🇷 |
| QF3 | 10 Jul | 15:00 | 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra vs Alemania 🇩🇪 |
| QF4 | 10 Jul | 19:00 | 🇵🇹 Portugal vs Italia 🇮🇹 |
| QF5 | 11 Jul | 15:00 | 🇳🇱 Países Bajos vs Bélgica 🇧🇪 |
| QF6 | 11 Jul | 19:00 | 🇺🇾 Uruguay vs Colombia 🇨🇴 |
| QF7 | 12 Jul | 15:00 | 🇲🇽 México vs Estados Unidos 🇺🇸 |
| QF8 | 12 Jul | 19:00 | 🇯🇵 Japón vs Corea del Sur 🇰🇷 |

---

## 🔐 Seguridad

- ✅ Validación de correos contra base maestra de personal USIL
- ✅ Solo correos @usil.edu.pe permitidos
- ✅ Datos sensibles (archivos Excel) excluidos del repositorio
- ✅ Firestore con reglas de seguridad configuradas

---

## 🎨 Paleta de Colores USIL

```css
--gold: #C9A961        /* Dorado institucional */
--navy: #0a1628        /* Azul marino principal */
--navy-mid: #132240    /* Azul marino intermedio */
```

---

## 👨‍💼 Panel de Administración

El sistema incluye un panel de administración exclusivo para **Joshua Gabriel Lopez Pinto (jlopezp@usil.edu.pe)** donde puede:

- ✅ Ingresar los resultados reales de cada partido
- 📊 Ver el estado de todos los partidos (Pendiente/Finalizado)
- 🔄 Recalcular automáticamente los puntos de todos los participantes
- ⏱️ Los puntos se actualizan en tiempo real cuando se guarda un resultado

### Acceso al Panel

```
URL: /admin.html
Email autorizado: jlopezp@usil.edu.pe
```

### Características del Panel
- **Actualización Automática**: Al guardar un resultado, los puntos se recalculan automáticamente
- **Interfaz Intuitiva**: Vista clara de todos los partidos con inputs de marcadores
- **Validación**: No se pueden ingresar marcadores inválidos
- **Historial**: Muestra qué admin ingresó cada resultado y cuándo

---

## ⏱️ Sistema de Restricción Temporal

### Reglas de Pronósticos

- 🟢 **Disponible**: Puedes pronosticar hasta 30 minutos antes del inicio del partido
- 🟡 **Próximo**: El partido comienza en menos de 30 minutos (bloqueado)
- 🔴 **En Curso**: El partido está en curso (bloqueado)
- ⚫ **Finalizado**: El partido ha terminado (bloqueado)

### Partidos del Día

El sistema identifica automáticamente qué partidos se juegan cada día:
- Se muestran **2 partidos por día** durante los cuartos de final
- Solo los partidos del día actual están disponibles para pronosticar
- Los estados se actualizan automáticamente cada minuto

---

## 📝 Uso

### Para Usuarios

1. **Ingresa tu correo @usil.edu.pe** en la página principal
2. **Completa los pronósticos** de los partidos disponibles
   - Solo puedes pronosticar hasta 30 minutos antes del inicio de cada partido
   - Los partidos bloqueados aparecerán con un candado 🔒
3. **Guarda tu borrador** (se guarda en la nube) o **envía tus pronósticos**
4. **Consulta el ranking** en tiempo real
   - El ranking se actualiza automáticamente cuando se ingresan resultados
   - Verás medallas 🥇🥈🥉 para los primeros 3 lugares

### Para el Administrador (jlopezp@usil.edu.pe)

1. **Accede a `/admin.html`**
2. **Ingresa tu correo de administrador**
3. **Ingresa los resultados** de cada partido cuando finalicen
4. **Los puntos se recalculan automáticamente** para todos los participantes

---

## 🤝 Contribuciones

Este proyecto es de uso interno de USIL. Para reportar bugs o sugerencias:

1. Abre un [Issue](https://github.com/Joshua-LP/Usil-cuartos-final/issues)
2. Describe el problema o sugerencia
3. Adjunta capturas si es posible

---

## 👨‍💻 Autor

**Joshua López**
Universidad San Ignacio de Loyola

---

## 📄 Licencia

Este proyecto es de uso exclusivo de la Universidad San Ignacio de Loyola.

---

<div align="center">

**🏆 ¡Buena suerte en tus pronósticos! 🏆**

Desarrollado con ❤️ para la comunidad USIL

[⬆ Volver arriba](#-polla-mundial-fifa-2026---usil)

</div>
