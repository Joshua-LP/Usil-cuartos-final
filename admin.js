/* ==================================================
   ADMIN PANEL - POLLADA FIFA 2026
   ================================================== */

// ─── Firebase SDK ───
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getFirestore, collection, doc, setDoc, getDoc, getDocs,
    onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ─── Configuración Firebase ───
const firebaseConfig = {
    apiKey: "AIzaSyBqxWFuv6WJgEVQUSYhIOV9X9Io9r78mG0",
    authDomain: "pollada-usil-2026.firebaseapp.com",
    projectId: "pollada-usil-2026",
    storageBucket: "pollada-usil-2026.firebasestorage.app",
    messagingSenderId: "500443995154",
    appId: "1:500443995154:web:e1470f8834d4cb4ee7cccb",
    measurementId: "G-YVSY2RD3Q4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Colecciones ───
const resultsCol = collection(db, 'results');
const predictCol = collection(db, 'predictions');

// ─── Datos de partidos ───
const quarterFinals = [
    { id:1, tag:'QF1', date:'2026-07-09', time:'15:00', team1:{name:'Brasil',flag:'🇧🇷'},          team2:{name:'Argentina',flag:'🇦🇷'} },
    { id:2, tag:'QF2', date:'2026-07-09', time:'19:00', team1:{name:'España',flag:'🇪🇸'},          team2:{name:'Francia',flag:'🇫🇷'} },
    { id:3, tag:'QF3', date:'2026-07-10', time:'15:00', team1:{name:'Inglaterra',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿'},   team2:{name:'Alemania',flag:'🇩🇪'} },
    { id:4, tag:'QF4', date:'2026-07-10', time:'19:00', team1:{name:'Portugal',flag:'🇵🇹'},        team2:{name:'Italia',flag:'🇮🇹'} },
    { id:5, tag:'QF5', date:'2026-07-11', time:'15:00', team1:{name:'Países Bajos',flag:'🇳🇱'},    team2:{name:'Bélgica',flag:'🇧🇪'} },
    { id:6, tag:'QF6', date:'2026-07-11', time:'19:00', team1:{name:'Uruguay',flag:'🇺🇾'},         team2:{name:'Colombia',flag:'🇨🇴'} },
    { id:7, tag:'QF7', date:'2026-07-12', time:'15:00', team1:{name:'México',flag:'🇲🇽'},          team2:{name:'Estados Unidos',flag:'🇺🇸'} },
    { id:8, tag:'QF8', date:'2026-07-12', time:'19:00', team1:{name:'Japón',flag:'🇯🇵'},           team2:{name:'Corea del Sur',flag:'🇰🇷'} },
];

// ─── Admins autorizados ───
const ADMIN_EMAILS = [
    'jlopezp@usil.edu.pe',
    'joshua@usil.edu.pe'
];

// ─── Estado ───
let adminData = { email: '', isAdmin: false };
let matchResults = {};

// ─── Inicialización ───
document.addEventListener('DOMContentLoaded', async () => {
    hideLoader();
    checkSession();
    bindEvents();
});

// ─── Funciones de UI ───
function hideLoader() {
    const loader = document.getElementById('loader');
    setTimeout(() => loader.classList.add('hide'), 500);
    setTimeout(() => loader.style.display = 'none', 900);
}

function toast(msg, type = 'info') {
    const c = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => el.classList.add('removing'), 3000);
    setTimeout(() => el.remove(), 3400);
}

// ─── Autenticación Admin ───
function checkSession() {
    const saved = localStorage.getItem('polladaAdmin_session');
    if (saved) {
        const s = JSON.parse(saved);
        if (s.email && ADMIN_EMAILS.includes(s.email.toLowerCase())) {
            adminData.email = s.email;
            adminData.isAdmin = true;
            showAdminPanel();
        }
    }
}

function bindEvents() {
    document.getElementById('btnAdminLogin').addEventListener('click', handleAdminLogin);
    document.getElementById('btnLogoutAdmin').addEventListener('click', handleLogout);
    document.getElementById('btnRecalculate').addEventListener('click', recalculateAllPoints);
}

function handleAdminLogin() {
    const email = document.getElementById('adminEmail').value.trim().toLowerCase();

    if (!email) {
        toast('Ingresa tu correo', 'error');
        return;
    }

    if (!ADMIN_EMAILS.includes(email)) {
        toast('No tienes permisos de administrador', 'error');
        return;
    }

    adminData.email = email;
    adminData.isAdmin = true;
    localStorage.setItem('polladaAdmin_session', JSON.stringify({ email }));
    showAdminPanel();
    toast(`¡Bienvenido, Admin!`, 'success');
}

function handleLogout() {
    localStorage.removeItem('polladaAdmin_session');
    adminData = { email: '', isAdmin: false };
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('adminLogin').style.display = '';
    toast('Sesión cerrada', 'info');
}

async function showAdminPanel() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminPanel').style.display = '';
    document.getElementById('adminName').textContent = adminData.email;

    await loadResults();
    renderResultsGrid();
}

// ─── Cargar resultados ───
async function loadResults() {
    try {
        const snapshot = await getDocs(resultsCol);
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            matchResults[docSnap.id] = data;
        });
        console.log('[ADMIN] Resultados cargados:', matchResults);
    } catch (err) {
        console.error('[ADMIN] Error cargando resultados:', err);
    }
}

// ─── Renderizar grid de resultados ───
function renderResultsGrid() {
    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = '';

    quarterFinals.forEach(match => {
        const result = matchResults[match.id] || { t1: '', t2: '', completed: false };

        const fDate = new Date(match.date + 'T00:00:00').toLocaleDateString('es-PE', {
            day:'numeric', month:'short', year:'numeric'
        });

        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="result-card__header">
                <div>
                    <strong>${match.tag}</strong> · ${fDate} ${match.time}
                </div>
                <span class="status-badge status-badge--${result.completed ? 'completed' : 'pending'}">
                    ${result.completed ? 'Finalizado' : 'Pendiente'}
                </span>
            </div>
            <div class="result-card__teams">
                <div class="result-team">
                    <div class="result-team__flag">${match.team1.flag}</div>
                    <div class="result-team__name">${match.team1.name}</div>
                </div>
                <div style="font-size: 1.5rem; font-weight: bold; color: var(--gray-400);">VS</div>
                <div class="result-team">
                    <div class="result-team__flag">${match.team2.flag}</div>
                    <div class="result-team__name">${match.team2.name}</div>
                </div>
            </div>
            <div class="result-inputs">
                <input type="number" class="result-input" id="result-t1-${match.id}"
                       min="0" max="15" placeholder="-" value="${result.t1}">
                <span class="result-dash">-</span>
                <input type="number" class="result-input" id="result-t2-${match.id}"
                       min="0" max="15" placeholder="-" value="${result.t2}">
            </div>
            <button class="save-result-btn" onclick="saveResult(${match.id})">
                💾 Guardar Resultado
            </button>
        `;
        grid.appendChild(card);
    });
}

// ─── Guardar resultado ───
window.saveResult = async function(matchId) {
    const t1Input = document.getElementById(`result-t1-${matchId}`);
    const t2Input = document.getElementById(`result-t2-${matchId}`);

    const t1 = parseInt(t1Input.value);
    const t2 = parseInt(t2Input.value);

    if (isNaN(t1) || isNaN(t2) || t1 < 0 || t2 < 0) {
        toast('Ingresa marcadores válidos', 'error');
        return;
    }

    try {
        const docRef = doc(resultsCol, String(matchId));
        await setDoc(docRef, {
            matchId: matchId,
            t1: t1,
            t2: t2,
            completed: true,
            updatedAt: serverTimestamp(),
            updatedBy: adminData.email
        });

        matchResults[matchId] = { t1, t2, completed: true };
        toast(`Resultado guardado: ${t1} - ${t2}`, 'success');
        renderResultsGrid();

        // Auto-recalcular puntos después de guardar
        setTimeout(() => recalculateAllPoints(), 500);

    } catch (err) {
        console.error('[ADMIN] Error guardando resultado:', err);
        toast('Error al guardar. Intenta de nuevo.', 'error');
    }
};

// ─── Calcular puntos de un pronóstico ───
function calculatePoints(prediction, result) {
    const p1 = prediction.t1;
    const p2 = prediction.t2;
    const r1 = result.t1;
    const r2 = result.t2;

    // Marcador exacto: 5 puntos
    if (p1 === r1 && p2 === r2) {
        return 5;
    }

    // Ganador correcto o empate: 3 o 2 puntos
    const predWinner = p1 > p2 ? 1 : (p1 < p2 ? 2 : 0); // 1=team1, 2=team2, 0=tie
    const realWinner = r1 > r2 ? 1 : (r1 < r2 ? 2 : 0);

    if (predWinner === realWinner) {
        return predWinner === 0 ? 2 : 3; // Empate acertado=2, Ganador=3
    }

    return 0;
}

// ─── Recalcular todos los puntos ───
window.recalculateAllPoints = async function() {
    try {
        toast('Recalculando puntos...', 'info');

        const snapshot = await getDocs(predictCol);
        let updated = 0;

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const predictions = data.predictions || {};
            let totalPoints = 0;
            let completedMatches = 0;

            // Calcular puntos para cada partido
            quarterFinals.forEach(match => {
                const pred = predictions[match.id];
                const result = matchResults[match.id];

                if (pred && pred.t1 !== '' && pred.t1 !== undefined &&
                    pred.t2 !== '' && pred.t2 !== undefined) {
                    completedMatches++;

                    // Si hay resultado real, calcular puntos
                    if (result && result.completed) {
                        totalPoints += calculatePoints(pred, result);
                    }
                }
            });

            // Actualizar documento con puntos calculados
            await setDoc(doc(predictCol, docSnap.id), {
                ...data,
                totalPoints: totalPoints,
                completedMatches: completedMatches,
                lastCalculated: serverTimestamp()
            }, { merge: true });

            updated++;
        }

        toast(`✅ ${updated} participantes actualizados`, 'success');
        console.log(`[ADMIN] Puntos recalculados para ${updated} usuarios`);

    } catch (err) {
        console.error('[ADMIN] Error recalculando puntos:', err);
        toast('Error al recalcular puntos', 'error');
    }
};