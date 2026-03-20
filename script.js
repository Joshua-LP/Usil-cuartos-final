/* ==================================================
   POLLADA FIFA 2026 – USIL
   Firebase Firestore + Tiempo Real
   ================================================== */

// ─── Firebase SDK (módulos) ───
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getFirestore, collection, doc, setDoc, getDoc, getDocs,
    onSnapshot, query, orderBy, serverTimestamp
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

// ─── Colecciones Firestore ───
const usersCol    = collection(db, 'users');
const predictCol  = collection(db, 'predictions');

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

// ─── Estado ───
let usilEmails = [];
let userData = { name:'', email:'', predictions:{} };

// ─── Inicialización ───
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('[INIT] Iniciando aplicación...');
        await loadEmailWhitelist();
        console.log('[INIT] Emails cargados');
        loadSession();
        console.log('[INIT] Sesión cargada');
        bindEvents();
        console.log('[INIT] Eventos vinculados');
        listenParticipantCount();
        console.log('[INIT] Listener de participantes activo');
        hideLoader();
        console.log('[INIT] App iniciada correctamente');
    } catch (error) {
        console.error('[ERROR FATAL]', error);
        hideLoader();
        toast('Error al iniciar la aplicación. Recarga la página.', 'error');
    }
});

// ─── Lista blanca de correos ───
async function loadEmailWhitelist() {
    try {
        console.log('[EMAILS] Cargando lista blanca...');
        const res = await fetch('usil_emails.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        usilEmails = await res.json();
        console.log(`[EMAILS] ${usilEmails.length} correos autorizados`);
    } catch (error) {
        console.warn('[EMAILS] No se pudo cargar usil_emails.json:', error);
        console.warn('[EMAILS] Se validará solo dominio @usil.edu.pe');
        usilEmails = [];
    }
}

// ─── Loader ───
function hideLoader() {
    const loader = document.getElementById('loader');
    setTimeout(() => loader.classList.add('hide'), 500);
    setTimeout(() => loader.style.display = 'none', 900);
}

// ─── Toast ───
function toast(msg, type = 'info') {
    const c = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => el.classList.add('removing'), 3000);
    setTimeout(() => el.remove(), 3400);
}

// ─── Eventos ───
function bindEvents() {
    const emailInput = document.getElementById('userEmail');
    emailInput.addEventListener('input', handleEmailInput);
    emailInput.addEventListener('blur', handleEmailInput);
    document.getElementById('userName').addEventListener('keypress', e => {
        if (e.key === 'Enter') emailInput.focus();
    });
    emailInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('btnStartPronos').addEventListener('click', handleLogin);

    document.getElementById('btnNavPronos').addEventListener('click', () => switchSection('matches'));
    document.getElementById('btnNavRanking').addEventListener('click', () => switchSection('ranking'));

    document.getElementById('btnSaveDraft').addEventListener('click', saveDraft);
    document.getElementById('btnSubmitPronos').addEventListener('click', submitPredictions);
    document.getElementById('btnCloseConfirm').addEventListener('click', closeModal);
    document.getElementById('btnLogout').addEventListener('click', handleLogout);

    document.getElementById('linkReglamento').addEventListener('click', e => {
        e.preventDefault();
        toast('Exacto: 5 pts | Ganador: 3 pts | Empate: 2 pts', 'info');
    });
    document.getElementById('linkContacto').addEventListener('click', e => {
        e.preventDefault();
        toast('Contacto: pollada@usil.edu.pe', 'info');
    });

    document.getElementById('modalConfirmation').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal();
    });
}

// ─── Validación USIL ───
function validateUSILEmail(email) {
    const cleaned = email.trim().toLowerCase();
    console.log(`[VALIDATION] Validating: "${cleaned}"`);

    // 1. Formato válido
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
        console.log('[VALIDATION] Invalid format');
        return { valid:false, reason:'Formato de correo inválido' };
    }

    // 2. Dominio USIL
    if (!cleaned.endsWith('@usil.edu.pe')) {
        console.log('[VALIDATION] Not USIL domain');
        return { valid:false, reason:'Solo se permiten correos @usil.edu.pe' };
    }

    // 3. Lista blanca (si está cargada)
    if (usilEmails.length > 0) {
        const found = usilEmails.includes(cleaned);
        console.log(`[VALIDATION] Checking in whitelist (${usilEmails.length} emails): ${found}`);
        if (!found) {
            return { valid:false, reason:'Este correo no está en el registro de personal USIL' };
        }
    } else {
        console.log('[VALIDATION] No whitelist loaded, allowing all @usil.edu.pe');
    }

    console.log('[VALIDATION] Email approved');
    return { valid:true, reason:'' };
}

function handleEmailInput() {
    const input = document.getElementById('userEmail');
    const icon  = document.getElementById('emailIcon');
    const hint  = document.getElementById('emailHint');
    const val   = input.value.trim().toLowerCase();

    input.classList.remove('input--valid','input--invalid');
    hint.classList.remove('hint--error','hint--ok');

    if (!val) {
        icon.textContent = '';
        hint.textContent = 'Debe ser un correo @usil.edu.pe registrado';
        return;
    }

    if (val.includes('@') && !val.endsWith('@usil.edu.pe')) {
        input.classList.add('input--invalid');
        icon.textContent = '';
        hint.textContent = 'Solo correos @usil.edu.pe';
        hint.classList.add('hint--error');
    } else if (val.endsWith('@usil.edu.pe')) {
        const r = validateUSILEmail(val);
        if (r.valid) {
            input.classList.add('input--valid');
            icon.textContent = '';
            hint.textContent = 'Correo verificado';
            hint.classList.add('hint--ok');
        } else {
            input.classList.add('input--invalid');
            icon.textContent = '';
            hint.textContent = r.reason;
            hint.classList.add('hint--error');
        }
    }
}

// ─── Login ───
async function handleLogin() {
    const name  = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim().toLowerCase();

    if (!name) { toast('Ingresa tu nombre completo','error'); return; }

    const r = validateUSILEmail(email);
    if (!r.valid) { toast(r.reason,'error'); return; }

    // Guardar usuario en Firestore
    try {
        const userDocRef = doc(usersCol, email);
        await setDoc(userDocRef, {
            name: name,
            email: email,
            lastLogin: serverTimestamp()
        }, { merge: true });
    } catch (err) {
        console.error('Error guardando usuario:', err);
        toast('Error de conexión. Intenta de nuevo.', 'error');
        return;
    }

    userData.name = name;
    userData.email = email;
    saveSession();
    showAppView();
    toast(`Bienvenido/a, ${name.split(' ')[0]}!`, 'success');
}

function handleLogout() {
    localStorage.removeItem('polladaUSIL_session');
    userData = { name:'', email:'', predictions:{} };
    document.getElementById('viewApp').style.display = 'none';
    document.getElementById('viewLogin').style.display = '';
    document.getElementById('headerNav').style.display = 'none';
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userEmail').classList.remove('input--valid','input--invalid');
    document.getElementById('emailHint').textContent = 'Debe ser un correo @usil.edu.pe registrado';
    document.getElementById('emailHint').classList.remove('hint--ok','hint--error');
    document.getElementById('emailIcon').textContent = '';
    toast('Sesión cerrada', 'info');
}

// ─── Sesión local (solo para recordar quién eres) ───
function saveSession() {
    localStorage.setItem('polladaUSIL_session', JSON.stringify({
        name: userData.name,
        email: userData.email
    }));
}

function loadSession() {
    const saved = localStorage.getItem('polladaUSIL_session');
    if (saved) {
        const s = JSON.parse(saved);
        if (s.name && s.email) {
            userData.name = s.name;
            userData.email = s.email;
            showAppView();
        }
    }
}

// ─── Vistas ───
async function showAppView() {
    document.getElementById('viewLogin').style.display = 'none';
    document.getElementById('viewApp').style.display = '';
    document.getElementById('headerNav').style.display = 'flex';

    document.getElementById('welcomeName').textContent = `Hola, ${userData.name.split(' ')[0]}`;
    document.getElementById('welcomeEmail').textContent = userData.email;

    const initials = userData.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
    document.getElementById('userAvatar').textContent = initials;

    renderMatches();
    await loadPredictionsFromFirestore();
    listenRankingRealTime();
    switchSection('matches');
}

function switchSection(section) {
    document.getElementById('sectionMatches').style.display  = section === 'matches' ? '' : 'none';
    document.getElementById('sectionRanking').style.display = section === 'ranking' ? '' : 'none';
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === section);
    });
}

// ─── Renderizar partidos ───
function renderMatches() {
    const grid = document.getElementById('matchesGrid');
    grid.innerHTML = '';

    quarterFinals.forEach(match => {
        const fDate = new Date(match.date + 'T00:00:00').toLocaleDateString('es-PE', {
            day:'numeric', month:'short'
        });
        const card = document.createElement('div');
        card.className = 'match-card';
        card.id = `card-${match.id}`;
        card.innerHTML = `
            <div class="match-top">
                <span class="match-label">${match.tag}</span>
                <span class="match-date">${fDate} · ${match.time} hrs</span>
            </div>
            <div class="match-teams">
                <div class="match-team">
                    <span class="match-team__flag">${match.team1.flag}</span>
                    <span class="match-team__name">${match.team1.name}</span>
                </div>
                <span class="match-vs">VS</span>
                <div class="match-team">
                    <span class="match-team__flag">${match.team2.flag}</span>
                    <span class="match-team__name">${match.team2.name}</span>
                </div>
            </div>
            <div class="match-scores">
                <input type="number" class="score-box" id="s1-${match.id}"
                       min="0" max="15" placeholder="-"
                       data-match="${match.id}" data-team="1">
                <span class="score-dash">&ndash;</span>
                <input type="number" class="score-box" id="s2-${match.id}"
                       min="0" max="15" placeholder="-"
                       data-match="${match.id}" data-team="2">
            </div>`;
        grid.appendChild(card);
    });

    grid.querySelectorAll('.score-box').forEach(input => {
        input.addEventListener('input', handleScore);
        input.addEventListener('focus', e => e.target.select());
    });
}

function handleScore(e) {
    const input = e.target;
    const matchId = input.dataset.match;
    const team = input.dataset.team;
    let val = parseInt(input.value);

    if (isNaN(val) || val < 0) val = '';
    else if (val > 15) { val = 15; input.value = 15; }

    if (!userData.predictions[matchId])
        userData.predictions[matchId] = { t1:'', t2:'' };

    userData.predictions[matchId][team === '1' ? 't1' : 't2'] = val;
    input.classList.toggle('has-value', val !== '');
    checkCardFilled(matchId);
}

function checkCardFilled(matchId) {
    const pred = userData.predictions[matchId];
    const card = document.getElementById(`card-${matchId}`);
    if (!card || !pred) return;
    card.classList.toggle('filled', pred.t1 !== '' && pred.t2 !== '');
}

// ─── Firestore: Cargar pronósticos del usuario ───
async function loadPredictionsFromFirestore() {
    try {
        const docRef = doc(predictCol, userData.email);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            userData.predictions = data.predictions || {};
            // Rellenar inputs
            quarterFinals.forEach(m => {
                const p = userData.predictions[m.id];
                if (!p) return;
                const s1 = document.getElementById(`s1-${m.id}`);
                const s2 = document.getElementById(`s2-${m.id}`);
                if (s1 && p.t1 !== '' && p.t1 !== undefined) { s1.value = p.t1; s1.classList.add('has-value'); }
                if (s2 && p.t2 !== '' && p.t2 !== undefined) { s2.value = p.t2; s2.classList.add('has-value'); }
                checkCardFilled(String(m.id));
            });
        }
    } catch (err) {
        console.error('Error cargando pronósticos:', err);
    }
}

// ─── Firestore: Guardar pronósticos ───
async function savePredictionsToFirestore() {
    try {
        const docRef = doc(predictCol, userData.email);
        await setDoc(docRef, {
            name: userData.name,
            email: userData.email,
            predictions: userData.predictions,
            updatedAt: serverTimestamp()
        }, { merge: true });
        return true;
    } catch (err) {
        console.error('Error guardando:', err);
        toast('Error al guardar. Revisa tu conexión.', 'error');
        return false;
    }
}

async function saveDraft() {
    const ok = await savePredictionsToFirestore();
    if (ok) toast('Borrador guardado en la nube', 'success');
}

async function submitPredictions() {
    const missing = quarterFinals.filter(m => {
        const p = userData.predictions[m.id];
        return !p || p.t1 === '' || p.t1 === undefined || p.t2 === '' || p.t2 === undefined;
    });

    if (missing.length > 0) {
        toast(`Faltan ${missing.length} partido(s) por completar`, 'error');
        const first = document.getElementById(`s1-${missing[0].id}`);
        if (first) first.focus();
        return;
    }

    const ok = await savePredictionsToFirestore();
    if (ok) {
        document.getElementById('modalConfirmation').classList.add('show');
    }
}

function closeModal() {
    document.getElementById('modalConfirmation').classList.remove('show');
}

// ─── Firestore: Contador de participantes (tiempo real) ───
function listenParticipantCount() {
    onSnapshot(usersCol, (snapshot) => {
        const count = snapshot.size;
        document.getElementById('totalPlayers').textContent = count;
    });
}

// ─── Firestore: Ranking en TIEMPO REAL ───
function listenRankingRealTime() {
    onSnapshot(predictCol, (snapshot) => {
        const participants = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const preds = data.predictions || {};

            // Contar pronósticos completados
            let completedCount = 0;
            quarterFinals.forEach(m => {
                const p = preds[m.id];
                if (p && p.t1 !== '' && p.t1 !== undefined && p.t2 !== '' && p.t2 !== undefined) {
                    completedCount++;
                }
            });

            // Puntos = se calcularán cuando haya resultados oficiales.
            // Por ahora mostramos completados como métrica.
            participants.push({
                name: data.name || data.email,
                email: data.email,
                completed: completedCount,
                points: completedCount * 5  // Placeholder hasta resultados reales
            });
        });

        // Ordenar por puntos (desc), luego completados
        participants.sort((a, b) => b.points - a.points || b.completed - a.completed);
        renderRanking(participants);
    });
}

function renderRanking(participants) {
    // Podium (top 3)
    const podium = document.getElementById('rankingPodium');
    podium.innerHTML = '';

    if (participants.length >= 3) {
        const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
        podiumOrder.forEach(idx => {
            const p = participants[idx];
            if (!p) return;
            const pos = idx + 1;
            const div = document.createElement('div');
            div.className = `podium-item podium-item--${pos}`;
            const displayName = p.name.split(' ').slice(0, 2).join(' ');
            div.innerHTML = `
                <div class="podium-item__pos">${pos}</div>
                <div class="podium-item__name">${displayName}</div>
                <div class="podium-item__pts">${p.points} pts</div>`;
            podium.appendChild(div);
        });
    }

    // Tabla completa
    const tbody = document.getElementById('rankingBody');
    tbody.innerHTML = '';

    if (participants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:2rem;">Aún no hay participantes</td></tr>';
        return;
    }

    participants.forEach((p, i) => {
        const tr = document.createElement('tr');
        const isMe = p.email === userData.email;
        if (isMe) tr.style.background = 'rgba(201,169,97,0.08)';
        const displayName = isMe ? `${p.name} (Tú)` : p.name;
        tr.innerHTML = `
            <td class="pos-cell">${i + 1}</td>
            <td>${displayName}</td>
            <td>${p.completed}/8</td>
            <td class="pts-cell">${p.points}</td>`;
        tbody.appendChild(tr);
    });
}
