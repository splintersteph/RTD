// ═══ Statistiques — l'historique de production (OF archivés) ═════════════════
// Remplace l'ancienne page : on ne regarde plus l'en-cours, seulement ce qui a été
// produit, à quel rythme, et si l'on a tenu nos promesses. Lecture seule.
(function () {
  const DAY = 86400000;
  const fmt = n => Math.round(n).toLocaleString('fr');
  const f1 = n => (Math.round(n * 10) / 10).toLocaleString('fr');
  const k = n => n >= 1e6 ? f1(n / 1e6) + ' M' : n >= 1e4 ? Math.round(n / 1e3) + ' k' : n >= 1e3 ? f1(n / 1e3) + ' k' : String(Math.round(n));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const dOf = s => new Date(String(s).slice(0, 10) + 'T12:00:00');
  const mkey = s => String(s).slice(0, 7);
  const MN = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const mlab = key => MN[Number(key.slice(5, 7)) - 1] + ' ' + key.slice(2, 4);
  const median = a => { const s = a.slice().sort((x, y) => x - y); if (!s.length) return null; const i = (s.length - 1) / 2; return (s[Math.floor(i)] + s[Math.ceil(i)]) / 2; };
  const pctl = (a, p) => { const s = a.slice().sort((x, y) => x - y); if (!s.length) return null; const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
  const PER = [['all', 'Tout l\'historique'], ['12', '12 mois'], ['6', '6 mois'], ['3', '3 mois']];
  let per = 'all';
  const tc = (v, ok, warn) => v == null ? '#9AA7B2' : v >= ok ? '#1D9E75' : v >= warn ? '#E19A1A' : '#D9453A';

  function recs() {
    return (typeof archives !== 'undefined' ? archives : []).filter(a => a.archivedAt && Number(a.qty) > 0).map(a => ({
      d: String(a.archivedAt).slice(0, 10), mk: mkey(a.archivedAt), id: a.id, prod: a.produit, m: a.machine || '—', q: Number(a.qty) || 0,
      client: (typeof detectClientFull === 'function' && detectClientFull(a.produit)) || 'Autre',
      lead: a.date ? Math.round((dOf(a.archivedAt) - dOf(a.date)) / DAY) : null,
      ot: a.conforme_delai === 'Oui' ? true : a.conforme_delai === 'Non' ? false : null,
      ctrl: Number(a.qty_ctrl) || 0, conf: Number(a.qty_conf) || 0,
    })).filter(r => r.lead == null || (r.lead >= 0 && r.lead < 400));
  }
  function summ(L, weeks) {
    const jug = L.filter(x => x.ot != null), ctrl = L.filter(x => x.ctrl > 0), leads = L.filter(x => x.lead != null).map(x => x.lead);
    const pieces = L.reduce((s, x) => s + x.q, 0), qk = ctrl.reduce((s, x) => s + x.ctrl, 0), qc = ctrl.reduce((s, x) => s + x.conf, 0);
    return { n: L.length, pieces, nJ: jug.length, nOui: jug.filter(x => x.ot).length, otd: jug.length ? jug.filter(x => x.ot).length / jug.length : null,
      qual: qk ? Math.min(1, qc / qk) : null, loss: Math.max(0, qk - qc), qk, lead: median(leads), p90: pctl(leads, .9), perWeek: weeks > 0 ? pieces / weeks : null };
  }
  function compute() {
    const all = recs(); if (!all.length) return { ok: false };
    const last = new Date(Math.max(...all.map(r => dOf(r.d).getTime()))), first = new Date(Math.min(...all.map(r => dOf(r.d).getTime())));
    const N = per === 'all' ? null : Number(per);
    const start = N ? new Date(last.getFullYear(), last.getMonth() - N + 1, 1, 12) : first;
    const L = all.filter(r => dOf(r.d) >= start);
    const weeks = Math.max(1, (last - (N ? start : first)) / (7 * DAY));
    const o = { ok: true, last, start: N ? start : first, N, L, weeks, s: summ(L, weeks) };
    if (N) { const ps = new Date(start.getFullYear(), start.getMonth() - N, 1, 12); const P = all.filter(r => dOf(r.d) >= ps && dOf(r.d) < start); const pw = (start - (ps > first ? ps : first)) / (7 * DAY); o.prev = (P.length && pw >= N * 4.345 * 0.75) ? summ(P, pw) : null; }
    // mois
    const mm = {}; L.forEach(r => { (mm[r.mk] = mm[r.mk] || []).push(r); });
    const keys = []; { const c = new Date(o.start.getFullYear(), o.start.getMonth(), 1, 12); while (c <= last) { keys.push(c.getFullYear() + '-' + String(c.getMonth() + 1).padStart(2, '0')); c.setMonth(c.getMonth() + 1); } }
    o.months = keys.map(key => { const l = mm[key] || []; const s = summ(l, 4.345); return { key, n: l.length, pieces: s.pieces, otd: s.otd, lead: s.lead, p90: s.p90 }; });
    // machines × mois
    const mg = {}; L.forEach(r => { const m = mg[r.m] = mg[r.m] || { name: r.m, tot: 0, by: {} }; m.tot += r.q; m.by[r.mk] = (m.by[r.mk] || 0) + r.q; });
    o.machines = Object.values(mg).sort((a, b) => b.tot - a.tot);
    // clients
    const cg = {}; L.forEach(r => { (cg[r.client] = cg[r.client] || []).push(r); });
    o.clients = Object.entries(cg).map(([name, l]) => ({ name, s: summ(l, weeks) })).sort((a, b) => b.s.pieces - a.s.pieces);
    // références
    const pg = {}; L.forEach(r => { const key = r.prod; (pg[key] = pg[key] || { name: key, client: r.client, l: [] }).l.push(r); });
    o.prods = Object.values(pg).map(x => Object.assign(x, { s: summ(x.l, weeks) })).sort((a, b) => b.s.pieces - a.s.pieces);
    // histogramme de délais
    const B = [['≤ 1 sem.', 7], ['8 – 14 j', 14], ['15 – 21 j', 21], ['22 – 30 j', 30], ['31 – 45 j', 45], ['> 45 j', 1e9]];
    o.hist = B.map(() => 0); const lt = L.filter(r => r.lead != null); lt.forEach(r => { o.hist[B.findIndex(b => r.lead <= b[1])]++; }); o.histL = B.map(b => b[0]); o.nLead = lt.length;
    return o;
  }
  window.statsHist = compute;

  function insights(o) {
    const s = o.s, p = o.prev, I = [], mo = o.months.filter(m => m.n);
    const dlt = (a, b) => (a == null || b == null || !b) ? null : (a - b) / b;
    if (s.perWeek != null) { const d = p ? dlt(s.perWeek, p.perWeek) : null;
      I.push({ t: d == null ? 'info' : d >= 0 ? 'ok' : d > -.15 ? 'warn' : 'crit', i: 'ti-gauge', h: `${fmt(s.perWeek)} pièces par semaine en moyenne`, p: `${fmt(s.pieces)} pièces produites en ${s.n} OF.${d != null ? ` C'est ${d >= 0 ? '+' : ''}${Math.round(d * 100)} % par rapport à la période précédente.` : ''}` }); }
    if (s.otd != null) { const d = p && p.otd != null ? (s.otd - p.otd) * 100 : null;
      I.push({ t: s.otd >= .9 ? 'ok' : s.otd >= .75 ? 'warn' : 'crit', i: 'ti-target-arrow', h: `${Math.round(s.otd * 100)} % des OF livrés dans les délais`, p: `${s.nJ - s.nOui} OF sur ${s.nJ} évalués sont arrivés en retard.${d != null ? ` ${d >= 0 ? 'Mieux' : 'Moins bien'} que la période précédente (${d >= 0 ? '+' : ''}${f1(d)} points).` : ''} Un bon niveau se situe au-dessus de 90 %.` }); }
    if (s.lead != null && s.p90 != null) I.push({ t: 'info', i: 'ti-clock-check', h: `Un OF prend ${Math.round(s.lead)} jours, 9 sur 10 sont finis en ${Math.round(s.p90)} jours`, p: `Le délai de ${Math.round(s.p90)} jours est donc celui qu'on peut promettre à un client avec 90 % de certitude. Au-delà de la médiane, on parie.` });
    const top = o.clients[0]; if (top && s.pieces) { const sh = top.s.pieces / s.pieces, t3 = o.machines.slice(0, 3).reduce((a, m) => a + m.tot, 0) / s.pieces;
      I.push({ t: sh > .5 ? 'warn' : 'info', i: 'ti-users', h: `${top.name} = ${Math.round(sh * 100)} % des pièces produites`, p: `${o.clients.length} clients au total. Les 3 machines les plus chargées font ${Math.round(t3 * 100)} % du volume : ${o.machines.slice(0, 3).map(m => m.name).join(', ')}.` }); }
    const bad = o.clients.filter(c => c.s.qk > 2000 && c.s.qual != null).sort((a, b) => a.s.qual - b.s.qual)[0];
    if (bad && bad.s.qual < .985) I.push({ t: 'warn', i: 'ti-alert-hexagon', h: `Pertes qualité : ${bad.name} à ${f1(bad.s.qual * 100)} % de conformité`, p: `${fmt(bad.s.loss)} pièces non conformes sur ${fmt(bad.s.qk)} contrôlées. C'est le client où le rendement est le plus faible.` });
    if (mo.length >= 3) { const best = mo.slice().sort((a, b) => b.pieces - a.pieces)[0]; I.push({ t: 'info', i: 'ti-calendar-star', h: `Meilleur mois : ${mlab(best.key)}`, p: `${fmt(best.pieces)} pièces en ${best.n} OF${best.otd != null ? `, ${Math.round(best.otd * 100)} % à l'heure` : ''}. C'est la capacité réellement démontrée de l'atelier.` }); }
    return I.slice(0, 4);
  }

  function ring(v, color, label, sub, text) {
    const C = 2 * Math.PI * 38, p = v == null ? 0 : Math.max(0, Math.min(1, v));
    return `<div class="st-ring"><svg viewBox="0 0 90 90"><circle class="t" cx="45" cy="45" r="38"/><circle class="v" cx="45" cy="45" r="38" style="stroke:${color};stroke-dasharray:${(p * C).toFixed(1)} ${C.toFixed(1)}"/></svg><div><b>${text}</b></div></div><div class="st-ring-txt"><b>${label}</b><span>${sub}</span></div>`;
  }
  const delta = (a, b, unit, good) => { if (a == null || b == null) return ''; const d = a - b; if (Math.abs(d) < .005) return ''; const up = d > 0, ok = good === 'up' ? up : !up; return `<em class="h-d ${ok ? 'ok' : 'bad'}">${up ? '▲' : '▼'} ${unit === '%' ? f1(Math.abs(d) * 100) + ' pts' : f1(Math.abs(d)) + ' ' + unit}</em>`; };

  function render() {
    const el = document.getElementById('view-stats'); if (!el) return;
    const hero = (el.firstElementChild && el.firstElementChild.classList.contains('dz-hero')) ? el.firstElementChild.outerHTML : '';
    const o = compute();
    if (!o.ok) { el.innerHTML = hero + '<div class="cl-wrap"><div class="cl-empty"><i class="ti ti-archive-off"></i><b>Aucun OF archivé</b><span>Archivez des OF pour voir les statistiques de production.</span></div></div>'; return; }
    const s = o.s, p = o.prev, ins = insights(o);
    const tabs = `<div class="st-tabs">${PER.map(x => `<button class="st-tab ${per === x[0] ? 'on' : ''}" onclick="statsPer('${x[0]}')">${x[1]}</button>`).join('')}<span class="h-span">${o.start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} → ${o.last.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span></div>`;
    const perf = `<div class="st-perf">
      <div class="st-pf">${ring(s.otd, tc(s.otd, .9, .75), 'Livraison dans les délais', s.nJ ? `${s.nOui} sur ${s.nJ} OF ${p ? delta(s.otd, p.otd, '%', 'up') : ''}` : 'aucun OF évalué', s.otd == null ? '—' : Math.round(s.otd * 100) + ' %')}</div>
      <div class="st-pf">${ring(s.qual, tc(s.qual, .985, .96), 'Rendement qualité', `pièces conformes / contrôlées ${p ? delta(s.qual, p.qual, '%', 'up') : ''}`, s.qual == null ? '—' : f1(s.qual * 100) + ' %')}</div>
      <div class="st-pf big"><b>${s.lead == null ? '—' : Math.round(s.lead) + ' j'}</b><span>délai médian création → archivage ${p ? delta(s.lead, p.lead, 'j', 'down') : ''}<br>9 OF sur 10 en moins de ${s.p90 == null ? '—' : Math.round(s.p90)} j</span></div>
      <div class="st-pf big"><b>${s.perWeek == null ? '—' : fmt(s.perWeek)}</b><span>pièces par semaine ${p && p.perWeek ? `<em class="h-d ${s.perWeek >= p.perWeek ? 'ok' : 'bad'}">${s.perWeek >= p.perWeek ? '▲' : '▼'} ${Math.abs(Math.round((s.perWeek / p.perWeek - 1) * 100))} %</em>` : ''}<br>${fmt(s.pieces)} pièces · ${s.n} OF</span></div></div>`;
    // sorties mensuelles
    const mxP = Math.max(1, ...o.months.map(m => m.pieces));
    const bars = o.months.map((m, i) => `<div class="h-mo" style="animation-delay:${i * 35}ms"><span class="v">${m.n ? k(m.pieces) : ''}</span><div class="bw"><i style="height:${Math.max(m.n ? 3 : 0, m.pieces / mxP * 100)}%" title="${mlab(m.key)} : ${fmt(m.pieces)} pièces, ${m.n} OF"></i></div>
      <em class="o" style="--c:${tc(m.otd, .9, .75)}">${m.otd == null ? '–' : Math.round(m.otd * 100) + '%'}</em><span class="l">${mlab(m.key).split(' ')[0]}</span></div>`).join('');
    // histogramme délais
    const mxH = Math.max(1, ...o.hist), hist = o.hist.map((v, i) => `<div class="h-hr" style="animation-delay:${i * 50}ms"><span>${o.histL[i]}</span><div class="bar"><i style="width:${v / mxH * 100}%;background:${['#2FB68A', '#9CCB4E', '#F0B53C', '#E8793A', '#D9453A', '#A32D2D'][i]}"></i></div><b>${v}</b><em>${o.nLead ? Math.round(v / o.nLead * 100) : 0} %</em></div>`).join('');
    // tendance des délais
    const lm = o.months.filter(m => m.lead != null);
    let trend = '';
    if (lm.length >= 3) { const W = 520, H = 170, P = { l: 34, r: 10, t: 10, b: 24 }, mx = Math.max(...lm.map(m => m.p90 || m.lead), 1) * 1.1, X = i => P.l + i / (lm.length - 1) * (W - P.l - P.r), Y = v => P.t + (1 - v / mx) * (H - P.t - P.b);
      const l1 = lm.map((m, i) => X(i).toFixed(1) + ',' + Y(m.lead).toFixed(1)).join(' '), l2 = lm.map((m, i) => X(i).toFixed(1) + ',' + Y(m.p90).toFixed(1)).join(' ');
      trend = `<svg class="h-tr" viewBox="0 0 ${W} ${H}">${[0, .5, 1].map(f => `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(mx * f)}" y2="${Y(mx * f)}" class="g"/><text x="${P.l - 6}" y="${Y(mx * f) + 3}" text-anchor="end">${Math.round(mx * f)} j</text>`).join('')}
      <polyline points="${l2}" class="p90"/><polyline points="${l1}" class="med"/>${lm.map((m, i) => `<circle cx="${X(i)}" cy="${Y(m.lead)}" r="3.3" class="med"><title>${mlab(m.key)} : médiane ${Math.round(m.lead)} j · 90 % en ${Math.round(m.p90)} j</title></circle>`).join('')}
      <text x="${P.l}" y="${H - 6}">${mlab(lm[0].key)}</text><text x="${W - P.r}" y="${H - 6}" text-anchor="end">${mlab(lm[lm.length - 1].key)}</text></svg>
      <div class="st-leg"><span><s style="background:#0B7F79"></s>Délai médian</span><span><s style="background:#E8793A"></s>9 OF sur 10 en moins de…</span></div>`; }
    else trend = '<div class="st-ok"><i class="ti ti-info-circle"></i>Pas assez de mois pour une tendance.</div>';
    // heatmap machines × mois
    const mh = o.machines.slice(0, 14), mxC = Math.max(1, ...mh.flatMap(m => Object.values(m.by)));
    const heat = `<div class="h-hm" style="grid-template-columns:78px repeat(${o.months.length},minmax(0,1fr)) 64px"><span></span>${o.months.map(m => `<span class="hh">${mlab(m.key).split(' ')[0]}</span>`).join('')}<span class="hh r">Total</span>
      ${mh.map(m => `<span class="hn">${esc(m.name)}</span>${o.months.map(mo => { const v = m.by[mo.key] || 0; return `<span class="hc ${v ? '' : 'z'}" style="--a:${(v / mxC).toFixed(2)}" title="${esc(m.name)} · ${mlab(mo.key)} : ${fmt(v)} pièces">${v ? k(v) : ''}</span>`; }).join('')}<span class="ht">${k(m.tot)}</span>`).join('')}</div>`;
    // clients
    const mxCl = Math.max(1, ...o.clients.map(c => c.s.pieces)), cl = o.clients.slice(0, 9).map((c, i) => `<div class="h-cl" style="animation-delay:${i * 45}ms"><span class="nm">${esc(c.name)}</span><div class="bar"><i style="width:${c.s.pieces / mxCl * 100}%"></i></div><b>${k(c.s.pieces)}<small>${Math.round(c.s.pieces / s.pieces * 100)} %</small></b><em style="--c:${tc(c.s.otd, .9, .75)}">${c.s.otd == null ? '–' : Math.round(c.s.otd * 100) + ' %'}</em><em style="--c:${tc(c.s.qual, .985, .96)}">${c.s.qual == null ? '–' : f1(c.s.qual * 100) + ' %'}</em></div>`).join('');
    // références
    const pr = o.prods.slice(0, 10).map(x => `<tr><td><b>${esc(x.name)}</b><small>${esc(x.client)}</small></td><td class="n">${x.s.n}</td><td class="n">${fmt(x.s.pieces)}</td><td class="n">${x.s.lead == null ? '—' : Math.round(x.s.lead) + ' j'}</td><td class="n"><em class="h-pill" style="--c:${tc(x.s.otd, .9, .75)}">${x.s.otd == null ? '–' : Math.round(x.s.otd * 100) + ' %'}</em></td><td class="n"><em class="h-pill" style="--c:${tc(x.s.qual, .985, .96)}">${x.s.qual == null ? '–' : f1(x.s.qual * 100) + ' %'}</em></td></tr>`).join('');
    // pertes
    const lossC = o.clients.filter(c => c.s.loss > 0).sort((a, b) => b.s.loss - a.s.loss).slice(0, 6), mxL = Math.max(1, ...lossC.map(c => c.s.loss));
    const loss = lossC.length ? lossC.map((c, i) => `<div class="h-cl l" style="animation-delay:${i * 45}ms"><span class="nm">${esc(c.name)}</span><div class="bar"><i style="width:${c.s.loss / mxL * 100}%"></i></div><b>${fmt(c.s.loss)}<small>pièces</small></b><em style="--c:${tc(c.s.qual, .985, .96)}">${f1(c.s.qual * 100)} %</em></div>`).join('') : '<div class="st-ok"><i class="ti ti-circle-check"></i>Aucune perte enregistrée.</div>';
    const card = (t, sub, body, cls) => `<section class="st-card ${cls || ''}"><header><h3>${t}</h3><p>${sub}</p></header>${body}</section>`;
    el.innerHTML = hero + `<div class="st-wrap" style="padding:16px 0 20px">${tabs}
      <div class="st-ins">${ins.map((x, i) => `<div class="st-in ${x.t}" style="animation-delay:${i * 80}ms"><i class="ti ${x.i}"></i><div><b>${x.h}</b><span>${x.p}</span></div></div>`).join('')}</div>
      ${perf}
      <div class="st-grid">
        ${card('Production par mois', 'Pièces archivées chaque mois · le pourcentage sous la barre = OF livrés à l\'heure', `<div class="h-mos">${bars}</div>`, 'span2')}
        ${card('Quel délai peut-on promettre ?', `${o.nLead} OF · durée entre création et archivage`, `<div class="h-hist">${hist}</div>`)}
        ${card('Les délais se resserrent-ils ?', 'Délai médian et délai à 90 % par mois', trend, 'span2')}
        ${card('Pertes qualité', 'Pièces non conformes par client', `<div class="h-cls">${loss}</div>`)}
        ${card('Qui occupe les machines, et quand ?', 'Pièces produites par machine et par mois · plus c\'est foncé, plus c\'est chargé', heat, 'span3')}
        ${card('Clients : volume, ponctualité, qualité', 'Pièces produites · livraison à l\'heure · conformité', `<div class="h-cls"><div class="h-clh"><span></span><span></span><span>Volume</span><span>À l'heure</span><span>Qualité</span></div>${cl}</div>`, 'span3')}
        ${card('Les références les plus produites', 'Top 10 sur la période', `<table class="h-tb"><thead><tr><th>Référence</th><th class="n">OF</th><th class="n">Pièces</th><th class="n">Délai</th><th class="n">À l'heure</th><th class="n">Qualité</th></tr></thead><tbody>${pr}</tbody></table>`, 'span3')}
      </div></div>`;
  }
  window.statsPer = p => { per = p; render(); };
  window.renderStatsPage = render;
})();
