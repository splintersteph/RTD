// ═══ Statistiques — tour de contrôle de l'atelier ═══════════════════════════
// Remplace l'onglet « Production en cours » ; l'onglet « OFs archivés » garde
// la page d'origine. Lecture seule : aucune donnée n'est modifiée.
(function () {
  const orig = window.renderStatsPage;
  const DAY = 86400000;
  const fmt = n => Math.round(n).toLocaleString('fr');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const t0 = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
  const dOf = iso => new Date(String(iso).slice(0, 10) + 'T12:00:00');
  const AGE_B = [
    { k: '0–7 j', max: 7, c: '#2FB68A' }, { k: '8–14 j', max: 14, c: '#9CCB4E' }, { k: '15–30 j', max: 30, c: '#F0B53C' },
    { k: '31–60 j', max: 60, c: '#E8793A' }, { k: 'plus de 60 j', max: 1e9, c: '#D9453A' },
  ];
  const median = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };

  function tabs(tab) {
    const b = (id, lab, ico) => `<button class="st-tab ${tab === id ? 'on' : ''}" onclick="window._statsTab='${id}';renderStatsPage()"><i class="ti ${ico}"></i>${lab}</button>`;
    return `<div class="st-tabs">${b('encours', 'Production en cours', 'ti-loader-2')}${b('archives', 'OF archivés', 'ti-archive')}</div>`;
  }

  function compute() {
    const today = t0();
    const out = { today };
    out.ofs = ofs.map(o => {
      const e = (o.stageEnteredAt && o.stageEnteredAt[o.stage]) || o.date;
      const age = e ? Math.max(0, Math.round((today - dOf(e)) / DAY)) : 0;
      const client = (typeof detectClientFull === 'function' && detectClientFull(o.produit)) || 'Autre';
      return { o, age, client, late: isBlocked(o), qty: Number(o.qty) || 0 };
    });
    out.pieces = out.ofs.reduce((s, x) => s + x.qty, 0);
    // Performance historique (OF archivés)
    const A = archives || [];
    const jug = A.filter(a => a.conforme_delai === 'Oui' || a.conforme_delai === 'Non');
    out.otd = jug.length ? jug.filter(a => a.conforme_delai === 'Oui').length / jug.length : null;
    out.nJug = jug.length; out.nOui = jug.filter(a => a.conforme_delai === 'Oui').length;
    const q = A.filter(a => a.qty_conf != null && a.qty_ctrl > 0);
    out.qual = q.length ? q.reduce((s, a) => s + a.qty_conf, 0) / q.reduce((s, a) => s + a.qty_ctrl, 0) : null;
    const lts = A.filter(a => a.date && a.archivedAt).map(a => Math.round((dOf(a.archivedAt) - dOf(a.date)) / DAY)).filter(v => v >= 0 && v < 365);
    out.lead = median(lts);
    // Débit hebdomadaire sur les 16 dernières semaines d'activité
    const withD = A.filter(a => a.archivedAt);
    const last = withD.length ? new Date(Math.max(...withD.map(a => dOf(a.archivedAt).getTime()))) : today;
    const mon = d => { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
    const m0 = mon(last), W = 16, weeks = Array.from({ length: W }, (_, i) => ({ d: new Date(m0.getTime() - (W - 1 - i) * 7 * DAY), q: 0, n: 0 }));
    withD.forEach(a => { const idx = W - 1 - Math.round((m0 - mon(dOf(a.archivedAt))) / (7 * DAY)); if (idx >= 0 && idx < W) { weeks[idx].q += Number(a.qty) || 0; weeks[idx].n++; } });
    out.weeks = weeks; out.lastWeek = last;
    const act = weeks.slice(-12); out.debit = act.reduce((s, w) => s + w.q, 0) / 12;
    // Par étape
    out.stages = STAGES.map(st => {
      const l = out.ofs.filter(x => x.o.stage === st.id);
      const buckets = AGE_B.map(() => 0);
      l.forEach(x => { buckets[AGE_B.findIndex(b => x.age <= b.max)]++; });
      return { st, l, n: l.length, qty: l.reduce((s, x) => s + x.qty, 0), avg: l.length ? l.reduce((s, x) => s + x.age, 0) / l.length : 0, buckets, old: l.filter(x => x.age > 30).length };
    });
    // Machines : charge restante en jours de machine (OF en création/usinage)
    const M = {};
    out.ofs.forEach(x => {
      const m = x.o.machine || 'Non assigné'; (M[m] = M[m] || { n: 0, qty: 0, jours: 0, sansTC: 0 });
      M[m].n++; M[m].qty += x.qty;
      if (x.o.stage === 'creation' || x.o.stage === 'usinage') {
        const tc = (typeof lookupTC === 'function') ? lookupTC(x.o.produit) : null;
        if (tc) M[m].jours += x.qty * tc / 3600 / HEURES_PAR_JOUR; else M[m].sansTC++;
      }
    });
    out.machines = Object.entries(M).sort((a, b) => b[1].qty - a[1].qty);
    // Clients
    const C = {};
    out.ofs.forEach(x => { (C[x.client] = C[x.client] || { n: 0, qty: 0 }); C[x.client].n++; C[x.client].qty += x.qty; });
    out.clients = Object.entries(C).sort((a, b) => b[1].qty - a[1].qty);
    return out;
  }

  function insights(d) {
    const L = [];
    const worst = d.stages.filter(s => s.n).sort((a, b) => b.avg - a.avg)[0];
    if (worst && worst.avg > 14) L.push({ t: 'warn', i: 'ti-hourglass', h: `${worst.st.label} : l'étape qui retient le flux`, p: `${worst.n} OF et ${fmt(worst.qty)} pièces y restent en moyenne ${Math.round(worst.avg)} jours${worst.old ? ` (${worst.old} depuis plus de 30 j)` : ''}.` });
    const top = d.clients[0];
    if (top && d.pieces && top[1].qty / d.pieces >= 0.4) L.push({ t: 'info', i: 'ti-users', h: `${top[0]} concentre ${Math.round(top[1].qty / d.pieces * 100)} % de l'en-cours`, p: `${top[1].n} OF sur ${d.ofs.length} : toute variation de leurs commandes se verra directement dans l'atelier.` });
    if (d.debit > 0) { const sem = d.pieces / d.debit; L.push({ t: sem > 12 ? 'warn' : 'info', i: 'ti-gauge', h: `${fmt(d.pieces)} pièces en cours = ${Math.round(sem)} semaines de production`, p: `Au débit moyen de ${fmt(d.debit)} pièces par semaine (12 dernières semaines d'activité). Plus l'en-cours est long, plus le délai client s'allonge.` }); }
    if (d.otd != null) L.push({ t: d.otd >= 0.9 ? 'ok' : d.otd >= 0.7 ? 'warn' : 'crit', i: 'ti-target-arrow', h: `${Math.round(d.otd * 100)} % des OF livrés dans les délais`, p: `${d.nOui} OF à l'heure sur ${d.nJug} évalués. ${d.qual != null ? 'Rendement qualité : ' + (d.qual * 100).toFixed(1).replace('.', ',') + ' %.' : ''}` });
    const frozen = d.ofs.filter(x => x.age > 30).length;
    if (frozen) L.push({ t: 'crit', i: 'ti-snowflake', h: `${frozen} OF n'ont pas bougé depuis plus de 30 jours`, p: `Soit ${Math.round(frozen / Math.max(1, d.ofs.length) * 100)} % de l'en-cours. Vérifiez qu'ils sont bien à jour dans l'outil, ou débloquez-les.` });
    return L.slice(0, 4);
  }

  function ring(pct, color, label, sub) {
    const C = 2 * Math.PI * 38, v = pct == null ? 0 : Math.max(0, Math.min(1, pct));
    return `<div class="st-ring"><svg viewBox="0 0 90 90"><circle class="t" cx="45" cy="45" r="38"/><circle class="v" cx="45" cy="45" r="38" style="stroke:${color};stroke-dasharray:${(v * C).toFixed(1)} ${C.toFixed(1)}"/></svg>
      <div><b>${pct == null ? '—' : Math.round(pct * 100) + ' %'}</b></div></div><div class="st-ring-txt"><b>${label}</b><span>${sub}</span></div>`;
  }

  function render(d) {
    const ins = insights(d);
    const insHtml = ins.length ? `<div class="st-ins">${ins.map((x, i) => `<div class="st-in ${x.t}" style="animation-delay:${i * 80}ms"><i class="ti ${x.i}"></i><div><b>${x.h}</b><span>${x.p}</span></div></div>`).join('')}</div>` : '';

    const perf = `<div class="st-perf">
      <div class="st-pf">${ring(d.otd, d.otd == null ? '#9AA7B2' : d.otd >= 0.9 ? '#1D9E75' : d.otd >= 0.7 ? '#E19A1A' : '#D9453A', 'Livraison dans les délais', d.nJug ? `${d.nOui} sur ${d.nJug} OF évalués` : 'pas de données')}</div>
      <div class="st-pf">${ring(d.qual, d.qual == null ? '#9AA7B2' : d.qual >= 0.97 ? '#1D9E75' : '#E19A1A', 'Rendement qualité', 'pièces conformes / contrôlées')}</div>
      <div class="st-pf big"><b>${d.lead == null ? '—' : d.lead + ' j'}</b><span>délai médian<br>création → archivage</span></div>
      <div class="st-pf big"><b>${fmt(d.debit)}</b><span>pièces par semaine<br>de débit moyen</span></div>
    </div>`;

    // Âge de l'en-cours par étape
    const aging = d.stages.map((s, i) => {
      const tot = Math.max(1, s.n);
      return `<div class="st-age ${s.avg > 30 ? 'hot' : ''}" style="animation-delay:${i * 60}ms">
        <div class="st-age-l"><span class="dot" style="background:${s.st.color}"></span><b>${esc(s.st.label)}</b><small>${s.n} OF · ${fmt(s.qty)} pièces</small></div>
        <div class="st-age-bar">${s.buckets.map((c, k) => c ? `<i style="width:${c / tot * 100}%;background:${AGE_B[k].c}" title="${c} OF · ${AGE_B[k].k}"><span>${c}</span></i>` : '').join('') || '<em>vide</em>'}</div>
        <div class="st-age-r">${s.n ? Math.round(s.avg) + ' j' : '—'}<small>séjour moyen</small></div></div>`;
    }).join('');
    const legend = AGE_B.map(b => `<span><s style="background:${b.c}"></s>${b.k}</span>`).join('');

    // Débit hebdo
    const maxW = Math.max(1, ...d.weeks.map(w => w.q));
    const bars = d.weeks.map((w, i) => `<div class="st-w" title="${fmt(w.q)} pièces · ${w.n} OF"><div><i style="height:${w.q ? Math.max(4, w.q / maxW * 100) : 0}%;animation-delay:${i * 35}ms"></i></div><span>${String(w.d.getDate()).padStart(2, '0')}/${String(w.d.getMonth() + 1).padStart(2, '0')}</span></div>`).join('');

    // Machines
    const maxQ = Math.max(1, ...d.machines.map(([, m]) => m.qty)), maxJ = Math.max(0.0001, ...d.machines.map(([, m]) => m.jours));
    const mach = d.machines.map(([n, m], i) => `<div class="st-m" style="animation-delay:${i * 35}ms"><span class="nm">${esc(n)}</span>
      <div class="bar"><i style="width:${Math.max(3, m.qty / maxQ * 100)}%"></i></div><span class="q">${fmt(m.qty)}</span>
      <span class="j" title="Charge restante à l'usinage en jours de machine (OF en création et usinage)">${m.jours ? (m.jours < 10 ? m.jours.toFixed(1).replace('.', ',') : Math.round(m.jours)) + ' j' : '—'}</span></div>`).join('');

    // Clients (Pareto)
    let cum = 0;
    const cli = d.clients.map(([c, v], i) => { cum += v.qty; const p = v.qty / Math.max(1, d.pieces);
      return `<div class="st-c" style="animation-delay:${i * 40}ms"><span class="nm">${esc(c)}</span><div class="bar"><i style="width:${Math.max(2, p * 100)}%"></i><u style="left:${(cum / Math.max(1, d.pieces) * 100).toFixed(1)}%"></u></div><span class="q">${Math.round(p * 100)} %<small>${v.n} OF</small></span></div>`; }).join('');

    // OF à surveiller : score de risque
    const risk = d.ofs.map(x => {
      const j = (typeof joursEnAttente === 'function') ? joursEnAttente(x.o) : null;
      const reasons = []; let score = 0;
      if (x.late) { reasons.push(['En retard', 'crit']); score += 50; }
      if (j != null && j >= 2) { reasons.push(['En attente ' + j + ' j', 'warn']); score += Math.min(40, j); }
      if (x.age > 60) { reasons.push(['Bloqué ' + x.age + ' j', 'crit']); score += 30; } else if (x.age > 30) { reasons.push(['Immobile ' + x.age + ' j', 'warn']); score += 15; }
      if (!x.o.machine) { reasons.push(['Sans machine', 'warn']); score += 10; }
      return { x, reasons, score };
    }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
    const riskHtml = risk.length ? risk.map((r, i) => `<button class="st-r" style="animation-delay:${i * 50}ms" onclick="openDetail('${esc(r.x.o.id)}')">
      <span class="id">${esc(r.x.o.id)}</span><span class="pr">${esc(r.x.o.produit)}<small>${esc(r.x.client)} · ${fmt(r.x.qty)} pièces</small></span>
      <span class="rs">${r.reasons.slice(0, 2).map(a => `<em class="${a[1]}">${a[0]}</em>`).join('')}</span></button>`).join('')
      : '<p class="st-ok"><i class="ti ti-circle-check"></i>Aucun OF à risque.</p>';

    const card = (t, s, body, cls) => `<section class="st-card ${cls || ''}"><header><h3>${t}</h3>${s ? `<p>${s}</p>` : ''}</header>${body}</section>`;
    return `<div class="st-wrap">
      ${tabs('encours')}
      ${insHtml}
      ${perf}
      <div class="st-grid">
        ${card('Depuis combien de temps les OF attendent-ils ?', 'Âge des OF dans leur étape actuelle. Le vert avance, le rouge stagne.', `<div class="st-ages">${aging}</div><div class="st-leg">${legend}</div>`, 'span2')}
        ${card('OF à surveiller', 'Classés par niveau de risque', `<div class="st-risks">${riskHtml}</div>`)}
        ${card('Débit de l\'atelier', 'Pièces archivées par semaine, sur les 16 dernières semaines d\'activité (jusqu\'au ' + d.lastWeek.toLocaleDateString('fr') + ')', `<div class="st-weeks">${bars}</div>`, 'span2')}
        ${card('Charge des machines', 'Pièces en cours · charge restante à l\'usinage', `<div class="st-ms"><div class="st-mh"><span></span><span></span><span>pièces</span><span>charge</span></div>${mach}</div>`)}
        ${card('Dépendance client', 'Part de l\'en-cours · le trait indique le cumul', `<div class="st-cs">${cli}</div>`, 'span3')}
      </div></div>`;
  }

  window.statsCompute = compute;
  window.renderStatsPage = function () {
    const el = document.getElementById('view-stats'); if (!el) return;
    if (!window._statsTab) window._statsTab = 'encours';
    if (window._statsTab !== 'encours') { return orig.apply(this, arguments); }
    let html;
    try { html = render(compute()); } catch (e) { console.error('[Stats]', e); return orig.apply(this, arguments); }
    const hero = (el.firstElementChild && el.firstElementChild.classList.contains('dz-hero')) ? el.firstElementChild.outerHTML : '';
    el.innerHTML = hero + html;
  };
})();
