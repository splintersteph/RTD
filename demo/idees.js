// ═══ Idées : Aujourd'hui · Et si ? · Arrêts machines · Revue hebdo · Fiche référence 360° ═══
//  · Recherche universelle (Ctrl+K)        · Notes datées sur chaque OF
//  · Contrôle « l'OF arrive-t-il avant la rupture ? »
//  · Pastilles d'alerte dans le menu       · Valeur en € dans les Gammes ABC
// Les seules données écrites : notes d'OF (dans l'OF), journal des arrêts et revues figées
// (dans extra_data). Tout le reste est calculé à la volée, rien n'est modifié.
(function () {
  'use strict';
  const DAY = 864e5;
  const fmt = n => Math.round(n).toLocaleString('fr');
  const f1 = n => (Math.round(n * 10) / 10).toLocaleString('fr');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const dOf = s => new Date(String(s).slice(0, 10) + 'T12:00:00');
  const addD = (s, n) => { const d = dOf(s); d.setDate(d.getDate() + Math.round(n)); return iso(d); };
  const diff = (a, b) => Math.round((dOf(a) - dOf(b)) / DAY);
  const todayS = () => iso(new Date());
  const fr = s => s ? dOf(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '—';
  const frY = s => s ? dOf(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';
  const plur = (n, a, b) => n > 1 ? b : a;
  const HUES = { teal: ['#35D6C4', '#0B7F79'], red: ['#FF7A6B', '#B02A22'], violet: ['#A798FF', '#4C3FC1'], amber: ['#F7C25B', '#B36B00'], blue: ['#6FB1FF', '#1F5FB4'], green: ['#6BE3A4', '#1B7A4A'] };
  const toast = m => { try { showToast(m); } catch (e) { /* rien */ } };
  const save = () => { try { scheduleSave(); } catch (e) { /* rien */ } };
  const view = id => document.getElementById(id);

  window.arretsList = Array.isArray(window.arretsList) ? window.arretsList : [];
  window.revuesList = Array.isArray(window.revuesList) ? window.revuesList : [];

  function hero(hue, ico, t, s, st) {
    const h = HUES[hue];
    return `<div class="dz-hero" style="--h1:${h[0]};--h2:${h[1]}"><div class="dz-aurora"></div>
      <div class="dz-hero-main"><span class="dz-ico"><i class="ti ${ico}"></i></span><div><h2>${t}</h2><p>${s}</p></div></div>
      ${st && st.length ? `<div class="dz-stats">${st.map(x => `<div class="dz-stat ${x[2] || ''}"><b>${fmt(x[0])}</b><span>${x[1]}</span></div>`).join('')}</div>` : ''}</div>`;
  }

  // ───────────────────────── Données communes ─────────────────────────
  function ofFin(o) {
    try { const cd = calcDates(o); const l = STAGES.map(s => cd.dates[s.id]).filter(Boolean); return l.length ? l[l.length - 1] : null; } catch (e) { return null; }
  }
  function stageEnd(o) { try { return calcDates(o).dates[o.stage] || null; } catch (e) { return null; } }
  function ofLate(o) { const e = stageEnd(o); return !!(e && o.stage !== 'creation' && e < todayS()); }
  function clientOf(o) { try { return detectClientFull(o.produit) || ''; } catch (e) { return ''; } }
  function usDays(o) { try { const tc = lookupTC(o.produit); return tc ? (Number(o.qty) || 0) * tc / 3600 / HEURES_PAR_JOUR : 0; } catch (e) { return 0; } }

  function ctx() {
    const c = { ok: false, byCode: {}, ofMap: {}, d: null };
    try {
      if (typeof window.cockpitCollect !== 'function' || typeof pcData === 'undefined' || !(pcData.commandes || []).length) return c;
      const d = window.cockpitCollect(); c.d = d; c.ok = true;
      d.refs.forEach(r => { c.byCode[r.code] = r; r.ofs = []; });
      pdpGetActiveCorrespondances().forEach(cr => {
        try {
          const rec = c.byCode[cr.code_client]; if (!rec) return;
          const sn = (typeof pdpCustomNames !== 'undefined' && pdpCustomNames[cr.code_client]) || pdpAutoShortName(cr);
          pdpGetOFsForRef(cr.codart_wip, sn).forEach(o => { if (!rec.ofs.includes(o)) rec.ofs.push(o); (c.ofMap[o.id] = c.ofMap[o.id] || []); if (!c.ofMap[o.id].includes(rec)) c.ofMap[o.id].push(rec); });
          rec.corr = cr;
        } catch (e) { /* référence ignorée */ }
      });
    } catch (e) { console.error('[Idées] ctx', e); }
    return c;
  }

  // Pour chaque référence qui va tomber en rupture : un OF arrive-t-il avant ?
  const fabrique = r => { try { return !!(r.corr && (lookupCatalogueEntry(r.corr.codart_wip) || lookupCatalogueEntry(r.nom))); } catch (e) { return false; } };
  function risks(c, tout) {
    if (!c.ok) return [];
    // On ne garde que les références fabriquées ici et les ruptures proches (30 j de retard max, 6 semaines devant) :
    // les vieilles commandes jamais soldées ne sont pas une urgence du jour.
    return c.d.refs.filter(r => r.rup && (tout || (fabrique(r) && r.joursRup >= -30 && r.joursRup <= 42))).map(r => {
      const fins = (r.ofs || []).map(o => ({ o, fin: ofFin(o) })).filter(x => x.fin).sort((a, b) => a.fin.localeCompare(b.fin));
      const first = fins[0] || null, gap = first ? diff(first.fin, r.rup.date) : null;
      return { r, list: r.ofs || [], first, gap, st: !(r.ofs || []).length ? 'none' : gap > 0 ? 'late' : 'ok' };
    }).sort((a, b) => a.r.joursRup - b.r.joursRup);
  }

  // ───────────────────────── Machines : libre / occupée / en arrêt ─────────────────────────
  function arretEnCours(m) {
    const t = todayS();
    return (window.arretsList || []).find(a => a.machine === m && a.debut <= t && t <= addD(a.debut, Math.max(1, Math.ceil((Number(a.duree_h) || 0) / 24)) - 1)) || null;
  }
  function machinesState() {
    let names = []; try { names = getMachineOrder().filter(m => m !== 'Non assigné'); } catch (e) { return []; }
    return names.map(m => {
      const rec = (typeof machines !== 'undefined' ? machines : []).find(x => x.name === m);
      const u = ofs.filter(o => o.machine === m && o.stage === 'usinage'), q = ofs.filter(o => o.machine === m && o.stage === 'creation');
      const ar = arretEnCours(m), enPanne = rec && rec.status === 'panne';
      const until = u.map(o => stageEnd(o)).filter(Boolean).sort().pop() || null;
      return { m, st: (ar || enPanne) ? 'stop' : u.length ? 'busy' : 'free', u, q, until, ar };
    });
  }

  // ───────────────────────── Notes sur les OF ─────────────────────────
  const who = () => { try { return localStorage.getItem('pp_auteur') || ''; } catch (e) { return ''; } };
  window.idNoteAdd = function (id) {
    const o = ofs.find(x => x.id === id); if (!o) return;
    const t = (view('id-n-txt') || {}).value || '', w = ((view('id-n-who') || {}).value || '').trim();
    if (!t.trim()) return;
    try { if (w) localStorage.setItem('pp_auteur', w); } catch (e) { /* rien */ }
    (o.notes = o.notes || []).push({ t: new Date().toISOString(), who: w, txt: t.trim() });
    save(); window.openDetail(id);
  };
  window.idNoteDel = function (id, i) {
    const o = ofs.find(x => x.id === id); if (!o || !o.notes) return;
    o.notes.splice(i, 1); save(); window.openDetail(id);
  };
  function notesHtml(o) {
    const n = o.notes || [];
    return `<div class="id-notes"><h4><i class="ti ti-message-2"></i>Notes et historique</h4>
      ${n.length ? n.slice().reverse().map((x, k) => `<div class="id-note"><small>${new Date(x.t).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}${x.who ? ' · ' + esc(x.who) : ''}</small><p>${esc(x.txt)}</p><button title="Supprimer" onclick="idNoteDel('${esc(o.id)}',${n.length - 1 - k})"><i class="ti ti-x"></i></button></div>`).join('') : '<p class="id-none">Aucune note. Écrivez ici ce qui explique un retard ou une décision (« attente matière, retour jeudi »).</p>'}
      <div class="id-nadd"><input id="id-n-who" placeholder="Votre nom" value="${esc(who())}" style="max-width:130px"><input id="id-n-txt" placeholder="Ajouter une note…" onkeydown="if(event.key==='Enter')idNoteAdd('${esc(o.id)}')"><button class="id-btn pri" onclick="idNoteAdd('${esc(o.id)}')">Ajouter</button></div></div>`;
  }
  function wrapOpenDetail() {
    if (typeof window.openDetail !== 'function' || window.openDetail._id) return;
    const od = window.openDetail;
    window.openDetail = function (id) {
      const r = od.apply(this, arguments);
      try {
        const o = ofs.find(x => x.id === id); if (!o) return r;
        const body = document.querySelector('#modal .modal-body'); if (!body) return r;
        let extra = '';
        const c = ctx(), recs = (c.ofMap[o.id] || []).filter(x => x.rup);
        if (recs.length) {
          const fin = ofFin(o), rec = recs[0], gap = fin ? diff(fin, rec.rup.date) : null;
          if (gap != null) extra += `<div class="id-verdict ${gap > 0 ? 'crit' : 'ok'}"><i class="ti ${gap > 0 ? 'ti-alert-triangle' : 'ti-circle-check'}"></i><div><b>${gap > 0 ? `Cet OF arrive ${gap} j après la rupture de ${esc(rec.nom)}` : `Cet OF arrive avant la rupture de ${esc(rec.nom)}`}</b><span>Fin prévue le ${frY(fin)} · rupture annoncée le ${frY(rec.rup.date)} (${fmt(rec.rup.manque)} pièces manquantes).</span></div></div>`;
        }
        extra += notesHtml(o);
        body.insertAdjacentHTML('beforeend', extra);
        const ref = (c.ofMap[o.id] || [])[0];
        const foot = document.querySelector('#modal .step-nav');
        if (ref && foot) foot.insertAdjacentHTML('afterbegin', `<button class="btn" data-c="${esc(ref.code)}" onclick="idRef(this.dataset.c)"><i class="ti ti-target"></i> Fiche réf.</button>`);
      } catch (e) { console.error('[Idées] détail OF', e); }
      return r;
    };
    window.openDetail._id = true;
  }

  // ───────────────────────── Fiche référence 360° ─────────────────────────
  window.idRef = function (code) {
    const c = ctx(), r = c.byCode[code]; if (!r) { toast('Référence introuvable'); return; }
    let cls = '', abcRow = null;
    try { const A = window.abcCompute && window.abcCompute(); abcRow = A && A.rows.find(x => x.r.code === code); if (abcRow) cls = abcRow.cls + abcRow.xyz; } catch (e) { /* rien */ }
    let m = 0; try { m = consoGetMoyenneMensuelle(code) || 0; } catch (e) { /* rien */ }
    const cov = m > 0 ? r.stock / m : null;
    const lignes = c.d.lignes.filter(l => l.ref === code).sort((a, b) => a.d.localeCompare(b.d));
    let run = r.stock;
    const rows = lignes.slice(0, 8).map(l => { run -= l.q; return `<tr><td>${frY(l.d)}</td><td class="n">${fmt(l.q)}</td><td class="n ${run < 0 ? 'bad' : ''}">${run < 0 ? '−' + fmt(-run) + ' (manque)' : fmt(run)}</td></tr>`; }).join('');
    const rk = risks(c, true).find(x => x.r.code === code);
    const sentences = [];
    if (r.rup) sentences.push(`<b>Rupture prévue le ${frY(r.rup.date)}</b> (dans ${r.joursRup < 0 ? 'le passé : déjà en retard de ' + (-r.joursRup) : r.joursRup} j) : il manquera ${fmt(r.rup.manque)} pièces pour honorer les commandes.`);
    else if (r.totalCde > 0) sentences.push('<b>Pas de rupture prévue</b> : le stock suffit pour toutes les commandes ouvertes.');
    else sentences.push('Aucune commande ouverte pour cette référence.');
    if (rk) sentences.push(rk.st === 'none' ? '<b>Aucun OF en cours</b> ne travaille pour cette référence : la rupture ne sera pas évitée sans nouvel OF.' : rk.st === 'late' ? `<b>Le premier OF (${esc(rk.first.o.id)}) finit le ${frY(rk.first.fin)}</b>, soit ${rk.gap} j après la rupture.` : `<b>Le premier OF (${esc(rk.first.o.id)}) finit le ${frY(rk.first.fin)}</b>, avant la rupture : bien.`);
    if (cov != null) sentences.push(cov < 1 ? `Le stock couvre <b>${f1(cov)} mois</b> de ventes : très juste.` : cov > 12 ? `Le stock couvre <b>${f1(cov)} mois</b> de ventes : trop, de l'argent immobilisé.` : `Le stock couvre <b>${f1(cov)} mois</b> de ventes.`);
    if (cls) sentences.push(`Classe <b>${cls}</b> : ${cls[0] === 'A' ? 'un pilier, à protéger en priorité' : cls[0] === 'B' ? 'un produit régulier' : 'la longue traîne, stock minimal'} · ${cls[1] === 'X' ? 'demande régulière' : cls[1] === 'Y' ? 'demande variable' : 'demande irrégulière'}.`);
    const kp = (v, l, tone) => `<div class="id-kp ${tone || ''}"><b>${v}</b><span>${l}</span></div>`;
    document.getElementById('modal').innerHTML = `
      <div class="modal-header"><h2><i class="ti ti-target" style="color:#0B7F79;margin-right:8px"></i>${esc(r.nom)} <span class="abc-t info" style="margin-left:6px">${esc(r.client || '—')}</span>${cls ? ` <span class="abc-t ${cls[0] === 'A' ? 'ok' : cls[0] === 'B' ? 'warn' : 'na'}">${cls}</span>` : ''}</h2><button class="close-btn" onclick="closeOverlay()"><i class="ti ti-x"></i></button></div>
      <div class="modal-body">
        <div class="id-kps">${kp(fmt(r.stock), 'pièces en stock')}${kp(cov == null ? '—' : f1(cov) + ' mois', 'de ventes couvertes', cov != null && cov < 1 ? 'crit' : '')}${kp(fmt(r.totalCde), 'pièces commandées')}${kp(r.rup ? frY(r.rup.date) : 'Aucune', 'date de rupture', r.rup ? (r.joursRup <= 14 ? 'crit' : 'warn') : 'ok')}</div>
        <ul class="id-says">${sentences.map(s => `<li>${s}</li>`).join('')}</ul>
        ${rows ? `<h4 class="id-h">Commandes à venir et stock restant</h4><table class="id-tb"><thead><tr><th>Livraison</th><th class="n">Quantité</th><th class="n">Stock après</th></tr></thead><tbody>${rows}</tbody></table>${lignes.length > 8 ? `<p class="id-none">+ ${lignes.length - 8} autres lignes</p>` : ''}` : ''}
        <h4 class="id-h">OF en cours pour cette référence</h4>
        ${(r.ofs || []).length ? (r.ofs || []).map(o => { const f = ofFin(o), s = stageOf(o.stage); return `<div class="id-row ${ofLate(o) ? 'warn' : ''}"><i class="ti ${s ? s.icon : 'ti-clipboard'}"></i><div><b>${esc(o.id)} · ${fmt(o.qty)} u.</b><span>${s ? s.label : ''}${o.machine ? ' · ' + esc(o.machine) : ''} · fin prévue ${frY(f)}${(o.notes || []).length ? ' · 💬 ' + esc(o.notes[o.notes.length - 1].txt) : ''}</span></div><button class="id-btn" onclick="openDetail('${esc(o.id)}')">Ouvrir</button></div>`; }).join('') : '<p class="id-none">Aucun OF en cours.</p>'}
      </div>
      <div class="modal-footer"><div class="step-nav"><button class="btn" onclick="idRefPdp('${esc(code)}')"><i class="ti ti-chart-bar"></i> Voir dans le PDP</button><span class="spacer"></span><button class="btn btn-primary" onclick="closeOverlay()">Fermer</button></div></div>`;
    document.getElementById('overlay').classList.add('open');
  };
  window.idRefPdp = function (code) {
    const c = ctx(), r = c.byCode[code]; closeOverlay();
    if (typeof pdpSelectedClient !== 'undefined' && r) pdpSelectedClient = r.client;
    setView('pdp'); if (typeof pdpShowDetail === 'function') pdpShowDetail(code);
  };

  // Les alertes de rupture ne valent que ce que valent les imports : on prévient s'ils sont vieux.
  function staleBanner() {
    try {
      const li = (pcData && pcData.lastImport) || {}, txt = li.commandes || li.stock; if (!txt) return '';
      const m = String(txt).match(/(\d{2})\/(\d{2})\/(\d{4})/); if (!m) return '';
      const age = Math.round((Date.now() - new Date(+m[3], +m[2] - 1, +m[1]).getTime()) / DAY);
      if (age <= 7) return '';
      return `<div class="id-verdict crit id-stale"><i class="ti ti-database-exclamation"></i><div><b>Stock et commandes importés il y a ${age} jours (${m[1]}/${m[2]}/${m[3]})</b><span>Les ruptures affichées ici se basent sur ces données. Réimportez-les (onglet PDP) pour des alertes fiables.</span></div></div>`;
    } catch (e) { return ''; }
  }

  // ───────────────────────── Page « Aujourd'hui » ─────────────────────────
  const row = (ico, tone, title, sub, btn) => `<div class="id-row ${tone}"><i class="ti ${ico}"></i><div><b>${title}</b><span>${sub}</span></div>${btn || ''}</div>`;
  const btnOF = id => `<button class="id-btn" onclick="openDetail('${esc(id)}')">Ouvrir</button>`;
  const btnRef = code => `<button class="id-btn" data-c="${esc(code)}" onclick="idRef(this.dataset.c)">Fiche</button>`;
  const lastNote = o => (o.notes || []).length ? ' · 💬 ' + esc(o.notes[o.notes.length - 1].txt) : '';
  const card = (ico, title, sub, body, cls) => `<section class="st-card id-card ${cls || ''}"><header><h3><i class="ti ${ico}"></i> ${title}</h3>${sub ? `<p>${sub}</p>` : ''}</header><div class="id-list">${body}</div></section>`;
  const empty = t => `<div class="id-empty"><i class="ti ti-circle-check"></i>${t}</div>`;

  function renderJour() {
    const el = view('view-jour'); if (!el) return;
    const c = ctx(), R = risks(c), M = machinesState();
    const t = todayS();
    const prioN = { haute: 0, normale: 1, basse: 2 };
    const aLancer = ofs.filter(o => o.stage === 'creation').sort((a, b) => (prioN[a.prio] ?? 1) - (prioN[b.prio] ?? 1) || String(a.date).localeCompare(String(b.date)));
    const retards = ofs.filter(ofLate).sort((a, b) => (stageEnd(a) || '').localeCompare(stageEnd(b) || ''));
    const nonCouv = R.filter(x => x.st !== 'ok');
    const libres = M.filter(x => x.st === 'free');
    const stopped = M.filter(x => x.st === 'stop');
    const body1 = aLancer.length ? aLancer.slice(0, 8).map(o => {
      const ms = M.find(x => x.m === o.machine);
      const where = !o.machine ? 'machine à choisir' : ms ? (ms.st === 'free' ? o.machine + ' est libre' : ms.st === 'stop' ? o.machine + ' est en arrêt' : o.machine + ' occupée jusqu\'au ' + fr(ms.until)) : o.machine;
      const tone = ms && ms.st === 'stop' ? 'crit' : (o.prio === 'haute' ? 'warn' : '');
      return row('ti-player-play', tone, `${esc(o.id)} · ${esc(o.produit)}`, `${fmt(o.qty)} u. · ${where}${o.prio === 'haute' ? ' · priorité haute' : ''}${lastNote(o)}`, btnOF(o.id));
    }).join('') + (aLancer.length > 8 ? `<p class="id-none">+ ${aLancer.length - 8} autres OF à lancer</p>` : '') : empty('Aucun OF en attente de lancement.');
    const body2 = retards.length ? retards.slice(0, 8).map(o => { const e = stageEnd(o), d = diff(t, e), s = stageOf(o.stage); return row('ti-clock-exclamation', d > 7 ? 'crit' : 'warn', `${esc(o.id)} · ${esc(o.produit)}`, `Bloqué en « ${s ? s.label : o.stage} » : fin prévue il y a ${d} j (${fr(e)})${o.machine ? ' · ' + esc(o.machine) : ''}${lastNote(o)}`, btnOF(o.id)); }).join('') + (retards.length > 8 ? `<p class="id-none">+ ${retards.length - 8} autres</p>` : '') : empty('Aucun OF en retard sur son étape.');
    const body3 = !c.ok ? '<div class="id-empty"><i class="ti ti-database-off"></i>Importez le stock et les commandes (onglet PDP) pour voir les ruptures.</div>' :
      nonCouv.length ? nonCouv.slice(0, 8).map(x => row(x.st === 'none' ? 'ti-alert-octagon' : 'ti-alarm', x.r.joursRup <= 14 || x.st === 'none' ? 'crit' : 'warn', `${esc(x.r.nom)} · rupture le ${fr(x.r.rup.date)}`,
        x.st === 'none' ? `Aucun OF en cours · il manquera ${fmt(x.r.rup.manque)} pièces` : `L'OF ${esc(x.first.o.id)} finit le ${fr(x.first.fin)}, ${x.gap} j après la rupture`, btnRef(x.r.code))).join('') + (nonCouv.length > 8 ? `<p class="id-none">+ ${nonCouv.length - 8} autres références</p>` : '') : empty('Chaque rupture prévue a un OF qui arrive à temps.');
    const mach = M.length ? `<div class="id-mach">${M.map(x => `<div class="id-m ${x.st}" title="${x.st === 'free' ? 'Libre' : x.st === 'stop' ? 'En arrêt' : 'Occupée'}"><b>${esc(x.m)}</b><span>${x.st === 'free' ? 'Libre' + (x.q.length ? ' · ' + x.q.length + ' en attente' : '') : x.st === 'stop' ? 'En arrêt' : 'jusqu\'au ' + fr(x.until)}</span></div>`).join('')}</div>` : '<p class="id-none">Aucune machine.</p>';
    el.innerHTML = hero('blue', 'ti-sun-high', 'Aujourd\'hui', `${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} : ce qu'il faut faire en premier.`, [[aLancer.length, 'OF à lancer'], [retards.length, 'OF en retard', retards.length ? 'warn' : ''], [nonCouv.length, 'ruptures non couvertes', nonCouv.length ? 'warn' : ''], [libres.length, 'machines libres']]) + `
      <div class="cl-wrap">
        ${staleBanner()}
        <div class="id-grid">
          ${card('ti-player-play', 'À lancer', 'Les OF créés mais pas encore partis en usinage, priorité haute d\'abord.', body1)}
          ${card('ti-clock-exclamation', 'À débloquer', 'Les OF dont l\'étape devait être terminée et ne l\'est pas.', body2)}
          ${card('ti-alert-octagon', 'Ruptures que la production n\'évite pas', 'Pour chaque rupture annoncée : y a-t-il un OF qui arrive avant ?', body3, 'span2')}
        </div>
        <section class="st-card"><header><h3><i class="ti ti-building-factory-2"></i> Les machines maintenant</h3><p>Vert : libre. Orange : occupée, avec la date de fin. Rouge : en arrêt (journal des arrêts ou bouton « en panne »).${stopped.length ? '' : ''}</p></header>${mach}</section>
      </div>`;
  }

  // ───────────────────────── Page « Et si ? » ─────────────────────────
  const es = { mode: 'panne', machine: '', start: '', jours: 3, ofId: '' };
  function esOptionsMachines() { try { return getMachineOrder().filter(m => m !== 'Non assigné'); } catch (e) { return []; } }
  function esResult(c) {
    if (es.mode === 'panne') {
      if (!es.machine) return '<div class="id-empty"><i class="ti ti-hand-click"></i>Choisissez une machine et une durée.</div>';
      const aff = ofs.filter(o => o.machine === es.machine && (o.stage === 'creation' || o.stage === 'usinage')).filter(o => { const u = calcDates(o).dates.usinage; return !u || u >= es.start; });
      if (!aff.length) return `<div class="id-empty"><i class="ti ti-circle-check"></i>Aucun OF de ${esc(es.machine)} n'est touché : la machine n'a rien de prévu après cette date.</div>`;
      return esTable(c, aff.map(o => ({ o, delta: es.jours })), `Si ${esc(es.machine)} s'arrête ${es.jours} j à partir du ${frY(es.start)}`, esLibres(es.machine));
    }
    const X = ofs.find(o => o.id === es.ofId);
    if (!X) return '<div class="id-empty"><i class="ti ti-hand-click"></i>Choisissez l\'OF à passer en urgence.</div>';
    if (!X.machine) return '<div class="id-empty"><i class="ti ti-info-circle"></i>Cet OF n\'a pas de machine : affectez-en une pour simuler.</div>';
    const q = ofs.filter(o => o.machine === X.machine && o.stage === 'creation').sort((a, b) => String(a.date_usinage_debut || a.date).localeCompare(String(b.date_usinage_debut || b.date)));
    const idx = q.findIndex(o => o.id === X.id), avant = q.slice(0, idx);
    const gain = Math.ceil(avant.reduce((s, o) => s + usDays(o), 0));
    if (!avant.length) return '<div class="id-empty"><i class="ti ti-circle-check"></i>Cet OF est déjà le premier à passer sur sa machine : rien à gagner.</div>';
    const dX = Math.ceil(usDays(X));
    return esTable(c, [{ o: X, delta: -gain }].concat(avant.map(o => ({ o, delta: dX }))), `Si ${esc(X.id)} passe en premier sur ${esc(X.machine)}`, '');
  }
  function esLibres(except) { const l = machinesState().filter(x => x.st === 'free' && x.m !== except); return l.length ? `<p class="id-tip"><i class="ti ti-bulb"></i>Pour limiter les dégâts : ${l.slice(0, 4).map(x => esc(x.m)).join(', ')} ${l.length > 1 ? 'sont libres' : 'est libre'} et pourrai${l.length > 1 ? 'ent' : 't'} reprendre des OF.</p>` : ''; }
  function esTable(c, items, title, tip) {
    let bascule = 0;
    const trs = items.map(({ o, delta }) => {
      const fin = ofFin(o), nf = fin ? addD(fin, delta) : null;
      const recs = (c.ofMap[o.id] || []).filter(r => r.rup);
      let flag = '';
      if (recs.length && fin) {
        const rd = recs[0].rup.date, a = diff(fin, rd), b = diff(nf, rd);
        if (a <= 0 && b > 0) { flag = `<em class="abc-t crit">passe après la rupture de ${esc(recs[0].nom)}</em>`; bascule++; }
        else if (b > 0) flag = `<em class="abc-t warn">déjà après la rupture de ${esc(recs[0].nom)}</em>`;
        else if (delta < 0 && a > 0 && b <= 0) flag = `<em class="abc-t ok">évite la rupture de ${esc(recs[0].nom)}</em>`;
      }
      return `<tr onclick="openDetail('${esc(o.id)}')"><td><b>${esc(o.id)}</b><small>${esc(o.produit)}</small></td><td>${frY(fin)}</td><td>${frY(nf)}</td><td class="n"><span class="id-dl ${delta > 0 ? 'bad' : 'good'}">${delta > 0 ? '+' : ''}${delta} j</span></td><td>${flag}</td></tr>`;
    }).join('');
    const sauves = items.filter(({ o, delta }) => { const r = (c.ofMap[o.id] || []).find(x => x.rup); return r && delta < 0 && diff(ofFin(o) || todayS(), r.rup.date) > 0 && diff(addD(ofFin(o) || todayS(), delta), r.rup.date) <= 0; }).length;
    const cli = new Set(items.map(x => clientOf(x.o)).filter(Boolean)).size;
    return `<div class="id-sum ${bascule ? 'crit' : 'ok'}"><i class="ti ${bascule ? 'ti-alert-triangle' : 'ti-circle-check'}"></i><div><b>${title}</b><span>${items.length} ${plur(items.length, 'OF est décalé', 'OF sont décalés')}${cli ? ' · ' + cli + ' ' + plur(cli, 'client touché', 'clients touchés') : ''}${bascule ? ` · <b>${bascule} ${plur(bascule, 'référence basculerait', 'références basculeraient')} en rupture</b>` : ''}${sauves ? ` · <b>${sauves} rupture${sauves > 1 ? 's évitées' : ' évitée'}</b>` : ''}.</span></div></div>
      <table class="abc-tb id-tb2"><thead><tr><th>OF</th><th>Fin prévue</th><th>Nouvelle fin</th><th class="n">Écart</th><th>Conséquence</th></tr></thead><tbody>${trs}</tbody></table>${tip}
      <p class="abc-note"><i class="ti ti-info-circle"></i> Simulation indicative en jours calendaires : rien n'est modifié dans vos OF. Les ruptures sont celles du PDP (stock et commandes importés).</p>`;
  }
  function renderEtsi() {
    const el = view('view-etsi'); if (!el) return;
    if (!es.start) es.start = todayS();
    const c = ctx(), M = esOptionsMachines();
    const creations = ofs.filter(o => o.stage === 'creation');
    el.innerHTML = hero('violet', 'ti-bulb', 'Et si… ?', 'Testez une décision avant de la prendre : qu\'est-ce qui glisse, qu\'est-ce qui casse ?', []) + `
      <div class="cl-wrap">
        <section class="st-card"><div class="id-tabs"><button class="${es.mode === 'panne' ? 'on' : ''}" onclick="idEs('mode','panne')"><i class="ti ti-tool"></i>Une machine tombe en panne</button><button class="${es.mode === 'urgence' ? 'on' : ''}" onclick="idEs('mode','urgence')"><i class="ti ti-flame"></i>Je passe un OF en urgence</button></div>
          <div class="fb-form">${es.mode === 'panne' ? `
            <label>Machine<select onchange="idEs('machine',this.value)"><option value="">Choisir…</option>${M.map(m => `<option ${m === es.machine ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select></label>
            <label>À partir du<input type="date" value="${es.start}" onchange="idEs('start',this.value)"></label>
            <label>Durée (jours)<input type="number" min="1" max="60" value="${es.jours}" onchange="idEs('jours',this.value)"></label>` : `
            <label style="grid-column:span 2">OF à passer en premier<select onchange="idEs('ofId',this.value)"><option value="">Choisir…</option>${creations.map(o => `<option value="${esc(o.id)}" ${o.id === es.ofId ? 'selected' : ''}>${esc(o.id)} · ${esc(o.produit)} · ${fmt(o.qty)} u.${o.machine ? ' · ' + esc(o.machine) : ''}</option>`).join('')}</select></label>`}
          </div>
          <div id="id-es-out">${(() => { try { return esResult(c); } catch (e) { console.error(e); return '<div class="id-empty">Calcul impossible.</div>'; } })()}</div></section>
      </div>`;
  }
  window.idEs = function (k, v) { es[k] = k === 'jours' ? Math.max(1, Math.min(60, parseInt(v) || 1)) : v; renderEtsi(); };

  // ───────────────────────── Page « Arrêts machines » ─────────────────────────
  const CAUSES = ['Panne mécanique', 'Réglage / changement d\'outil', 'Manque de matière', 'Maintenance préventive', 'Problème qualité', 'Autre'];
  const arretsSince = (days, m) => { const lim = addD(todayS(), -days); return (window.arretsList || []).filter(a => a.debut >= lim && (!m || a.machine === m)); };
  window.arretsDispo = function (m, days) {
    days = days || 90; if (!(window.arretsList || []).length) return null;
    const h = arretsSince(days, m).reduce((s, a) => s + (Number(a.duree_h) || 0), 0);
    return Math.max(0.05, 1 - h / (days * HEURES_PAR_JOUR));
  };
  window.idArretAdd = function () {
    const g = id => (view(id) || {}).value;
    const m = g('ar-m'), d = g('ar-d'), h = parseFloat(g('ar-h')), cs = g('ar-c');
    if (!m || !d || !(h > 0)) { toast('Machine, date et durée sont nécessaires'); return; }
    window.arretsList.push({ id: 'A' + Date.now().toString(36), machine: m, debut: d, duree_h: h, cause: cs, note: (g('ar-n') || '').trim() });
    save(); renderArrets();
  };
  window.idArretDel = function (id) { window.arretsList = window.arretsList.filter(a => a.id !== id); save(); renderArrets(); };
  function renderArrets() {
    const el = view('view-arrets'); if (!el) return;
    const M = esOptionsMachines(), L = window.arretsList, D = 90;
    const rec = arretsSince(D), hTot = rec.reduce((s, a) => s + (Number(a.duree_h) || 0), 0);
    let fi = null; try { fi = window.fiabCompute && window.fiabCompute(); } catch (e) { /* rien */ }
    const per = M.map(m => {
      const l = arretsSince(D, m), h = l.reduce((s, a) => s + (Number(a.duree_h) || 0), 0), pannes = l.filter(a => a.cause === 'Panne mécanique');
      const disp = Math.max(0, 1 - h / (D * HEURES_PAR_JOUR));
      const mtbf = pannes.length ? ((D * HEURES_PAR_JOUR - h) / pannes.length / 24) : null, mttr = pannes.length ? pannes.reduce((s, a) => s + a.duree_h, 0) / pannes.length : null;
      const g = fi && fi.ok ? fi.by.find(x => x.m === m) : null, q = g && g.s.fpy != null ? g.s.fpy : null;
      return { m, n: l.length, h, disp, mtbf, mttr, trs: q != null ? disp * q : null };
    }).filter(x => x.n > 0 || L.length === 0 ? true : false).sort((a, b) => b.h - a.h);
    const byC = {}; rec.forEach(a => { byC[a.cause] = (byC[a.cause] || 0) + (Number(a.duree_h) || 0); });
    const cs = Object.entries(byC).sort((a, b) => b[1] - a[1]), mx = cs.length ? cs[0][1] : 1;
    const worst = per.filter(x => x.n > 0)[0];
    const ins = [];
    if (!L.length) ins.push(['info', 'ti-notebook', 'Le journal est vide', 'Notez chaque arrêt en 4 champs (machine, date, durée, cause). Après quelques semaines, la fiabilité réelle de chaque machine apparaît ici et entre dans le délai annoncé.']);
    else {
      ins.push([hTot > 0 ? 'warn' : 'ok', 'ti-clock-pause', `${fmt(hTot)} h d'arrêt sur ${D} jours`, `${rec.length} ${plur(rec.length, 'arrêt', 'arrêts')} au total. Chaque heure perdue sur une machine saturée est une heure de livraison perdue.`]);
      if (worst) ins.push(['crit', 'ti-alert-triangle', `${worst.m} : la machine qui s'arrête le plus`, `${f1(worst.h)} h d'arrêt (${worst.n} ${plur(worst.n, 'fois', 'fois')}), soit ${Math.round(worst.disp * 100)} % de disponibilité.`]);
      if (cs[0]) ins.push(['info', 'ti-target-arrow', `Première cause : ${cs[0][0].toLowerCase()}`, `${Math.round(cs[0][1] / hTot * 100)} % des heures perdues. C'est là qu'une action rapporte le plus.`]);
    }
    el.innerHTML = hero('red', 'ti-alert-octagon', 'Arrêts machines', 'Un petit journal des pannes et arrêts : il révèle la vraie fiabilité de chaque machine.', [[rec.length, 'arrêts sur 90 j'], [hTot, 'heures perdues', hTot ? 'warn' : ''], [per.filter(x => x.n > 0).length, 'machines touchées']]) + `
      <div class="cl-wrap">
        <div class="st-ins">${ins.map((x, i) => `<div class="st-in ${x[0]}" style="animation-delay:${i * 80}ms"><i class="ti ${x[1]}"></i><div><b>${x[2]}</b><span>${x[3]}</span></div></div>`).join('')}</div>
        <section class="st-card"><header><h3><i class="ti ti-plus"></i> Noter un arrêt</h3><p>Une ligne par arrêt. Durée en heures (une journée complète = 24).</p></header>
          <div class="fb-form" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
            <label>Machine<select id="ar-m"><option value="">Choisir…</option>${M.map(m => `<option>${esc(m)}</option>`).join('')}</select></label>
            <label>Date<input id="ar-d" type="date" value="${todayS()}"></label>
            <label>Durée (h)<input id="ar-h" type="number" min="0.5" step="0.5" placeholder="ex : 6"></label>
            <label>Cause<select id="ar-c">${CAUSES.map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
            <label style="grid-column:span 2">Commentaire (facultatif)<input id="ar-n" placeholder="ex : roulement broche remplacé"></label>
            <label style="align-self:end"><button class="id-btn pri" style="width:100%;padding:11px" onclick="idArretAdd()">Ajouter</button></label></div></section>
        ${per.some(x => x.n) ? `<div class="abc-top">
          <section class="st-card"><header><h3>Santé de chaque machine (${D} derniers jours)</h3><p>Disponibilité = part du temps où la machine a pu tourner. Rendement = disponibilité × pièces conformes.</p></header>
            <table class="abc-tb"><thead><tr><th>Machine</th><th class="n">Arrêts</th><th class="n">Heures</th><th>Disponibilité</th><th class="n">Entre 2 pannes</th><th class="n">Réparation</th><th class="n">Rendement</th></tr></thead><tbody>
            ${per.filter(x => x.n).map(x => `<tr><td><b>${esc(x.m)}</b></td><td class="n">${x.n}</td><td class="n">${f1(x.h)}</td><td><div class="id-bar"><i class="${x.disp < .9 ? 'crit' : x.disp < .95 ? 'warn' : 'ok'}" style="width:${x.disp * 100}%"></i></div><small>${(x.disp * 100).toFixed(1)} %</small></td><td class="n">${x.mtbf == null ? '—' : f1(x.mtbf) + ' j'}</td><td class="n">${x.mttr == null ? '—' : f1(x.mttr) + ' h'}</td><td class="n">${x.trs == null ? '—' : Math.round(x.trs * 100) + ' %'}</td></tr>`).join('')}</tbody></table></section>
          <section class="st-card"><header><h3>Pourquoi les machines s'arrêtent</h3><p>Heures perdues par cause.</p></header>
            <div class="id-par">${cs.map(([k, v], i) => `<div class="id-pr" style="animation-delay:${i * 50}ms"><span>${esc(k)}</span><div class="id-bar"><i class="crit" style="width:${v / mx * 100}%"></i></div><b>${f1(v)} h</b></div>`).join('')}</div></section></div>` : ''}
        ${L.length ? `<section class="st-card"><header><h3>Journal</h3></header><table class="abc-tb"><thead><tr><th>Date</th><th>Machine</th><th class="n">Durée</th><th>Cause</th><th>Commentaire</th><th></th></tr></thead><tbody>
          ${L.slice().sort((a, b) => b.debut.localeCompare(a.debut)).slice(0, 40).map(a => `<tr style="cursor:default"><td>${frY(a.debut)}</td><td>${esc(a.machine)}</td><td class="n">${f1(a.duree_h)} h</td><td>${esc(a.cause)}</td><td>${esc(a.note)}</td><td class="n"><button class="id-btn" title="Supprimer" onclick="idArretDel('${esc(a.id)}')"><i class="ti ti-trash"></i></button></td></tr>`).join('')}</tbody></table></section>` : ''}
        <section class="st-card"><header><h3>Comment lire</h3></header><div class="cl-gl" style="margin-top:12px">
          <dl><dt>Disponibilité</dt><dd>Part du temps où la machine était prête à produire. 95 % = environ 1 heure d'arrêt toutes les 20 heures.</dd></dl>
          <dl><dt>Entre 2 pannes</dt><dd>Combien de jours la machine tourne en moyenne entre deux pannes mécaniques. Plus c'est long, mieux c'est.</dd></dl>
          <dl><dt>Réparation</dt><dd>Durée moyenne d'une panne mécanique. Plus c'est court, mieux c'est.</dd></dl>
          <dl><dt>Rendement</dt><dd>Disponibilité × pièces conformes : la part du temps machine réellement utile.</dd></dl></div>
          <p class="abc-note"><i class="ti ti-info-circle"></i>Le simulateur de délai annoncé (onglet Fiabilité machines et création d'OF) ajoute automatiquement une marge pour les arrêts de la machine concernée.</p></section>
      </div>`;
  }

  // ───────────────────────── Page « Revue hebdo » ─────────────────────────
  window.idRevueFiger = function () {
    const s = snapshot(); s.date = todayS();
    window.revuesList = (window.revuesList || []).filter(x => x.date !== s.date).concat([s]).slice(-12);
    save(); renderRevue(); toast('Revue figée : elle servira de point de comparaison la semaine prochaine');
  };
  function weekStats() {
    const t = todayS(), a0 = addD(t, -7), b0 = addD(t, -14);
    const cur = archives.filter(o => o.archivedAt && String(o.archivedAt).slice(0, 10) > a0), prev = archives.filter(o => o.archivedAt && String(o.archivedAt).slice(0, 10) > b0 && String(o.archivedAt).slice(0, 10) <= a0);
    const q = l => l.reduce((s, o) => s + (Number(o.qty) || 0), 0);
    return { n: cur.length, p: q(cur), nPrev: prev.length, pPrev: q(prev) };
  }
  function snapshot() {
    const c = ctx(), R = risks(c), w = weekStats();
    return { ofCours: ofs.length, retards: ofs.filter(ofLate).length, rup14: R.filter(x => x.r.joursRup <= 14).length, nonCouv: R.filter(x => x.st !== 'ok').length, livres7: w.n, pieces7: w.p, score: c.ok && window.cockpitScore ? (function () { try { const s = window.cockpitScore(c.d); return s && s.score != null ? s.score : (typeof s === 'number' ? s : null); } catch (e) { return null; } })() : null };
  }
  function renderRevue() {
    const el = view('view-revue'); if (!el) return;
    const c = ctx(), R = risks(c), w = weekStats(), M = machinesState(), snap = snapshot();
    const prev = (window.revuesList || []).filter(x => x.date < todayS()).slice(-1)[0];
    const delta = (k, lab, bad) => { if (!prev || prev[k] == null || snap[k] == null) return ''; const d = snap[k] - prev[k]; return `<div class="id-d ${d === 0 ? '' : ((d > 0) === !!bad ? 'bad' : 'good')}"><b>${d > 0 ? '+' : ''}${fmt(d)}</b><span>${lab}</span></div>`; };
    const retards = ofs.filter(ofLate), nonCouv = R.filter(x => x.st !== 'ok');
    const dec = [];
    nonCouv.filter(x => x.st === 'none').slice(0, 5).forEach(x => dec.push(['crit', `Lancer un OF pour <b>${esc(x.r.nom)}</b> : rupture le ${fr(x.r.rup.date)}, aucun OF en cours.`, x.r.code, 'ref']));
    nonCouv.filter(x => x.st === 'late').slice(0, 5).forEach(x => dec.push(['warn', `Accélérer <b>${esc(x.first.o.id)}</b> pour <b>${esc(x.r.nom)}</b> : il finit ${x.gap} j après la rupture.`, x.first.o.id, 'of']));
    retards.slice(0, 4).forEach(o => dec.push(['warn', `Débloquer <b>${esc(o.id)}</b> (${esc(o.produit)}) : étape « ${(stageOf(o.stage) || {}).label || o.stage} » dépassée de ${diff(todayS(), stageEnd(o))} j.`, o.id, 'of']));
    M.filter(x => x.st === 'stop').forEach(x => dec.push(['crit', `Remettre <b>${esc(x.m)}</b> en route : machine à l'arrêt.`, '', '']));
    if (c.ok && typeof consoGetCouvertureMois === 'function') { const big = c.d.refs.filter(r => { const m = consoGetCouvertureMois(r.code, r.stock); return m != null && m > 12; }); if (big.length) dec.push(['info', `Surstock : <b>${big.length} ${plur(big.length, 'référence', 'références')}</b> couvrent plus d'un an de ventes. Faut-il arrêter d'en fabriquer ?`, '', '']); }
    const dir = (a, b) => b ? (a - b) / b : null;
    const tr = (a, b) => { const d = dir(a, b); return d == null ? '' : ` <small class="${d >= 0 ? 'up' : 'dn'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(Math.round(d * 100))} % vs semaine précédente</small>`; };
    el.innerHTML = hero('green', 'ti-presentation', 'Revue de la semaine', `Prête à projeter ou à imprimer · ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`, [[w.n, 'OF terminés (7 j)'], [retards.length, 'OF en retard', retards.length ? 'warn' : ''], [nonCouv.length, 'ruptures non couvertes', nonCouv.length ? 'warn' : '']]) + `
      <div class="cl-wrap">
        ${staleBanner()}
        <div class="id-noprint id-bar-top"><button class="id-btn pri" onclick="window.print()"><i class="ti ti-printer"></i> Imprimer / PDF</button><button class="id-btn" onclick="idRevueFiger()"><i class="ti ti-camera"></i> Figer la revue d'aujourd'hui</button><span class="id-none">${prev ? 'Comparée à la revue du ' + frY(prev.date) : 'Figez cette revue : la prochaine l\'utilisera pour montrer ce qui a changé.'}</span></div>
        ${prev ? `<section class="st-card"><header><h3><i class="ti ti-arrows-diff"></i> Ce qui a changé depuis le ${frY(prev.date)}</h3></header><div class="id-ds">${delta('ofCours', 'OF en cours')}${delta('retards', 'OF en retard', 1)}${delta('rup14', 'ruptures sous 2 semaines', 1)}${delta('nonCouv', 'ruptures non couvertes', 1)}</div></section>` : ''}
        <div class="id-grid">
          <section class="st-card"><header><h3><i class="ti ti-checks"></i> La semaine en chiffres</h3></header>
            <div class="id-kps"><div class="id-kp"><b>${w.n}</b><span>OF terminés${tr(w.n, w.nPrev)}</span></div><div class="id-kp"><b>${fmt(w.p)}</b><span>pièces produites${tr(w.p, w.pPrev)}</span></div><div class="id-kp"><b>${ofs.length}</b><span>OF en cours</span></div><div class="id-kp ${retards.length ? 'warn' : 'ok'}"><b>${retards.length}</b><span>en retard sur leur étape</span></div></div></section>
          <section class="st-card"><header><h3><i class="ti ti-gavel"></i> Décisions à prendre</h3><p>Générées automatiquement à partir des données.</p></header>
            <div class="id-list">${dec.length ? dec.map(x => `<div class="id-row ${x[0]}"><i class="ti ${x[0] === 'crit' ? 'ti-alert-octagon' : x[0] === 'warn' ? 'ti-alarm' : 'ti-info-circle'}"></i><div><span style="color:var(--text);margin:0">${x[1]}</span></div>${x[3] === 'ref' ? `<button class="id-btn id-noprint" data-c="${esc(x[2])}" onclick="idRef(this.dataset.c)">Fiche</button>` : x[3] === 'of' ? `<button class="id-btn id-noprint" onclick="openDetail('${esc(x[2])}')">Ouvrir</button>` : ''}</div>`).join('') : empty('Rien d\'urgent : la semaine peut se dérouler sereinement.')}</div></section>
        </div>
        ${c.ok ? `<section class="st-card"><header><h3><i class="ti ti-alarm"></i> Ruptures annoncées (6 semaines)</h3></header><table class="abc-tb"><thead><tr><th>Référence</th><th>Client</th><th>Rupture</th><th class="n">Manque</th><th>Production</th></tr></thead><tbody>
          ${R.slice(0, 12).map(x => `<tr data-c="${esc(x.r.code)}" onclick="idRef(this.dataset.c)"><td><b>${esc(x.r.nom)}</b></td><td>${esc(x.r.client)}</td><td>${frY(x.r.rup.date)}</td><td class="n">${fmt(x.r.rup.manque)}</td><td>${x.st === 'none' ? '<em class="abc-t crit">aucun OF</em>' : x.st === 'late' ? `<em class="abc-t warn">OF trop tard (+${x.gap} j)</em>` : '<em class="abc-t ok">OF à temps</em>'}</td></tr>`).join('') || '<tr><td colspan="5" class="id-none">Aucune rupture dans les 6 prochaines semaines.</td></tr>'}</tbody></table></section>` : ''}
      </div>`;
  }

  // ───────────────────────── Valeur € dans les Gammes ABC ─────────────────────────
  function valeurHtml() {
    try {
      const A = window.abcCompute && window.abcCompute(); if (!A || !A.ok) return '';
      const prix = {}, last = {};
      (pcData.commandes || []).forEach(l => { const p = Number(l.PRIXUNREEL) || 0, r = String(l.REF_RTD || '').trim(), d = String(l.DATE_COMMA || ''); if (p > 0 && r && (!last[r] || d >= last[r])) { last[r] = d; prix[r] = p; } });
      const rows = A.rows.map(x => ({ x, p: prix[x.r.code] || 0, v: (prix[x.r.code] || 0) * x.qte, sv: (prix[x.r.code] || 0) * (x.stock || 0) })).filter(y => y.p > 0);
      if (rows.length < 5) return '';
      rows.sort((a, b) => b.v - a.v);
      const tot = rows.reduce((s, y) => s + y.v, 0); let cum = 0;
      rows.forEach(y => { const b = cum / tot * 100; cum += y.v; y.cv = b < 80 ? 'A' : b < 95 ? 'B' : 'C'; });
      const diffs = rows.filter(y => y.cv !== y.x.cls);
      const stockC = rows.filter(y => y.x.cls === 'C').reduce((s, y) => s + y.sv, 0), stockTot = rows.reduce((s, y) => s + y.sv, 0);
      const eur = n => fmt(n) + ' €';
      const byCls = ['A', 'B', 'C'].map(k => ({ k, n: rows.filter(y => y.cv === k).length, v: rows.filter(y => y.cv === k).reduce((s, y) => s + y.v, 0) }));
      return `<section class="st-card id-valeur"><header><h3><i class="ti ti-coin-euro"></i> Et en euros ?</h3><p>Même classement, mais en valeur de vente (quantité livrée × dernier prix de commande) au lieu des pièces. Un produit peut être discret en volume et très important en chiffre d'affaires.</p></header>
        <div class="id-kps">${byCls.map(b => `<div class="id-kp"><b>${b.n}</b><span>références ${b.k} en valeur · ${Math.round(b.v / tot * 100)} % du chiffre</span></div>`).join('')}<div class="id-kp ${stockTot && stockC / stockTot > .25 ? 'warn' : ''}"><b>${eur(stockC)}</b><span>de stock sur des références C en volume (${stockTot ? Math.round(stockC / stockTot * 100) : 0} % du stock valorisé)</span></div></div>
        ${diffs.length ? `<h4 class="id-h">Références dont le rang change selon l'angle</h4><table class="abc-tb"><thead><tr><th>Référence</th><th>En volume</th><th>En valeur</th><th class="n">Chiffre (période)</th><th class="n">Stock valorisé</th></tr></thead><tbody>${diffs.sort((a, b) => b.v - a.v).slice(0, 10).map(y => `<tr data-c="${esc(y.x.r.code)}" onclick="idRef(this.dataset.c)"><td><b>${esc(y.x.r.nom)}</b><small>${esc(y.x.r.client)}</small></td><td><span class="abc-t na">${y.x.cls}</span></td><td><span class="abc-t ${y.cv === 'A' ? 'ok' : y.cv === 'B' ? 'warn' : 'na'}">${y.cv}</span></td><td class="n">${eur(y.v)}</td><td class="n">${eur(y.sv)}</td></tr>`).join('')}</tbody></table>
          <p class="abc-note"><i class="ti ti-info-circle"></i> Une référence C en volume mais A en valeur mérite plus d'attention que ses pièces ne le laissent croire. Prix = dernier prix unitaire des commandes importées (PRIXUNREEL) ; les références sans prix sont ignorées.</p>` : ''}</section>`;
    } catch (e) { console.error('[Idées] valeur', e); return ''; }
  }
  function wrapAbc() {
    if (typeof window.renderABC !== 'function' || window.renderABC._id) return;
    const r0 = window.renderABC;
    window.renderABC = function () {
      const r = r0.apply(this, arguments);
      try { const w = document.querySelector('#view-abc .cl-wrap'); const h = valeurHtml(); if (w && h && !w.querySelector('.id-valeur')) w.insertAdjacentHTML('beforeend', h); } catch (e) { /* rien */ }
      return r;
    };
    window.renderABC._id = true;
  }

  // ───────────────────────── Recherche universelle (Ctrl+K) ─────────────────────────
  let kSel = 0, kRes = [];
  function kItems() {
    const it = [];
    const c = ctx();
    if (c.ok) c.d.refs.forEach(r => it.push({ g: 'Références', ico: 'ti-target', t: r.nom, s: `${r.code} · ${r.client || ''}${r.rup ? ' · rupture le ' + fr(r.rup.date) : ''}`, hay: `${r.nom} ${r.code} ${r.client}`.toLowerCase(), go: () => idRef(r.code) }));
    ofs.forEach(o => { const s = stageOf(o.stage); it.push({ g: 'OF en cours', ico: 'ti-clipboard-list', t: o.id, s: `${o.produit} · ${fmt(o.qty)} u.${s ? ' · ' + s.label : ''}${o.machine ? ' · ' + o.machine : ''}`, hay: `${o.id} ${o.produit} ${o.machine || ''} ${clientOf(o)}`.toLowerCase(), go: () => openDetail(o.id) }); });
    archives.forEach(o => it.push({ g: 'OF archivés', ico: 'ti-archive', t: o.id, s: `${o.produit} · ${fmt(o.qty)} u. · clos le ${frY(o.archivedAt)}`, hay: `${o.id} ${o.produit} ${o.machine || ''} ${clientOf(o)}`.toLowerCase(), go: () => { setView('archives'); toast(o.id + ' : ' + o.produit); } }));
    esOptionsMachines().forEach(m => it.push({ g: 'Machines', ico: 'ti-building-factory-2', t: m, s: 'Voir sur le planning', hay: m.toLowerCase(), go: () => setView('gantt') }));
    [['jour', 'Aujourd\'hui'], ['synthese', 'En clair'], ['cockpit', 'Cockpit'], ['kanban', 'Kanban'], ['list', 'Liste'], ['gantt', 'Gantt'], ['etsi', 'Et si ?'], ['arrets', 'Arrêts machines'], ['revue', 'Revue hebdo'], ['fiab', 'Fiabilité machines'], ['stats', 'Statistiques'], ['abc', 'Gammes ABC'], ['pdp', 'PDP'], ['besoins', 'Besoins'], ['conso', 'Consommation'], ['commandes', 'Commandes'], ['archives', 'Archives']]
      .forEach(([v, l]) => it.push({ g: 'Pages', ico: 'ti-layout-dashboard', t: l, s: 'Ouvrir la page', hay: l.toLowerCase(), go: () => setView(v) }));
    return it;
  }
  function kSearch(q) {
    const tk = q.toLowerCase().split(/\s+/).filter(Boolean); if (!tk.length) return [];
    const order = { 'Références': 0, 'OF en cours': 1, 'Machines': 2, 'Pages': 3, 'OF archivés': 4 };
    return kItems().filter(x => tk.every(t => x.hay.includes(t))).map(x => ({ x, sc: (x.hay.startsWith(tk[0]) ? 0 : 1) + (order[x.g] || 0) * 2 })).sort((a, b) => a.sc - b.sc).slice(0, 12).map(y => y.x);
  }
  function kDraw() {
    const box = view('id-k-res'); if (!box) return;
    let last = '';
    box.innerHTML = kRes.length ? kRes.map((x, i) => { const h = x.g !== last ? `<div class="id-k-g">${x.g}</div>` : ''; last = x.g; return h + `<div class="id-k-i ${i === kSel ? 'on' : ''}" data-i="${i}"><i class="ti ${x.ico}"></i><div><b>${esc(x.t)}</b><span>${esc(x.s)}</span></div></div>`; }).join('') : `<div class="id-k-e">${(view('id-k-in') || {}).value ? 'Aucun résultat' : 'Tapez un code produit, un client, un n° d\'OF, une machine ou le nom d\'une page'}</div>`;
    const on = box.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest' });
  }
  window.idK = function (open) {
    let k = view('id-k');
    if (open === false) { if (k) k.classList.remove('open'); return; }
    if (!k) {
      document.body.insertAdjacentHTML('beforeend', `<div id="id-k"><div class="id-k-box"><div class="id-k-top"><i class="ti ti-search"></i><input id="id-k-in" autocomplete="off" placeholder="Chercher une référence, un client, un OF, une machine, une page…"><kbd>Échap</kbd></div><div id="id-k-res"></div></div></div>`);
      k = view('id-k');
      k.addEventListener('mousedown', e => { if (e.target === k) window.idK(false); const it = e.target.closest('.id-k-i'); if (it) { const x = kRes[+it.dataset.i]; window.idK(false); if (x) x.go(); } });
      const inp = view('id-k-in');
      inp.addEventListener('input', () => { kRes = kSearch(inp.value); kSel = 0; kDraw(); });
      inp.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { kSel = Math.min(kRes.length - 1, kSel + 1); kDraw(); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { kSel = Math.max(0, kSel - 1); kDraw(); e.preventDefault(); }
        else if (e.key === 'Enter') { const x = kRes[kSel]; if (x) { window.idK(false); x.go(); } }
        else if (e.key === 'Escape') window.idK(false);
      });
    }
    k.classList.add('open'); const inp = view('id-k-in'); inp.value = ''; kRes = []; kSel = 0; kDraw(); inp.focus(); setTimeout(() => inp.focus(), 30);
  };
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); const k = view('id-k'); window.idK(!(k && k.classList.contains('open'))); }
    else if (e.key === 'Escape') window.idK(false);
    else if (e.key === '/' && !/^(INPUT|SELECT|TEXTAREA)$/.test((document.activeElement || {}).tagName || '')) { e.preventDefault(); window.idK(true); }
  });

  // ───────────────────────── Pastilles d'alerte dans le menu ─────────────────────────
  function dot(navId, n, tone) {
    const b = view(navId); if (!b) return;
    let d = b.querySelector('.id-dot');
    if (!n) { if (d) d.remove(); return; }
    if (!d) { d = document.createElement('span'); d.className = 'id-dot'; b.appendChild(d); }
    d.className = 'id-dot ' + (tone || 'crit'); d.textContent = n;
  }
  function badges() {
    try {
      const c = ctx(), R = risks(c);
      const aLancer = ofs.filter(o => o.stage === 'creation').length, ret = ofs.filter(ofLate).length;
      dot('nav-jour', aLancer + ret, ret ? 'crit' : 'info');
      dot('nav-besoins', R.filter(x => x.r.joursRup <= 14).length, 'crit');
      dot('nav-arrets', machinesState().filter(x => x.st === 'stop').length, 'crit');
      dot('nav-commandes', c.ok ? c.d.lignes.filter(l => l.d < todayS()).length : 0, 'warn');
      dot('nav-revue', R.filter(x => x.st !== 'ok').length, 'warn');
    } catch (e) { /* silencieux */ }
  }

  // ───────────────────────── Installation ─────────────────────────
  window.renderJour = renderJour; window.renderEtsi = renderEtsi; window.renderArrets = renderArrets; window.renderRevue = renderRevue;
  window.idCtx = ctx; window.idRisks = risks;
  function install() {
    wrapOpenDetail(); wrapAbc();
    const tv = document.querySelector('.tb-btn[onclick^="clairTV"]');
    if (tv && !document.getElementById('id-search-btn')) tv.insertAdjacentHTML('beforebegin', '<button class="tb-btn" id="id-search-btn" onclick="idK(true)" title="Rechercher partout (Ctrl+K)"><i class="ti ti-search"></i>Rechercher</button>');
    badges(); setInterval(badges, 20000);
    const sv = window.setView;
    if (typeof sv === 'function' && !sv._id) { window.setView = function () { const r = sv.apply(this, arguments); setTimeout(badges, 60); return r; }; window.setView._id = true; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(install, 0)); else setTimeout(install, 0);
})();
