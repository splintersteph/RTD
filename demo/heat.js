// ═══ Carte thermique — machine × période ═══════════════════════════════════
// Lecture seule. Une grille de couleurs : chaque ligne est une machine, chaque colonne un mois (ou une semaine).
// Elle montre d'un coup d'œil où et quand ça décroche : rendement, délais tenus, retard, volume, arrêts.
(function () {
  'use strict';
  const fmt = n => Math.round(n).toLocaleString('fr');
  const f1 = n => (Math.round(n * 10) / 10).toLocaleString('fr');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mk = n => String(n || '').replace(/\s+/g, '').toUpperCase();
  const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const dOf = s => new Date(String(s).slice(0, 10) + 'T12:00:00');
  const HUES = { teal: ['#35D6C4', '#0B7F79'], red: ['#FF7A6B', '#B02A22'], violet: ['#A798FF', '#4C3FC1'], amber: ['#F7C25B', '#B36B00'], blue: ['#6FB1FF', '#1F5FB4'] };
  const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const MOIS_L = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const state = { metric: 'rend', per: 'mois', sel: null };

  const METRICS = {
    rend: { t: 'Rendement', ico: 'ti-circle-check', help: 'Part des pièces contrôlées qui sont conformes. Rouge : trop de rebuts.', pct: true },
    delai: { t: 'Délais tenus', ico: 'ti-clock-check', help: 'Part des OF terminés à l\'heure. Rouge : beaucoup de retards.', pct: true },
    retard: { t: 'Retard moyen', ico: 'ti-hourglass', help: 'Nombre de jours de retard moyen par OF. Vert : à l\'heure ou en avance.' },
    vol: { t: 'Volume', ico: 'ti-package', help: 'Pièces terminées. Plus la case est foncée, plus la machine a produit.' },
    arrets: { t: 'Arrêts', ico: 'ti-alert-octagon', help: 'Heures d\'arrêt notées dans le journal. Plus la case est foncée, plus la machine a été à l\'arrêt.' },
  };

  // ── Périodes ──
  function bucketKey(s, per) {
    const d = dOf(s);
    if (per === 'mois') return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const t = new Date(d); t.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return iso(t);   // lundi de la semaine
  }
  function bucketLabel(k, per) {
    if (per === 'mois') { const [y, m] = k.split('-'); return MOIS[+m - 1] + (m === '01' || false ? ' ' + y.slice(2) : ''); }
    const d = dOf(k); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
  }
  function bucketFull(k, per) {
    if (per === 'mois') { const [y, m] = k.split('-'); return MOIS_L[+m - 1] + ' ' + y; }
    return 'semaine du ' + dOf(k).toLocaleDateString('fr-FR');
  }
  function nextKey(k, per) {
    if (per === 'mois') { let [y, m] = k.split('-').map(Number); m++; if (m > 12) { m = 1; y++; } return y + '-' + String(m).padStart(2, '0'); }
    const d = dOf(k); d.setDate(d.getDate() + 7); return iso(d);
  }

  // ── Données ──
  function records() {
    const A = (typeof archives !== 'undefined' ? archives : []).filter(a => a && a.machine && a.archivedAt);
    return A.map(a => ({
      id: a.id, produit: a.produit, m: a.machine, k: mk(a.machine), d: String(a.archivedAt).slice(0, 10),
      qty: Number(a.qty) || 0, ctrl: (a.qty_conf == null ? 0 : Number(a.qty_ctrl) || 0), conf: Number(a.qty_conf) || 0,   // sans quantité conforme saisie, le rendement n'est pas calculé
      ot: a.conforme_delai === 'Oui' ? true : a.conforme_delai === 'Non' ? false : null,
      ec: typeof a.ecart_j === 'number' ? a.ecart_j : null,
    }));
  }
  function machineList(recs) {
    const seen = new Map();
    const add = n => { if (n && n !== 'Non assigné' && !seen.has(mk(n))) seen.set(mk(n), n); };
    (typeof machines !== 'undefined' ? machines : []).forEach(m => add(m && (m.name || m)));
    recs.forEach(r => add(r.m));
    (window.arretsList || []).forEach(a => add(a.machine));
    return [...seen.entries()].map(([k, name]) => ({ k, name }));
  }
  function agg(list, metric, extraArrets) {
    if (metric === 'arrets') { const h = extraArrets.reduce((s, a) => s + (Number(a.duree_h) || 0), 0); return extraArrets.length ? { v: h, n: extraArrets.length, txt: f1(h) + ' h' } : null; }
    if (!list.length) return null;
    if (metric === 'rend') { const c = list.filter(x => x.ctrl > 0); const k = c.reduce((s, x) => s + x.ctrl, 0); if (!k) return null; const v = Math.min(1, c.reduce((s, x) => s + x.conf, 0) / k); return { v, n: c.length, txt: Math.round(v * 100) + ' %', sub: fmt(k) + ' pièces contrôlées' }; }
    if (metric === 'delai') { const j = list.filter(x => x.ot != null); if (!j.length) return null; const v = j.filter(x => x.ot).length / j.length; return { v, n: j.length, txt: Math.round(v * 100) + ' %', sub: j.filter(x => !x.ot).length + ' en retard' }; }
    if (metric === 'retard') { const e = list.filter(x => x.ec != null); if (!e.length) return null; const v = e.reduce((s, x) => s + x.ec, 0) / e.length; return { v, n: e.length, txt: (v > 0 ? '+' : '') + f1(v) + ' j' }; }
    if (metric === 'vol') { const v = list.reduce((s, x) => s + x.qty, 0); return { v, n: list.length, txt: v >= 1e6 ? f1(v / 1e6) + ' M' : v >= 1000 ? f1(v / 1000) + ' k' : fmt(v), sub: fmt(v) + ' pièces' }; }
    return null;
  }
  function build() {
    const per = state.per, metric = state.metric, R = records(), M = machineList(R), arr = window.arretsList || [];
    const dates = R.map(r => r.d).concat(metric === 'arrets' ? arr.map(a => a.debut).filter(Boolean) : []).sort();
    if (!dates.length) return { empty: true, M, metric, per };
    const lastK = bucketKey(dates[dates.length - 1], per), firstK = bucketKey(dates[0], per), N = per === 'mois' ? 12 : 26;
    const keys = [lastK]; let guard = 0;
    while (keys.length < N && keys[0] > firstK && guard++ < 60) { const d = dOf(keys[0] + (per === 'mois' ? '-01' : '')); if (per === 'mois') d.setMonth(d.getMonth() - 1); else d.setDate(d.getDate() - 7); keys.unshift(bucketKey(iso(d), per)); }
    const set = new Set(keys), cell = {};
    const put = (mkey, k, rec) => { if (!set.has(k)) return; ((cell[mkey] = cell[mkey] || {})[k] = cell[mkey][k] || { l: [], a: [] }).l.push(rec); };
    R.forEach(r => put(r.k, bucketKey(r.d, per), r));
    arr.forEach(a => { if (!a.debut) return; const k = bucketKey(a.debut, per); if (!set.has(k)) return; ((cell[mk(a.machine)] = cell[mk(a.machine)] || {})[k] = cell[mk(a.machine)][k] || { l: [], a: [] }).a.push(a); });
    const rows = M.map(m => {
      const cs = keys.map(k => { const c = (cell[m.k] || {})[k]; return c ? Object.assign({ k, c }, agg(c.l, metric, c.a)) : { k, c: null }; });
      const all = [].concat(...keys.map(k => ((cell[m.k] || {})[k] || { l: [] }).l)), allA = [].concat(...keys.map(k => ((cell[m.k] || {})[k] || { a: [] }).a));
      return { m, cs, tot: agg(all, metric, allA), all };
    }).filter(r => r.cs.some(c => c.v != null));
    const cols = keys.map(k => { const l = [].concat(...M.map(m => ((cell[m.k] || {})[k] || { l: [] }).l)), a = [].concat(...M.map(m => ((cell[m.k] || {})[k] || { a: [] }).a)); return agg(l, metric, a); });
    const grand = agg([].concat(...rows.map(r => r.all)), metric, [].concat(...rows.map(r => [].concat(...keys.map(k => ((cell[r.m.k] || {})[k] || { a: [] }).a)))));
    return { keys, rows, cols, grand, per, metric, last: dates[dates.length - 1], nRec: R.length, empty: false };
  }

  // ── Couleurs ──
  function colorOf(metric, v, max) {
    if (v == null) return null;
    const mix = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
    const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
    const G = [74, 190, 140], A = [244, 190, 80], Rr = [226, 82, 70], T0 = [226, 244, 242], T1 = [11, 127, 121], R0 = [253, 236, 232];
    let c, light = false;
    if (metric === 'rend' || metric === 'delai') {
      const lo = metric === 'rend' ? .93 : .5, hi = metric === 'rend' ? .995 : .95, t = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
      c = t < .5 ? mix(Rr, A, t * 2) : mix(A, G, (t - .5) * 2);
    } else if (metric === 'retard') { const t = Math.max(0, Math.min(1, (v + 1) / 8)); c = t < .35 ? mix(G, A, t / .35) : mix(A, Rr, (t - .35) / .65); }
    else if (metric === 'vol') { const t = max ? Math.min(1, v / max) : 0; c = mix(T0, T1, t); light = t > .55; }
    else { const t = max ? Math.min(1, v / max) : 0; c = mix(R0, Rr, t); light = t > .6; }
    const lum = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]);
    return { bg: rgb(c), fg: lum < 150 || light ? '#fff' : '#17252B' };
  }

  // ── Lecture : ce qu'il faut retenir ──
  function insights(D) {
    const ins = [], m = D.metric;
    if (m === 'arrets' && !D.rows.length) return [['info', 'ti-notebook', 'Le journal d\'arrêts est vide', 'Notez les arrêts dans « Arrêts machines » : la carte se remplit toute seule.']];
    const ok = D.rows.filter(r => r.tot && r.tot.n >= 3);
    if (!ok.length) return [['info', 'ti-info-circle', 'Pas assez de données', 'Il faut au moins 3 OF terminés par machine pour tirer une conclusion.']];
    const good = m === 'rend' || m === 'delai' || m === 'vol' ? 1 : -1;
    const sorted = ok.slice().sort((a, b) => good * (b.tot.v - a.tot.v));
    const best = sorted[0], worst = sorted[sorted.length - 1];
    const lab = { rend: ['conformes', 'sont conformes'], delai: ['à l\'heure', 'sont à l\'heure'], retard: ['de retard', ''], vol: ['pièces', ''], arrets: ['d\'arrêt', ''] }[m];
    if (m === 'rend' || m === 'delai') {
      ins.push(['ok', 'ti-medal', `${esc(best.m.name)} : la plus régulière`, `${best.tot.txt} ${lab[0]} sur la période (${best.tot.n} OF).`]);
      if (m === 'rend' && worst.tot.v >= .98) ins.length = 0, ins.push(['ok', 'ti-circle-check', 'Toutes les machines tiennent le rendement', `Au moins ${Math.round(worst.tot.v * 100)} % de pièces conformes partout (${esc(best.m.name)} : ${best.tot.txt}).`]);
      else if (worst !== best) ins.push([worst.tot.v < (m === 'rend' ? .9 : .7) ? 'crit' : 'warn', 'ti-alert-triangle', `${esc(worst.m.name)} : à surveiller`, `${worst.tot.txt} ${lab[0]} seulement (${worst.tot.n} OF).`]);
    } else if (m === 'retard') {
      ins.push(['ok', 'ti-medal', `${esc(best.m.name)} : la plus ponctuelle`, `${best.tot.txt} de retard moyen.`]);
      if (worst !== best) ins.push([worst.tot.v > 3 ? 'crit' : 'warn', 'ti-alert-triangle', `${esc(worst.m.name)} : la plus en retard`, `${worst.tot.txt} en moyenne par OF.`]);
    } else if (m === 'vol') {
      ins.push(['info', 'ti-package', `${esc(best.m.name)} : la plus productive`, `${best.tot.sub} sur la période.`]);
    } else {
      ins.push(['crit', 'ti-alert-octagon', `${esc(worst.m.name)} : la plus arrêtée`, `${worst.tot.txt} d'arrêt (${worst.tot.n} ${worst.tot.n > 1 ? 'arrêts' : 'arrêt'}).`]);
    }
    // Dérive récente : les 2 dernières périodes contre les 3 précédentes (rendement et délais)
    if (m === 'rend' || m === 'delai' || m === 'retard') {
      let drift = null;
      D.rows.forEach(r => {
        const sl = (a, b) => [].concat(...r.cs.slice(a, b).map(c => c.c ? c.c.l : []));
        const n = r.cs.length, recent = agg(sl(n - 2, n), m, []), prev = agg(sl(n - 5, n - 2), m, []);
        if (!recent || !prev || recent.n < 2 || prev.n < 3) return;
        const dlt = m === 'retard' ? recent.v - prev.v : (prev.v - recent.v) * 100;   // positif = se dégrade
        if (dlt > 0 && (!drift || dlt > drift.dlt)) drift = { r, dlt, recent, prev };
      });
      const seuil = m === 'retard' ? 1.5 : 4;
      if (drift && drift.dlt >= seuil) ins.push(['warn', 'ti-trending-down', `${esc(drift.r.m.name)} décroche récemment`,
        m === 'retard' ? `${drift.recent.txt} ces dernières périodes, contre ${drift.prev.txt} avant.` : `${drift.recent.txt} récemment, contre ${drift.prev.txt} avant : ${Math.round(drift.dlt)} points perdus.`]);
    }
    return ins;
  }

  // ── Affichage ──
  function hero(hue, ico, t, s, st) {
    const h = HUES[hue];
    return `<div class="dz-hero" style="--h1:${h[0]};--h2:${h[1]}"><div class="dz-aurora"></div>
      <div class="dz-hero-main"><span class="dz-ico"><i class="ti ${ico}"></i></span><div><h2>${t}</h2><p>${s}</p></div></div>
      ${st && st.length ? `<div class="dz-stats">${st.map(x => `<div class="dz-stat ${x[2] || ''}"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>` : ''}</div>`;
  }
  function legend(m) {
    const bar = m === 'vol' ? 'linear-gradient(90deg,#E2F4F2,#0B7F79)' : m === 'arrets' ? 'linear-gradient(90deg,#FDECE8,#E25246)' : m === 'retard' ? 'linear-gradient(90deg,#4ABE8C,#F4BE50,#E25246)' : 'linear-gradient(90deg,#E25246,#F4BE50,#4ABE8C)';
    const ends = m === 'vol' ? ['peu', 'beaucoup'] : m === 'arrets' ? ['peu d\'arrêts', 'beaucoup d\'arrêts'] : m === 'retard' ? ['à l\'heure', 'en retard'] : ['à améliorer', 'très bon'];
    return `<div class="ht-leg"><span>${ends[0]}</span><i style="background:${bar}"></i><span>${ends[1]}</span><em><b class="ht-dash"></b> un seul OF dans la case</em></div>`;
  }
  function detail(D) {
    if (!state.sel) return '';
    const [mkey, k] = state.sel, row = D.rows.find(r => r.m.k === mkey); if (!row) return '';
    const c = row.cs.find(x => x.k === k); if (!c || !c.c) return '';
    const L = c.c.l.slice().sort((a, b) => a.d.localeCompare(b.d));
    const lines = L.map(x => `<tr><td>${esc(x.id)}</td><td>${esc(x.produit)}</td><td>${fmt(x.qty)}</td><td>${x.d.split('-').reverse().join('/')}</td>
      <td>${x.ctrl > 0 ? Math.round(Math.min(1, x.conf / x.ctrl) * 100) + ' %' : '—'}</td><td>${x.ot == null ? '—' : x.ot ? 'à l\'heure' : '<b class="ht-late">en retard</b>'}</td><td>${x.ec == null ? '—' : (x.ec > 0 ? '+' : '') + x.ec + ' j'}</td></tr>`).join('');
    const A = c.c.a.map(a => `<tr><td>Arrêt</td><td>${esc(a.cause || '')}</td><td colspan="2">${f1(a.duree_h)} h</td><td colspan="3">${esc(a.note || '')}</td></tr>`).join('');
    return `<section class="st-card ht-detail"><header><h3><i class="ti ti-list-details"></i> ${esc(row.m.name)} · ${bucketFull(k, D.per)}</h3><p>${L.length} OF terminés${c.c.a.length ? ' · ' + c.c.a.length + ' arrêts' : ''}. <a href="#" onclick="heatSel(null);return false">Fermer</a></p></header>
      <div class="ht-tbl"><table><tr><th>OF</th><th>Produit</th><th>Quantité</th><th>Terminé le</th><th>Conformes</th><th>Délai</th><th>Écart</th></tr>${lines}${A}</table></div></section>`;
  }
  function render() {
    const el = document.getElementById('view-heat'); if (!el) return;
    const D = build(), met = METRICS[state.metric];
    const tabs = `<div class="id-tabs">${Object.entries(METRICS).map(([k, v]) => `<button class="${k === state.metric ? 'on' : ''}" onclick="heatSet('metric','${k}')"><i class="ti ${v.ico}"></i>${v.t}</button>`).join('')}
      <span class="ht-per"><button class="${state.per === 'mois' ? 'on' : ''}" onclick="heatSet('per','mois')">Par mois</button><button class="${state.per === 'sem' ? 'on' : ''}" onclick="heatSet('per','sem')">Par semaine</button></span></div>`;
    if (D.empty) { el.innerHTML = hero('blue', 'ti-grid-dots', 'Carte thermique', 'Machine par machine, période par période : où ça décroche, d\'un coup d\'œil.', []) + `<div class="cl-wrap">${tabs}<p class="id-none">Pas encore d'OF terminés pour dessiner la carte.</p></div>`; return; }
    const mx = D.metric === 'vol' || D.metric === 'arrets' ? Math.max(1, ...D.rows.map(r => Math.max(0, ...r.cs.map(c => c.v || 0)))) : 1;
    const cols = D.keys.length, rowsHtml = D.rows.map(r => `<div class="ht-name">${esc(r.m.name)}</div>${r.cs.map(c => {
      if (c.v == null) return `<div class="ht-c ht-empty" title="${esc(r.m.name)} · ${bucketFull(c.k, D.per)} : rien">·</div>`;
      const col = colorOf(D.metric, c.v, mx), few = c.n < 2 && D.metric !== 'arrets' && D.metric !== 'vol', sel = state.sel && state.sel[0] === r.m.k && state.sel[1] === c.k;
      return `<div class="ht-c${few ? ' ht-few' : ''}${sel ? ' ht-sel' : ''}" style="background:${col.bg};color:${col.fg}" onclick="heatSel('${r.m.k}','${c.k}')" title="${esc(r.m.name)} · ${bucketFull(c.k, D.per)} : ${c.txt}${c.sub ? ' (' + c.sub + ')' : ''} · ${c.n} ${D.metric === 'arrets' ? 'arrêt(s)' : 'OF'}">${c.txt}</div>`;
    }).join('')}${r.tot ? `<div class="ht-tot" title="Sur toute la période">${r.tot.txt}</div>` : '<div class="ht-tot">—</div>'}`).join('');
    const foot = `<div class="ht-name ht-foot">Toutes machines</div>${D.cols.map(c => `<div class="ht-c ht-foot">${c ? c.txt : '·'}</div>`).join('')}<div class="ht-tot ht-foot">${D.grand ? D.grand.txt : '—'}</div>`;
    const head = `<div></div>${D.keys.map(k => `<div class="ht-h">${bucketLabel(k, D.per)}</div>`).join('')}<div class="ht-h">Période</div>`;
    const ins = insights(D);
    const stale = (D.nRec && Math.round((new Date() - dOf(D.last)) / 864e5) > 45) ? `<div class="st-in warn"><i class="ti ti-calendar-off"></i><div><b>Les derniers OF terminés datent du ${D.last.split('-').reverse().join('/')}</b><span>La carte s'arrête à cette date. Mettez les archives à jour pour qu'elle reste d'actualité.</span></div></div>` : '';
    const best = D.rows.filter(r => r.tot && r.tot.n >= 3);
    el.innerHTML = hero('blue', 'ti-grid-dots', 'Carte thermique', 'Machine par machine, période par période : où ça décroche, d\'un coup d\'œil.',
      [[D.rows.length, 'machines'], [D.keys.length, D.per === 'mois' ? 'mois affichés' : 'semaines affichées'], [D.grand ? D.grand.txt : '—', met.t.toLowerCase() + ' global']]) + `
      <div class="cl-wrap">
        ${tabs}
        <p class="ht-help"><i class="ti ti-info-circle"></i> ${met.help} Cliquez une case pour voir les OF derrière.</p>
        <div class="st-ins">${stale}${ins.map((x, i) => `<div class="st-in ${x[0]}" style="animation-delay:${i * 80}ms"><i class="ti ${x[1]}"></i><div><b>${x[2]}</b><span>${x[3]}</span></div></div>`).join('')}</div>
        ${D.metric === 'arrets' && !D.rows.length ? '' : `<section class="st-card"><div class="ht-scroll"><div class="ht-grid" style="--cols:${cols}">${head}${rowsHtml}${foot}</div></div>${legend(D.metric)}</section>`}
        ${detail(D)}
      </div>`;
  }
  window.heatSet = (k, v) => { state[k] = v; state.sel = null; render(); };
  window.heatSel = (m, k) => { state.sel = m ? ((state.sel && state.sel[0] === m && state.sel[1] === k) ? null : [m, k]) : null; render(); };
  window.renderHeat = render;
  window.heatCompute = build;
})();
