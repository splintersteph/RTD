// ═══ Cockpit — vue d'accueil « pilotage de la chaîne » ═══════════════════════
// Lecture seule : tout est calculé à partir des données déjà chargées (OF, stock,
// commandes, correspondances PDP). Aucune donnée n'est modifiée ni sauvegardée.
(function () {
  const DAY = 86400000;
  const fmt = n => Math.round(n).toLocaleString('fr');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const today0 = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
  const isoToDate = iso => iso ? new Date(iso + 'T12:00:00') : null;
  const daysFrom = (iso, t0) => Math.round((isoToDate(iso) - t0) / DAY);
  const mondayOf = d => { const x = new Date(d); x.setHours(0,0,0,0); const k = (x.getDay() + 6) % 7; x.setDate(x.getDate() - k); return x; };
  const SEUIL_STAGNATION = 30;   // jours passés dans la même étape avant d'être signalé

  function collect() {
    const t0 = today0();
    const out = { t0, refs: [], lignes: [], ofs: [] };

    // Lignes de commande ouvertes, dédupliquées (même règle que PDP/Besoins)
    const seen = new Set();
    (pcData.commandes || []).forEach(c => {
      const k = String(c.NUM_COM || '') + '|' + String(c.LIGNE_COM || '');
      if (seen.has(k)) return; seen.add(k);
      if (String(c.COMMANDE_S || '').trim() === 'O') return;
      const q = (Number(c.QTE_CDE) || 0) - (Number(c.QTE_LIVREE) || 0);
      const d = (typeof pdpToISODate === 'function') ? pdpToISODate(c.DATDEL) : null;
      if (q > 0 && d) out.lignes.push({ ref: String(c.REF_RTD || '').trim(), q, d });
    });

    // Références suivies dans le PDP
    const corrs = (typeof pdpGetActiveCorrespondances === 'function') ? pdpGetActiveCorrespondances() : [];
    corrs.forEach(r => {
      try {
        if (typeof pdpDeletedRefs !== 'undefined' && pdpDeletedRefs.includes(r.code_client)) return;
        const stock = pdpGetTotalFGForRef(r.codart_wip, r.code_client);
        const mesCdes = out.lignes.filter(l => l.ref === r.code_client);
        const totalCde = mesCdes.reduce((s, l) => s + l.q, 0);
        const rup = totalCde ? pdpCalcRupture(r.code_client, stock) : null;
        const nom = (typeof pdpCustomNames !== 'undefined' && pdpCustomNames[r.code_client])
          || (typeof pdpAutoShortName === 'function' ? pdpAutoShortName(r) : r.code_client);
        out.refs.push({
          code: r.code_client, nom, client: r.client || r.famille || '', stock, totalCde,
          rup, joursRup: rup ? daysFrom(rup.date, t0) : null,
          couv: totalCde > 0 ? Math.min(1, stock / totalCde) : null,
        });
      } catch (e) { console.error('[Cockpit] référence ignorée', r && r.code_client, e); }
    });

    // OF en cours (Kanban) : âge dans l'étape
    (typeof ofs !== 'undefined' ? ofs : []).forEach(o => {
      const entree = (o.stageEnteredAt && o.stageEnteredAt[o.stage]) || o.date;
      const age = entree ? Math.max(0, Math.round((t0 - isoToDate(String(entree).slice(0, 10))) / DAY)) : 0;
      out.ofs.push({ o, age, retard: (typeof isBlocked === 'function') && isBlocked(o) });
    });
    return out;
  }

  function countUp(el, to, dur) {
    if (!el) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fmt(to); return; }
    const t = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * e);
      if (p < 1) requestAnimationFrame(step);
    })(t);
  }

  function scoreSante(d) {
    const avecCde = d.refs.filter(r => r.totalCde > 0);
    const okRefs = avecCde.length ? avecCde.filter(r => !(r.joursRup != null && r.joursRup <= 42)).length / avecCde.length : 1;
    const okStagn = d.ofs.length ? d.ofs.filter(x => x.age <= SEUIL_STAGNATION).length / d.ofs.length : 1;
    const okRetard = d.ofs.length ? d.ofs.filter(x => !x.retard).length / d.ofs.length : 1;
    return { score: Math.round(100 * (0.6 * okRefs + 0.25 * okStagn + 0.15 * okRetard)), okRefs, okStagn, okRetard };
  }

  function gauge(score) {
    const R = 90, C = Math.PI * R, pct = Math.max(0, Math.min(100, score)) / 100;
    const col = score >= 80 ? '#35D6C4' : score >= 55 ? '#F5B642' : '#FF6B5E';
    return `<svg class="ck-gauge" viewBox="0 0 220 128" aria-hidden="true">
      <defs><linearGradient id="ckg" x1="0" x2="1"><stop offset="0" stop-color="${col}" stop-opacity=".55"/><stop offset="1" stop-color="${col}"/></linearGradient></defs>
      <path d="M20 112 A90 90 0 0 1 200 112" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="14" stroke-linecap="round"/>
      <path class="ck-arc" d="M20 112 A90 90 0 0 1 200 112" fill="none" stroke="url(#ckg)" stroke-width="14" stroke-linecap="round"
        style="stroke-dasharray:${C.toFixed(1)};--to:${(C * (1 - pct)).toFixed(1)};--from:${C.toFixed(1)};filter:drop-shadow(0 0 8px ${col})"/>
    </svg>`;
  }

  function section(title, sub, body, cls) {
    return `<section class="ck-card ${cls || ''}"><header><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</header>${body}</section>`;
  }

  window.cockpitCollect = collect; window.cockpitScore = function(d){return scoreSante(d);};
  window.renderCockpit = function () {
    const el = document.getElementById('view-cockpit'); if (!el) return;
    if (typeof pcData === 'undefined' || !(pcData.commandes || []).length) {
      el.innerHTML = '<div class="ck-empty"><i class="ti ti-radar-2"></i><h2>Le cockpit attend vos données</h2><p>Importez le stock et les commandes depuis le menu Imports, puis les correspondances dans l\'onglet PDP.</p></div>';
      return;
    }
    let d;
    try { d = collect(); } catch (e) { console.error(e); el.innerHTML = '<div class="ck-empty"><h2>Calcul impossible</h2><p>' + esc(e.message) + '</p></div>'; return; }
    const sc = scoreSante(d);
    const verdict = sc.score >= 80 ? 'La chaîne est sous contrôle' : sc.score >= 55 ? 'Quelques points à surveiller' : 'La chaîne est sous tension';

    // ── Ruptures par semaine (12 semaines + déjà en rupture)
    const w0 = mondayOf(d.t0), nW = 12, wk = Array.from({ length: nW + 1 }, () => []);
    d.refs.filter(r => r.rup).forEach(r => {
      const idx = isoToDate(r.rup.date) < d.t0 ? 0 : Math.floor((mondayOf(isoToDate(r.rup.date)) - w0) / (7 * DAY)) + 1;
      if (idx >= 0 && idx <= nW) wk[idx].push(r);
    });
    const maxW = Math.max(1, ...wk.map(a => a.length));
    const wkBars = wk.map((a, i) => {
      const dt = new Date(w0.getTime() + (i - 1) * 7 * DAY);
      const lab = i === 0 ? 'Déjà' : 'S' + String(dt.getDate()).padStart(2, '0') + '/' + String(dt.getMonth() + 1).padStart(2, '0');
      const tone = i === 0 ? 'crit' : i <= 2 ? 'crit' : i <= 6 ? 'warn' : 'calm';
      const noms = a.slice(0, 8).map(r => r.nom).join(', ') + (a.length > 8 ? '…' : '');
      return `<div class="ck-col" title="${esc(a.length ? a.length + ' réf. : ' + noms : 'Aucune rupture')}"><div class="ck-colbar"><i class="${tone}" style="height:${a.length ? Math.max(8, a.length / maxW * 100) : 0}%;animation-delay:${i * 45}ms"></i><b>${a.length || ''}</b></div><span>${lab}</span></div>`;
    }).join('');
    const nCrit = d.refs.filter(r => r.joursRup != null && r.joursRup <= 14).length;
    const nUrg = d.refs.filter(r => r.joursRup != null && r.joursRup > 14 && r.joursRup <= 42).length;

    // ── Top références à risque
    const top = d.refs.filter(r => r.rup).sort((a, b) => a.joursRup - b.joursRup || b.rup.manque - a.rup.manque).slice(0, 8);
    const maxManque = Math.max(1, ...top.map(r => r.rup.manque));
    const topHtml = top.length ? top.map((r, i) => {
      const tone = r.joursRup <= 14 ? 'crit' : r.joursRup <= 42 ? 'warn' : 'calm';
      const when = r.joursRup < 0 ? 'depuis ' + (-r.joursRup) + ' j' : r.joursRup === 0 ? 'aujourd\'hui' : 'dans ' + r.joursRup + ' j';
      return `<button class="ck-risk ${tone}" onclick="setView('pdp');setTimeout(()=>{typeof pdpShowDetail==='function'&&pdpShowDetail('${esc(r.code)}')},60)" style="animation-delay:${i * 60}ms">
        <span class="ck-risk-name">${esc(r.nom)}<small>${esc(r.client)}</small></span>
        <span class="ck-risk-bar"><i style="width:${Math.max(6, r.rup.manque / maxManque * 100)}%"></i></span>
        <span class="ck-risk-num">−${fmt(r.rup.manque)}<small>rupture ${when}</small></span></button>`;
    }).join('') : '<p class="ck-ok"><i class="ti ti-circle-check"></i>Aucune rupture prévue sur les commandes connues.</p>';

    // ── Flux atelier par étape
    const stages = (typeof STAGES !== 'undefined' ? STAGES : []).map(st => {
      const l = d.ofs.filter(x => x.o.stage === st.id);
      const qty = l.reduce((s, x) => s + (Number(x.o.qty) || 0), 0);
      const avg = l.length ? l.reduce((s, x) => s + x.age, 0) / l.length : 0;
      const old = l.filter(x => x.age > SEUIL_STAGNATION).length;
      return { st, n: l.length, qty, avg, old, max: l.reduce((m, x) => Math.max(m, x.age), 0) };
    });
    const maxAvg = Math.max(1, ...stages.map(s => s.avg));
    const worst = stages.reduce((a, b) => (b.avg > (a ? a.avg : -1) && b.n ? b : a), null);
    const flowHtml = stages.map((s, i) => `<div class="ck-stage ${worst && s === worst && s.avg > SEUIL_STAGNATION ? 'hot' : ''}" style="animation-delay:${i * 70}ms">
        <div class="ck-stage-top"><span class="dot" style="background:${s.st.color}"></span><b>${esc(s.st.label)}</b><em>${s.n} OF</em></div>
        <div class="ck-stage-qty">${fmt(s.qty)}<small> pièces</small></div>
        <div class="ck-age"><i style="width:${Math.max(4, s.avg / maxAvg * 100)}%;background:${s.st.color}"></i></div>
        <div class="ck-stage-foot">${s.n ? 'séjour moyen <b>' + Math.round(s.avg) + ' j</b>' : 'vide'}${s.old ? ` · <span class="late">${s.old} &gt; ${SEUIL_STAGNATION} j</span>` : ''}</div></div>`).join('');

    // ── Charge machines (OF actuellement à l'usinage)
    const mach = {};
    d.ofs.filter(x => x.o.stage === 'usinage' && x.o.machine).forEach(x => {
      const m = x.o.machine; (mach[m] = mach[m] || { n: 0, qty: 0 }); mach[m].n++; mach[m].qty += Number(x.o.qty) || 0;
    });
    const order = (typeof MACHINE_ORDER !== 'undefined') ? MACHINE_ORDER : [];
    const mNames = Object.keys(mach).sort((a, b) => (order.indexOf(a) < 0 ? 99 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 99 : order.indexOf(b)) || a.localeCompare(b));
    const maxQ = Math.max(1, ...mNames.map(m => mach[m].qty));
    const machHtml = mNames.length ? mNames.map((m, i) => `<div class="ck-mach" title="${mach[m].n} OF · ${fmt(mach[m].qty)} pièces"><span>${esc(m)}</span><div><i style="width:${Math.max(5, mach[m].qty / maxQ * 100)}%;animation-delay:${i * 40}ms"></i></div><b>${fmt(mach[m].qty)}</b></div>`).join('')
      : '<p class="ck-ok"><i class="ti ti-info-circle"></i>Aucun OF à l\'usinage pour le moment.</p>';

    // ── Carnet de commandes : 6 prochains mois
    const mois = [], base = new Date(d.t0.getFullYear(), d.t0.getMonth(), 1);
    for (let i = 0; i < 6; i++) { const x = new Date(base.getFullYear(), base.getMonth() + i, 1); mois.push({ k: x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'), lab: x.toLocaleDateString('fr', { month: 'short' }).replace('.', ''), q: 0 }); }
    let retardQ = 0, auDela = 0;
    d.lignes.forEach(l => {
      if (isoToDate(l.d) < d.t0) { retardQ += l.q; return; }
      const m = mois.find(x => x.k === l.d.slice(0, 7)); if (m) m.q += l.q; else auDela += l.q;
    });
    const maxM = Math.max(1, retardQ, ...mois.map(m => m.q));
    const cdeHtml = `<div class="ck-cols">${[{ lab: 'Échues', q: retardQ, late: true }, ...mois].map((m, i) => `<div class="ck-col" title="${fmt(m.q)} pièces"><div class="ck-colbar"><i class="${m.late ? 'crit' : 'ink'}" style="height:${m.q ? Math.max(6, m.q / maxM * 100) : 0}%;animation-delay:${i * 50}ms"></i></div><span>${m.lab}</span></div>`).join('')}</div>
      <p class="ck-foot">${fmt(d.lignes.reduce((s, l) => s + l.q, 0))} pièces restent à livrer${auDela ? ' · dont ' + fmt(auDela) + ' au-delà de 6 mois' : ''}${retardQ ? ' · <b class="late">' + fmt(retardQ) + ' échues</b>' : ''}</p>`;

    const nStagn = d.ofs.filter(x => x.age > SEUIL_STAGNATION).length;
    const kpi = (ico, num, lab, sub, tone) => `<div class="ck-kpi ${tone || ''}"><i class="ti ${ico}"></i><div><b data-n="${num}">0</b><span>${lab}</span><small>${sub}</small></div></div>`;

    el.innerHTML = `
      <div class="ck-hero">
        <div class="ck-hero-gauge">${gauge(sc.score)}<div class="ck-score"><b data-n="${sc.score}">0</b><span>/ 100</span></div></div>
        <div class="ck-hero-text">
          <h1>${verdict}</h1>
          <p>Score de santé : 60 % des références sans rupture avant 6 semaines (${Math.round(sc.okRefs * 100)} %), 25 % des OF qui avancent (${Math.round(sc.okStagn * 100)} %), 15 % des OF dans les temps (${Math.round(sc.okRetard * 100)} %).</p>
          <div class="ck-hero-chips">
            <button onclick="setView('besoins')"><i class="ti ti-alert-triangle"></i>${nCrit} rupture${nCrit > 1 ? 's' : ''} sous 2 semaines</button>
            <button onclick="setView('besoins')"><i class="ti ti-clock-exclamation"></i>${nUrg} entre 2 et 6 semaines</button>
            <button onclick="setView('kanban')"><i class="ti ti-hourglass"></i>${nStagn} OF immobiles depuis plus de ${SEUIL_STAGNATION} j</button>
          </div>
        </div>
      </div>
      <div class="ck-kpis">
        ${kpi('ti-package', d.refs.length, 'Références suivies', 'dans le PDP')}
        ${kpi('ti-truck-delivery', d.lignes.reduce((s, l) => s + l.q, 0), 'Pièces à livrer', d.lignes.length + ' lignes ouvertes')}
        ${kpi('ti-clipboard-list', d.ofs.length, 'OF en cours', fmt(d.ofs.reduce((s, x) => s + (Number(x.o.qty) || 0), 0)) + ' pièces dans l\'atelier')}
        ${kpi('ti-flame', d.refs.filter(r => r.rup).length, 'Références en rupture à venir', 'sur ' + d.refs.filter(r => r.totalCde > 0).length + ' avec commandes', d.refs.some(r => r.rup) ? 'warn' : '')}
      </div>
      <div class="ck-grid">
        ${section('Quand les ruptures tombent', 'Nombre de références qui ne peuvent plus être livrées, par semaine', `<div class="ck-cols tall">${wkBars}</div>`, 'span2')}
        ${section('Les plus urgentes', 'Cliquez pour ouvrir la tuile PDP', `<div class="ck-risks">${topHtml}</div>`)}
        ${section('Où sont bloqués les OF ?', 'Séjour moyen par étape — rouge au-delà de ' + SEUIL_STAGNATION + ' jours', `<div class="ck-flow">${flowHtml}</div>`, 'span2')}
        ${section('Charge des machines', 'Pièces en cours d\'usinage', `<div class="ck-machs">${machHtml}</div>`)}
        ${section('Carnet de commandes', 'Pièces à livrer, par mois de livraison', cdeHtml, 'span3')}
      </div>`;
    el.querySelectorAll('[data-n]').forEach(n => countUp(n, Number(n.dataset.n), 1100));
  };
})();
