/* ==================================================
   POLLA FIFA 2026 – USIL
   Firebase Firestore + Tiempo Real
   Partidos dinámicos – Admin multiusuario
   ================================================== */

// ─── Firebase SDK (módulos) ───
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc,
    onSnapshot, query, orderBy, serverTimestamp, updateDoc, arrayUnion, arrayRemove
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
const matchesCol  = collection(db, 'matches');
const resultsCol  = collection(db, 'results');

// ─── Lista de países con banderas ───
const COUNTRIES = [
    {name:'Alemania',flag:'🇩🇪'},{name:'Arabia Saudita',flag:'🇸🇦'},{name:'Argentina',flag:'🇦🇷'},
    {name:'Australia',flag:'🇦🇺'},{name:'Bélgica',flag:'🇧🇪'},{name:'Brasil',flag:'🇧🇷'},
    {name:'Camerún',flag:'🇨🇲'},{name:'Canadá',flag:'🇨🇦'},{name:'Chile',flag:'🇨🇱'},
    {name:'Colombia',flag:'🇨🇴'},{name:'Corea del Sur',flag:'🇰🇷'},{name:'Costa Rica',flag:'🇨🇷'},
    {name:'Croacia',flag:'🇭🇷'},{name:'Dinamarca',flag:'🇩🇰'},{name:'Ecuador',flag:'🇪🇨'},
    {name:'Egipto',flag:'🇪🇬'},{name:'España',flag:'🇪🇸'},{name:'Estados Unidos',flag:'🇺🇸'},
    {name:'Francia',flag:'🇫🇷'},{name:'Ghana',flag:'🇬🇭'},{name:'Grecia',flag:'🇬🇷'},
    {name:'Inglaterra',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿'},{name:'Irán',flag:'🇮🇷'},{name:'Italia',flag:'🇮🇹'},
    {name:'Jamaica',flag:'🇯🇲'},{name:'Japón',flag:'🇯🇵'},{name:'Marruecos',flag:'🇲🇦'},
    {name:'México',flag:'🇲🇽'},{name:'Nigeria',flag:'🇳🇬'},{name:'Noruega',flag:'🇳🇴'},
    {name:'Países Bajos',flag:'🇳🇱'},{name:'Panamá',flag:'🇵🇦'},{name:'Paraguay',flag:'🇵🇾'},
    {name:'Perú',flag:'🇵🇪'},{name:'Polonia',flag:'🇵🇱'},{name:'Portugal',flag:'🇵🇹'},
    {name:'Qatar',flag:'🇶🇦'},{name:'Rusia',flag:'🇷🇺'},{name:'Senegal',flag:'🇸🇳'},
    {name:'Serbia',flag:'🇷🇸'},{name:'Suecia',flag:'🇸🇪'},{name:'Suiza',flag:'🇨🇭'},
    {name:'Túnez',flag:'🇹🇳'},{name:'Turquía',flag:'🇹🇷'},{name:'Uruguay',flag:'🇺🇾'},
    {name:'Venezuela',flag:'🇻🇪'},
];

// ─── Admin: Super admin + admins dinámicos ───
const SUPER_ADMIN = 'jlopezp@usil.edu.pe';
let adminEmails = [SUPER_ADMIN]; // Se carga desde Firestore

function isAdmin() {
    return adminEmails.includes(userData.email);
}

// ─── Estado ───
let usilEmails = [];
let emailsLoaded = false;
let userData = { name:'', email:'', predictions:{} };
let allMatches = [];
let matchResults = {};
let pointsRevealed = false; // ¿Se han revelado los puntos?
let currentFilter = 'today';

// ─── Funciones de tiempo ───
function getMatchDateTime(match) { return new Date(match.datetime); }

function canPredictMatch(match) {
    const now = new Date();
    const cutoff = new Date(getMatchDateTime(match).getTime() - 30 * 60 * 1000);
    return now < cutoff;
}

function getMatchStatus(match) {
    const now = new Date();
    const mt = getMatchDateTime(match);
    const end = new Date(mt.getTime() + 2 * 60 * 60 * 1000);
    if (matchResults[match.id] && matchResults[match.id].completed) return 'finalizado';
    if (now >= mt && now < end) return 'en_curso';
    if (now >= mt) return 'finalizado';
    if (now >= new Date(mt.getTime() - 30 * 60 * 1000)) return 'proximo';
    return 'pendiente';
}

function getMatchesForDate(date) {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    return allMatches.filter(m => {
        const t = getMatchDateTime(m);
        return t >= dayStart && t < dayEnd;
    });
}

function getMatchesForToday() { return getMatchesForDate(new Date()); }

function getTimeUntilMatch(match) {
    const diff = getMatchDateTime(match) - new Date();
    if (diff < 0) return 'Iniciado';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return `En ${d}d ${h}h`;
    if (h > 0) return `En ${h}h ${m}m`;
    if (m > 0) return `En ${m} min`;
    return 'Por iniciar';
}

// ─── Inicialización ───
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadEmailWhitelist();
        await loadAdminList();
        await loadMatchesFromFirestore();
        await loadMatchResults();
        await loadPointsRevealStatus();
        loadSession();
        bindEvents();
        listenParticipantCount();
        listenMatchResults();
        listenMatchesRealTime();
        listenAdminList();
        listenPointsReveal();
        startMatchStatusUpdater();
        hideLoader();
        console.log('[INIT] App lista');
    } catch (error) {
        console.error('[ERROR FATAL]', error);
        hideLoader();
        toast('Error al iniciar. Recarga la página.', 'error');
    }
});

// ─── Cargar lista de admins desde Firestore ───
async function loadAdminList() {
    try {
        const snap = await getDoc(doc(db, 'config', 'admins'));
        if (snap.exists()) {
            const data = snap.data();
            adminEmails = data.emails || [SUPER_ADMIN];
            if (!adminEmails.includes(SUPER_ADMIN)) adminEmails.push(SUPER_ADMIN);
        } else {
            // Crear el documento inicial
            await setDoc(doc(db, 'config', 'admins'), { emails: [SUPER_ADMIN] });
        }
    } catch (err) {
        console.warn('[ADMINS] Error cargando admins:', err);
        adminEmails = [SUPER_ADMIN];
    }
}

function listenAdminList() {
    onSnapshot(doc(db, 'config', 'admins'), (snap) => {
        if (snap.exists()) {
            adminEmails = snap.data().emails || [SUPER_ADMIN];
            if (!adminEmails.includes(SUPER_ADMIN)) adminEmails.push(SUPER_ADMIN);
            // Actualizar visibilidad botón admin
            const btnAdmin = document.getElementById('btnNavAdmin');
            if (btnAdmin) btnAdmin.style.display = isAdmin() ? '' : 'none';
        }
    });
}

// ─── Estado de revelación de puntos ───
async function loadPointsRevealStatus() {
    try {
        const snap = await getDoc(doc(db, 'config', 'points'));
        if (snap.exists()) {
            pointsRevealed = snap.data().revealed || false;
        }
    } catch (err) {
        console.warn('[POINTS] Error cargando estado:', err);
    }
}

function listenPointsReveal() {
    onSnapshot(doc(db, 'config', 'points'), (snap) => {
        if (snap.exists()) {
            const wasRevealed = pointsRevealed;
            pointsRevealed = snap.data().revealed || false;
            // Si cambia, re-renderizar ranking
            if (wasRevealed !== pointsRevealed) {
                if (document.getElementById('sectionRanking')?.style.display !== 'none') {
                    // El ranking se actualiza automáticamente via listener
                }
                if (document.getElementById('sectionMatches')?.style.display !== 'none') {
                    renderMatches();
                }
            }
        }
    });
}

// ─── Cargar partidos desde Firestore ───
async function loadMatchesFromFirestore() {
    try {
        const snap = await getDocs(matchesCol);
        allMatches = [];
        snap.forEach(d => {
            const data = d.data();
            allMatches.push({ id: d.id, ...data });
        });
        allMatches.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        console.log(`[MATCHES] ${allMatches.length} partidos cargados`);
    } catch (err) {
        console.warn('[MATCHES] Error cargando partidos:', err);
    }
}

function listenMatchesRealTime() {
    onSnapshot(matchesCol, (snap) => {
        allMatches = [];
        snap.forEach(d => allMatches.push({ id: d.id, ...d.data() }));
        allMatches.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        if (document.getElementById('viewApp').style.display !== 'none') {
            renderMatches();
        }
    });
}

function startMatchStatusUpdater() {
    setInterval(() => {
        if (document.getElementById('sectionMatches')?.style.display !== 'none') {
            renderMatches();
        }
    }, 60000);
}

// ─── Lista blanca de correos ───
async function loadEmailWhitelist() {
    try {
        const res = await fetch('usil_emails.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const emails = await res.json();
        if (!Array.isArray(emails)) throw new Error('Invalid');
        usilEmails = emails.map(e => e.trim().toLowerCase());
        emailsLoaded = true;
        const emailInput = document.getElementById('userEmail');
        if (emailInput?.value.trim()) setTimeout(() => handleEmailInput(), 100);
    } catch (e) {
        usilEmails = [];
        emailsLoaded = true;
    }
}

// ─── Cargar resultados ───
async function loadMatchResults() {
    try {
        const snap = await getDocs(resultsCol);
        snap.forEach(d => { matchResults[d.id] = d.data(); });
    } catch (e) {
        console.warn('[RESULTS] Error:', e);
    }
}

function listenMatchResults() {
    onSnapshot(resultsCol, (snap) => {
        snap.docChanges().forEach(ch => {
            if (ch.type === 'added' || ch.type === 'modified') {
                matchResults[ch.doc.id] = ch.doc.data();
            }
        });
        if (document.getElementById('sectionMatches')?.style.display !== 'none') {
            renderMatches();
        }
    });
}

// ─── Loader / Toast ───
function hideLoader() {
    const l = document.getElementById('loader');
    setTimeout(() => l.classList.add('hide'), 500);
    setTimeout(() => l.style.display = 'none', 900);
}

let activeToasts = new Set();
function toast(msg, type = 'info') {
    if (activeToasts.has(msg)) return;
    activeToasts.add(msg);
    const c = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => { el.classList.add('removing'); activeToasts.delete(msg); }, 3000);
    setTimeout(() => el.remove(), 3400);
}

// ─── Eventos ───
function bindEvents() {
    const emailInput = document.getElementById('userEmail');
    emailInput.addEventListener('input', handleEmailInput);
    document.getElementById('userName').addEventListener('keypress', e => { if (e.key === 'Enter') emailInput.focus(); });
    emailInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });
    document.getElementById('btnStartPronos').addEventListener('click', handleLogin);

    document.getElementById('btnNavPronos').addEventListener('click', () => switchSection('matches'));
    document.getElementById('btnNavRanking').addEventListener('click', () => switchSection('ranking'));
    document.getElementById('btnNavAdmin').addEventListener('click', () => switchSection('admin'));

    document.getElementById('btnSaveDraft').addEventListener('click', saveDraft);
    document.getElementById('btnSubmitPronos').addEventListener('click', submitPredictions);
    document.getElementById('btnCloseConfirm').addEventListener('click', closeModal);
    document.getElementById('btnLogout').addEventListener('click', handleLogout);

    document.getElementById('btnEditName').addEventListener('click', openEditNameModal);
    document.getElementById('btnSaveEditName').addEventListener('click', saveEditName);
    document.getElementById('btnCancelEditName').addEventListener('click', closeEditNameModal);
    document.getElementById('modalEditName').addEventListener('click', e => { if (e.target === e.currentTarget) closeEditNameModal(); });

    // Filtros de partidos
    document.getElementById('filterToday').addEventListener('click', () => setFilter('today'));
    document.getElementById('filterAll').addEventListener('click', () => setFilter('all'));
    document.getElementById('filterUpcoming').addEventListener('click', () => setFilter('upcoming'));

    document.getElementById('linkReglamento').addEventListener('click', e => { e.preventDefault(); toast('Exacto: 5 pts | Ganador: 3 pts | Empate: 2 pts', 'info'); });
    document.getElementById('linkContacto').addEventListener('click', e => { e.preventDefault(); toast('Contacto: polla@usil.edu.pe', 'info'); });
    document.getElementById('modalConfirmation').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
    renderMatches();
}

// ─── Validación USIL ───
function validateUSILEmail(email) {
    const cleaned = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return { valid:false, reason:'Formato de correo inválido' };
    if (!cleaned.endsWith('@usil.edu.pe')) return { valid:false, reason:'Solo se permiten correos @usil.edu.pe' };
    if (!emailsLoaded) return { valid:false, reason:'Cargando lista de correos...' };
    if (usilEmails.length > 0 && !usilEmails.includes(cleaned)) return { valid:false, reason:'Correo no registrado en USIL' };
    return { valid:true, reason:'' };
}

let emailValidationTimeout;
function handleEmailInput() {
    const input = document.getElementById('userEmail');
    const icon  = document.getElementById('emailIcon');
    const hint  = document.getElementById('emailHint');
    const val   = input.value.trim().toLowerCase();
    if (emailValidationTimeout) clearTimeout(emailValidationTimeout);
    input.classList.remove('input--valid','input--invalid');
    hint.classList.remove('hint--error','hint--ok');
    if (!val) { icon.textContent = ''; hint.textContent = 'Debe ser un correo @usil.edu.pe registrado'; return; }
    if (!emailsLoaded) { hint.textContent = 'Cargando lista...'; return; }
    emailValidationTimeout = setTimeout(() => {
        if (val.includes('@') && !val.endsWith('@usil.edu.pe')) {
            input.classList.add('input--invalid'); hint.textContent = 'Solo correos @usil.edu.pe'; hint.classList.add('hint--error');
        } else if (val.endsWith('@usil.edu.pe')) {
            const r = validateUSILEmail(val);
            if (r.valid) { input.classList.add('input--valid'); hint.textContent = 'Correo verificado ✓'; hint.classList.add('hint--ok'); }
            else { input.classList.add('input--invalid'); hint.textContent = r.reason; hint.classList.add('hint--error'); }
        }
    }, 300);
}

// ─── Login / Logout / Session ───
async function handleLogin() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim().toLowerCase();
    if (!name) { toast('Ingresa tu nombre completo','error'); return; }
    const r = validateUSILEmail(email);
    if (!r.valid) { toast(r.reason,'error'); return; }
    try {
        await setDoc(doc(usersCol, email), { name, email, lastLogin: serverTimestamp() }, { merge: true });
    } catch (err) { toast('Error de conexión.', 'error'); return; }
    userData.name = name; userData.email = email;
    saveSession(); showAppView();
    toast(`¡Bienvenido/a, ${name.split(' ')[0]}!`, 'success');
}

function handleLogout() {
    localStorage.removeItem('pollaUSIL_session');
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

function saveSession() {
    localStorage.setItem('pollaUSIL_session', JSON.stringify({ name: userData.name, email: userData.email }));
}

function loadSession() {
    const saved = localStorage.getItem('pollaUSIL_session');
    if (saved) {
        const s = JSON.parse(saved);
        if (s.name && s.email) { userData.name = s.name; userData.email = s.email; showAppView(); }
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
    document.getElementById('btnNavAdmin').style.display = isAdmin() ? '' : 'none';

    renderMatches();
    await loadPredictionsFromFirestore();
    listenRankingRealTime();
    switchSection('matches');
}

function switchSection(section) {
    document.getElementById('sectionMatches').style.display = section === 'matches' ? '' : 'none';
    document.getElementById('sectionRanking').style.display = section === 'ranking' ? '' : 'none';
    document.getElementById('sectionAdmin').style.display = section === 'admin' ? '' : 'none';
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.section === section));
    if (section === 'admin' && isAdmin()) renderAdminPanel();
}

// ═══════════════════════════════════════════════════
// RENDERIZAR PARTIDOS (VISTA USUARIO)
// Los usuarios SOLO ven: equipos, fecha, hora
// + sus inputs de pronóstico (si el partido aún no cerró)
// + resultado real SOLO si pointsRevealed = true
// ═══════════════════════════════════════════════════
function renderMatches() {
    const grid = document.getElementById('matchesGrid');
    grid.innerHTML = '';
    const infoDiv = document.getElementById('todayMatchesInfo');

    let matchesToShow = [];
    const now = new Date();

    if (currentFilter === 'today') {
        matchesToShow = getMatchesForToday();
    } else if (currentFilter === 'upcoming') {
        matchesToShow = allMatches.filter(m => getMatchDateTime(m) > now);
    } else {
        matchesToShow = [...allMatches];
    }

    // Info banner
    const todayMatches = getMatchesForToday();
    if (todayMatches.length > 0) {
        const available = todayMatches.filter(m => canPredictMatch(m));
        const todayStr = now.toLocaleDateString('es-PE', { weekday:'long', day:'numeric', month:'long' });
        infoDiv.innerHTML = `<div class="info-banner"><span class="info-icon">⚽</span> <strong>Hoy (${todayStr})</strong>: ${todayMatches.length} partido(s), ${available.length} disponible(s)</div>`;
        infoDiv.style.display = 'block';
    } else if (allMatches.length === 0) {
        infoDiv.innerHTML = `<div class="info-banner"><span class="info-icon">📋</span> No hay partidos programados aún. El administrador los agregará pronto.</div>`;
        infoDiv.style.display = 'block';
    } else {
        const todayStr = now.toLocaleDateString('es-PE', { weekday:'long', day:'numeric', month:'long' });
        infoDiv.innerHTML = `<div class="info-banner"><span class="info-icon">📅</span> No hay partidos hoy (${todayStr}). Usa los filtros para ver otros días.</div>`;
        infoDiv.style.display = 'block';
    }

    if (matchesToShow.length === 0 && currentFilter === 'today') {
        grid.innerHTML = `<div class="empty-state">
            <div style="font-size:3rem;">📅</div>
            <p>No hay partidos programados para hoy</p>
            <button class="btn-outline-sm" onclick="document.getElementById('filterAll').click()">Ver todos los partidos</button>
        </div>`;
        return;
    }

    if (matchesToShow.length === 0) {
        grid.innerHTML = `<div class="empty-state"><div style="font-size:3rem;">📋</div><p>No hay partidos disponibles</p></div>`;
        return;
    }

    matchesToShow.forEach(match => {
        const mt = getMatchDateTime(match);
        const fDate = mt.toLocaleDateString('es-PE', { day:'numeric', month:'short' });
        const fTime = mt.toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit', hour12:false });
        const status = getMatchStatus(match);
        const canPred = canPredictMatch(match);
        const timeUntil = getTimeUntilMatch(match);
        const result = matchResults[match.id];

        const statusCfg = {
            'pendiente': { label: timeUntil, cls: 'pendiente', icon: '⏱️' },
            'proximo': { label: '¡Próximo!', cls: 'proximo', icon: '⚠️' },
            'en_curso': { label: 'En curso', cls: 'en_curso', icon: '🔴' },
            'finalizado': { label: 'Finalizado', cls: 'finalizado', icon: '✓' }
        };
        const si = statusCfg[status] || statusCfg['pendiente'];

        // Mostrar resultado real SOLO si puntos fueron revelados
        const showResult = pointsRevealed && result?.completed;

        // Calcular puntos individuales de este partido si están revelados
        let pointsBadge = '';
        if (showResult) {
            const pred = userData.predictions[match.id];
            const pts = calculatePoints(pred, result);
            if (pts === 5) pointsBadge = '<span class="points-badge points-badge--exact">+5 pts (Exacto!)</span>';
            else if (pts === 3) pointsBadge = '<span class="points-badge points-badge--winner">+3 pts (Ganador)</span>';
            else if (pts === 2) pointsBadge = '<span class="points-badge points-badge--draw">+2 pts (Empate)</span>';
            else pointsBadge = '<span class="points-badge points-badge--miss">+0 pts</span>';
        }

        const card = document.createElement('div');
        card.className = `match-card match-card--${status}`;
        card.id = `card-${match.id}`;
        card.innerHTML = `
            <div class="match-top">
                <span class="match-label">${match.tag || 'Partido'}</span>
                <span class="match-date">${fDate} · ${fTime}</span>
            </div>
            <div class="match-status">
                <span class="match-status-badge match-status-badge--${si.cls}">${si.icon} ${si.label}</span>
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
            ${showResult ? `
                <div class="match-real-result">
                    <span class="real-result-label">Resultado Real</span>
                    <span class="real-result-score">${result.t1} - ${result.t2}</span>
                </div>
                ${pointsBadge}
            ` : ''}
            <div class="match-scores">
                <label class="score-label">Tu pronóstico:</label>
                <div class="score-inputs">
                    <input type="number" class="score-box" id="s1-${match.id}" min="0" max="15" placeholder="-" data-match="${match.id}" data-team="1" ${!canPred ? 'disabled' : ''}>
                    <span class="score-dash">&ndash;</span>
                    <input type="number" class="score-box" id="s2-${match.id}" min="0" max="15" placeholder="-" data-match="${match.id}" data-team="2" ${!canPred ? 'disabled' : ''}>
                </div>
            </div>
            ${!canPred ? '<div class="match-locked">🔒 Pronóstico cerrado</div>' : ''}`;
        grid.appendChild(card);
    });

    // Rellenar pronósticos existentes
    matchesToShow.forEach(m => {
        const p = userData.predictions[m.id];
        if (!p) return;
        const s1 = document.getElementById(`s1-${m.id}`);
        const s2 = document.getElementById(`s2-${m.id}`);
        if (s1 && p.t1 !== '' && p.t1 !== undefined) { s1.value = p.t1; s1.classList.add('has-value'); }
        if (s2 && p.t2 !== '' && p.t2 !== undefined) { s2.value = p.t2; s2.classList.add('has-value'); }
        checkCardFilled(String(m.id));
    });

    grid.querySelectorAll('.score-box').forEach(input => {
        input.addEventListener('input', handleScore);
        input.addEventListener('focus', e => { e.target.select(); e.target.closest('.match-card').classList.add('match-card--focused'); });
        input.addEventListener('blur', e => { e.target.closest('.match-card').classList.remove('match-card--focused'); });
    });
}

function handleScore(e) {
    const input = e.target;
    const matchId = input.dataset.match;
    const team = input.dataset.team;
    let val = parseInt(input.value);
    if (isNaN(val) || val < 0) val = '';
    else if (val > 15) { val = 15; input.value = 15; }
    if (!userData.predictions[matchId]) userData.predictions[matchId] = { t1:'', t2:'' };
    userData.predictions[matchId][team === '1' ? 't1' : 't2'] = val;
    input.classList.toggle('has-value', val !== '');
    const card = input.closest('.match-card');
    card.classList.add('match-card--pulse');
    setTimeout(() => card.classList.remove('match-card--pulse'), 300);
    checkCardFilled(matchId);
}

function checkCardFilled(matchId) {
    const pred = userData.predictions[matchId];
    const card = document.getElementById(`card-${matchId}`);
    if (!card || !pred) return;
    card.classList.toggle('filled', pred.t1 !== '' && pred.t2 !== '');
}

// ─── Firestore: Pronósticos ───
async function loadPredictionsFromFirestore() {
    try {
        const snap = await getDoc(doc(predictCol, userData.email));
        if (snap.exists()) {
            userData.predictions = snap.data().predictions || {};
            renderMatches();
        }
    } catch (err) { console.error('Error cargando pronósticos:', err); }
}

async function savePredictionsToFirestore() {
    try {
        await setDoc(doc(predictCol, userData.email), {
            name: userData.name, email: userData.email,
            predictions: userData.predictions, updatedAt: serverTimestamp()
        }, { merge: true });
        return true;
    } catch (err) { toast('Error al guardar.', 'error'); return false; }
}

async function saveDraft() { if (await savePredictionsToFirestore()) toast('Borrador guardado', 'success'); }

async function submitPredictions() {
    const todayM = currentFilter === 'today' ? getMatchesForToday() : allMatches;
    const predictable = todayM.filter(m => canPredictMatch(m));
    const missing = predictable.filter(m => {
        const p = userData.predictions[m.id];
        return !p || p.t1 === '' || p.t1 === undefined || p.t2 === '' || p.t2 === undefined;
    });
    if (missing.length > 0) {
        toast(`Faltan ${missing.length} partido(s) por completar`, 'error');
        const first = document.getElementById(`s1-${missing[0].id}`);
        if (first) first.focus();
        return;
    }
    if (await savePredictionsToFirestore()) {
        document.getElementById('modalConfirmation').classList.add('show');
    }
}

function closeModal() { document.getElementById('modalConfirmation').classList.remove('show'); }

// ─── Ranking ───
function listenParticipantCount() {
    onSnapshot(usersCol, (snap) => { document.getElementById('totalPlayers').textContent = snap.size; });
}

function listenRankingRealTime() {
    onSnapshot(predictCol, (snap) => {
        const participants = [];
        snap.forEach(d => {
            const data = d.data();
            const preds = data.predictions || {};
            let completed = 0;
            allMatches.forEach(m => {
                const p = preds[m.id];
                if (p && p.t1 !== '' && p.t1 !== undefined && p.t2 !== '' && p.t2 !== undefined) completed++;
            });
            participants.push({
                name: data.name || data.email,
                email: data.email,
                completed,
                points: data.totalPoints || 0
            });
        });
        participants.sort((a, b) => b.points - a.points || b.completed - a.completed);
        renderRanking(participants);
    });
}

function renderRanking(participants) {
    const podium = document.getElementById('rankingPodium');
    podium.innerHTML = '';
    const totalM = allMatches.length || '?';

    // Si los puntos NO están revelados, mostrar mensaje de espera
    if (!pointsRevealed) {
        podium.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--gray-500);">
            <div style="font-size:3rem;">🔒</div>
            <div style="font-weight:600;margin-top:0.5rem;">Puntos aún no revelados</div>
            <p style="font-size:0.85rem;margin-top:0.5rem;">El administrador revelará los puntos cuando los resultados estén listos.</p>
        </div>`;
    } else {
        const hasPoints = participants.some(p => p.points > 0);
        if (participants.length >= 3 && hasPoints) {
            [1, 0, 2].forEach(idx => {
                const p = participants[idx]; if (!p) return;
                const pos = idx + 1;
                const div = document.createElement('div');
                div.className = `podium-item podium-item--${pos}`;
                div.innerHTML = `<div class="podium-item__pos">${pos===1?'🥇':pos===2?'🥈':'🥉'}</div>
                    <div class="podium-item__name">${p.name.split(' ').slice(0,2).join(' ')}</div>
                    <div class="podium-item__pts">${p.points} pts</div>`;
                podium.appendChild(div);
            });
        } else {
            podium.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--gray-500);">
                <div style="font-size:3rem;">⏳</div><div style="font-weight:600;">Esperando resultados...</div></div>`;
        }
    }

    const tbody = document.getElementById('rankingBody');
    tbody.innerHTML = '';
    if (!participants.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:2rem;">Sin participantes</td></tr>';
        return;
    }

    participants.forEach((p, i) => {
        const tr = document.createElement('tr');
        const isMe = p.email === userData.email;
        if (isMe) tr.style.background = 'rgba(201,169,97,0.08)';
        let pos = `${i+1}`;
        const hasPoints = pointsRevealed && participants.some(pp => pp.points > 0);
        if (hasPoints && i === 0) pos = '🥇';
        else if (hasPoints && i === 1) pos = '🥈';
        else if (hasPoints && i === 2) pos = '🥉';
        const ptsDisplay = pointsRevealed ? `<strong>${p.points}</strong> pts` : '🔒';
        tr.innerHTML = `<td class="pos-cell">${pos}</td><td>${isMe ? p.name+' (Tú)' : p.name}</td>
            <td>${p.completed}/${totalM}</td><td class="pts-cell">${ptsDisplay}</td>`;
        tbody.appendChild(tr);
    });
}

// ─── Editar nombre ───
function openEditNameModal() {
    document.getElementById('editNameInput').value = userData.name;
    document.getElementById('modalEditName').classList.add('show');
    setTimeout(() => document.getElementById('editNameInput').focus(), 100);
}
function closeEditNameModal() { document.getElementById('modalEditName').classList.remove('show'); }

async function saveEditName() {
    const newName = document.getElementById('editNameInput').value.trim();
    if (!newName) { toast('Ingresa un nombre válido', 'error'); return; }
    try {
        await setDoc(doc(usersCol, userData.email), { name: newName }, { merge: true });
        await setDoc(doc(predictCol, userData.email), { name: newName }, { merge: true });
        userData.name = newName; saveSession();
        document.getElementById('welcomeName').textContent = `Hola, ${newName.split(' ')[0]}`;
        document.getElementById('userAvatar').textContent = newName.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
        closeEditNameModal(); toast('Nombre actualizado', 'success');
    } catch (err) { toast('Error al actualizar', 'error'); }
}

// ═══════════════════════════════════════════════════
// ADMIN PANEL
// ═══════════════════════════════════════════════════

function renderAdminPanel() {
    if (!isAdmin()) return;
    renderAdminAddMatch();
    renderAdminMatchList();
    renderAdminManagers();
    renderRevealButton();
}

// ─── Admin: Formulario para agregar partido ───
function renderAdminAddMatch() {
    const form = document.getElementById('adminAddMatchForm');
    if (!form) return;

    const options = COUNTRIES.map(c => `<option value="${c.name}" data-flag="${c.flag}">${c.flag} ${c.name}</option>`).join('');

    form.innerHTML = `
        <div class="admin-add-grid">
            <div class="admin-add-field">
                <label>Equipo 1</label>
                <select id="addTeam1" class="admin-select">${options}</select>
            </div>
            <div class="admin-add-vs">VS</div>
            <div class="admin-add-field">
                <label>Equipo 2</label>
                <select id="addTeam2" class="admin-select">${options}</select>
            </div>
            <div class="admin-add-field">
                <label>Fecha</label>
                <input type="date" id="addMatchDate" class="admin-input">
            </div>
            <div class="admin-add-field">
                <label>Hora</label>
                <input type="time" id="addMatchTime" class="admin-input" value="15:00">
            </div>
            <div class="admin-add-field">
                <label>Etiqueta</label>
                <input type="text" id="addMatchTag" class="admin-input" placeholder="Ej: QF1, SF1...">
            </div>
        </div>
        <button class="btn-gold btn-full" id="btnAddMatch" style="margin-top:1rem;">
            + Agregar partido
        </button>
    `;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('addMatchDate').value = today;
    document.getElementById('btnAddMatch').addEventListener('click', addNewMatch);
}

// ─── Admin: Agregar partido a Firestore ───
async function addNewMatch() {
    const team1Name = document.getElementById('addTeam1').value;
    const team2Name = document.getElementById('addTeam2').value;
    const date = document.getElementById('addMatchDate').value;
    const time = document.getElementById('addMatchTime').value;
    const tag = document.getElementById('addMatchTag').value.trim() || `P${allMatches.length + 1}`;

    if (!date || !time) { toast('Selecciona fecha y hora', 'error'); return; }
    if (team1Name === team2Name) { toast('Elige equipos diferentes', 'error'); return; }

    const team1 = COUNTRIES.find(c => c.name === team1Name);
    const team2 = COUNTRIES.find(c => c.name === team2Name);
    const datetime = `${date}T${time}:00`;
    const matchId = `match_${Date.now()}`;

    try {
        await setDoc(doc(matchesCol, matchId), {
            tag, datetime,
            team1: { name: team1.name, flag: team1.flag },
            team2: { name: team2.name, flag: team2.flag },
            createdBy: userData.email,
            createdAt: serverTimestamp()
        });
        toast(`Partido ${tag} creado: ${team1.flag} ${team1.name} vs ${team2.name} ${team2.flag}`, 'success');
        renderAdminPanel();
    } catch (err) {
        console.error('[ADMIN] Error creando partido:', err);
        toast('Error al crear partido', 'error');
    }
}

// ─── Admin: Lista de partidos con resultados (SOLO admin ve inputs de resultado) ───
function renderAdminMatchList() {
    const grid = document.getElementById('adminResultsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (allMatches.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div style="font-size:3rem;">📋</div><p>No hay partidos. Agrega el primero arriba.</p></div>';
        return;
    }

    allMatches.forEach(match => {
        const mt = getMatchDateTime(match);
        const fDate = mt.toLocaleDateString('es-PE', { weekday:'short', day:'numeric', month:'short' });
        const fTime = mt.toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit', hour12:false });
        const result = matchResults[match.id] || {};

        const card = document.createElement('div');
        card.className = `admin-result-card ${result.completed ? 'admin-result-card--done' : ''}`;
        card.innerHTML = `
            <div class="admin-result-header">
                <span class="match-label">${match.tag || 'Partido'}</span>
                <span class="match-date">${fDate} · ${fTime}</span>
                <span class="admin-status-badge ${result.completed ? 'admin-status--done' : 'admin-status--pending'}">
                    ${result.completed ? '✓ Resultado guardado' : 'Sin resultado'}
                </span>
            </div>
            <div class="admin-result-teams">
                <div class="admin-result-team">
                    <span style="font-size:2rem;">${match.team1.flag}</span>
                    <span class="admin-team-name">${match.team1.name}</span>
                </div>
                <div class="admin-result-inputs">
                    <input type="number" class="admin-score-input" id="admin-t1-${match.id}" min="0" max="15" placeholder="-" value="${result.t1 ?? ''}">
                    <span class="admin-score-dash">-</span>
                    <input type="number" class="admin-score-input" id="admin-t2-${match.id}" min="0" max="15" placeholder="-" value="${result.t2 ?? ''}">
                </div>
                <div class="admin-result-team">
                    <span style="font-size:2rem;">${match.team2.flag}</span>
                    <span class="admin-team-name">${match.team2.name}</span>
                </div>
            </div>
            <div style="display:flex; gap:0.5rem;">
                <button class="btn-gold admin-save-btn" style="flex:1;" onclick="saveResultInline('${match.id}')">
                    ${result.completed ? 'Actualizar resultado' : 'Guardar resultado'}
                </button>
                <button class="btn-ghost admin-delete-btn" onclick="deleteMatchInline('${match.id}')" title="Eliminar partido">
                    🗑️
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ─── Admin: Botón Revelar Puntos ───
function renderRevealButton() {
    const container = document.getElementById('adminRevealSection');
    if (!container) return;

    const matchesWithResults = allMatches.filter(m => matchResults[m.id]?.completed).length;
    const totalMatches = allMatches.length;

    container.innerHTML = `
        <div class="reveal-card">
            <div class="reveal-info">
                <h3>${pointsRevealed ? '🎉 Puntos revelados' : '🔒 Puntos ocultos'}</h3>
                <p>Resultados ingresados: <strong>${matchesWithResults}/${totalMatches}</strong> partidos</p>
                <p style="font-size:0.8rem;color:var(--gray-500);margin-top:0.25rem;">
                    ${pointsRevealed
                        ? 'Los participantes pueden ver sus puntos y el ranking.'
                        : 'Los participantes aún no pueden ver los puntos. Ingresa los resultados y luego revélalos.'}
                </p>
            </div>
            <div class="reveal-actions">
                ${!pointsRevealed ? `
                    <button class="btn-reveal" id="btnRevealPoints" ${matchesWithResults === 0 ? 'disabled' : ''}>
                        🎯 Revelar puntos
                    </button>
                ` : `
                    <button class="btn-hide-points" id="btnHidePoints">
                        🔒 Ocultar puntos
                    </button>
                `}
                <button class="btn-gold" id="btnRecalculate" style="margin-top:0.5rem;">
                    🔄 Recalcular puntos
                </button>
            </div>
        </div>
    `;

    // Event listeners
    const btnReveal = document.getElementById('btnRevealPoints');
    if (btnReveal) btnReveal.addEventListener('click', revealPoints);

    const btnHide = document.getElementById('btnHidePoints');
    if (btnHide) btnHide.addEventListener('click', hidePoints);

    document.getElementById('btnRecalculate').addEventListener('click', recalculateAllPointsInline);
}

// ─── Admin: Revelar puntos ───
async function revealPoints() {
    if (!isAdmin()) return;
    try {
        // Primero recalcular
        await recalculateAllPointsInline();
        // Luego marcar como revelados
        await setDoc(doc(db, 'config', 'points'), { revealed: true, revealedAt: serverTimestamp(), revealedBy: userData.email });
        pointsRevealed = true;
        toast('🎉 ¡Puntos revelados! Todos pueden ver el ranking.', 'success');
        renderAdminPanel();
        renderMatches();
    } catch (err) {
        toast('Error al revelar puntos', 'error');
    }
}

async function hidePoints() {
    if (!isAdmin()) return;
    try {
        await setDoc(doc(db, 'config', 'points'), { revealed: false });
        pointsRevealed = false;
        toast('Puntos ocultos nuevamente', 'info');
        renderAdminPanel();
        renderMatches();
    } catch (err) {
        toast('Error', 'error');
    }
}

// ─── Admin: Gestión de administradores ───
function renderAdminManagers() {
    const container = document.getElementById('adminManagersSection');
    if (!container) return;

    const emailList = adminEmails.map(email => {
        const isSuper = email === SUPER_ADMIN;
        return `
            <div class="admin-email-item">
                <span class="admin-email-text">${email}${isSuper ? ' <span class="admin-super-badge">Super Admin</span>' : ''}</span>
                ${!isSuper ? `<button class="btn-remove-admin" onclick="removeAdmin('${email}')" title="Quitar admin">✕</button>` : ''}
            </div>`;
    }).join('');

    container.innerHTML = `
        <div class="admin-card">
            <h3 style="margin-bottom:1rem; color:var(--navy);">👥 Administradores</h3>
            <div class="admin-emails-list">${emailList}</div>
            <div style="display:flex; gap:0.5rem; margin-top:1rem;">
                <input type="email" id="newAdminEmail" class="admin-input" placeholder="correo@usil.edu.pe" style="flex:1;">
                <button class="btn-gold" id="btnAddAdmin">+ Agregar</button>
            </div>
        </div>
    `;

    document.getElementById('btnAddAdmin').addEventListener('click', addAdmin);
    document.getElementById('newAdminEmail').addEventListener('keypress', e => { if (e.key === 'Enter') addAdmin(); });
}

async function addAdmin() {
    const email = document.getElementById('newAdminEmail').value.trim().toLowerCase();
    if (!email || !email.endsWith('@usil.edu.pe')) { toast('Ingresa un correo @usil.edu.pe válido', 'error'); return; }
    if (adminEmails.includes(email)) { toast('Este correo ya es admin', 'error'); return; }
    try {
        await updateDoc(doc(db, 'config', 'admins'), { emails: arrayUnion(email) });
        toast(`${email} agregado como admin`, 'success');
        document.getElementById('newAdminEmail').value = '';
        renderAdminPanel();
    } catch (err) { toast('Error al agregar admin', 'error'); }
}

window.removeAdmin = async function(email) {
    if (!isAdmin()) return;
    if (email === SUPER_ADMIN) { toast('No puedes quitar al super admin', 'error'); return; }
    if (!confirm(`¿Quitar a ${email} como administrador?`)) return;
    try {
        await updateDoc(doc(db, 'config', 'admins'), { emails: arrayRemove(email) });
        toast(`${email} ya no es admin`, 'info');
        renderAdminPanel();
    } catch (err) { toast('Error al quitar admin', 'error'); }
}

// ─── Admin: Guardar resultado (SIN revelar puntos automáticamente) ───
window.saveResultInline = async function(matchId) {
    if (!isAdmin()) { toast('No autorizado', 'error'); return; }
    const t1 = parseInt(document.getElementById(`admin-t1-${matchId}`).value);
    const t2 = parseInt(document.getElementById(`admin-t2-${matchId}`).value);
    if (isNaN(t1) || isNaN(t2) || t1 < 0 || t2 < 0) { toast('Ingresa marcadores válidos', 'error'); return; }

    try {
        await setDoc(doc(resultsCol, matchId), {
            matchId, t1, t2, completed: true,
            updatedBy: userData.email, updatedAt: serverTimestamp()
        });
        matchResults[matchId] = { t1, t2, completed: true };
        const match = allMatches.find(m => m.id === matchId);
        toast(`Resultado guardado: ${match?.team1?.flag || ''} ${t1} - ${t2} ${match?.team2?.flag || ''}`, 'success');
        renderAdminPanel();
    } catch (err) { toast('Error al guardar', 'error'); }
}

// ─── Admin: Eliminar partido ───
window.deleteMatchInline = async function(matchId) {
    if (!isAdmin()) return;
    if (!confirm('¿Eliminar este partido?')) return;
    try {
        await deleteDoc(doc(matchesCol, matchId));
        await deleteDoc(doc(resultsCol, matchId));
        delete matchResults[matchId];
        allMatches = allMatches.filter(m => m.id !== matchId);
        toast('Partido eliminado', 'info');
        renderAdminPanel();
        renderMatches();
    } catch (err) { toast('Error al eliminar', 'error'); }
}

// ─── Calcular puntos ───
function calculatePoints(prediction, result) {
    if (!prediction || !result?.completed) return 0;
    const pT1 = parseInt(prediction.t1), pT2 = parseInt(prediction.t2);
    const rT1 = parseInt(result.t1), rT2 = parseInt(result.t2);
    if (isNaN(pT1) || isNaN(pT2)) return 0;
    if (pT1 === rT1 && pT2 === rT2) return 5;
    const pW = pT1 > pT2 ? 1 : pT1 < pT2 ? 2 : 0;
    const rW = rT1 > rT2 ? 1 : rT1 < rT2 ? 2 : 0;
    if (pW === rW && pW !== 0) return 3;
    if (pW === 0 && rW === 0) return 2;
    return 0;
}

async function recalculateAllPointsInline() {
    if (!isAdmin()) return;
    try {
        const snap = await getDocs(predictCol);
        let count = 0;
        for (const predDoc of snap.docs) {
            const preds = predDoc.data().predictions || {};
            let totalPoints = 0;
            let matchPoints = {};
            allMatches.forEach(m => {
                const pts = calculatePoints(preds[m.id], matchResults[m.id]);
                totalPoints += pts;
                if (pts > 0) matchPoints[m.id] = pts;
            });
            await setDoc(doc(predictCol, predDoc.id), { totalPoints, matchPoints }, { merge: true });
            count++;
        }
        toast(`Puntos recalculados para ${count} participantes`, 'success');
    } catch (err) { toast('Error al recalcular', 'error'); }
}
