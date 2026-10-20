// ═══ Fiabilité machines — méthodes Six Sigma (DMAIC / SPC) ═══════════════════
// À partir de l'historique des OF archivés (écart de livraison, conformité, qualité) :
//  • niveau sigma, DPMO, rendement (FPY) et rendement global (RTY) par machine
//  • indice de capabilité Cpk du respect des délais
//  • carte de contrôle (SPC) et Pareto des retards
//  • simulateur de « délai annoncé » (aussi affiché dans la création d'un OF)
// Lecture seule : aucune donnée n'est modifiée ni sauvegardée.
(function () {
  const DAY = 86400000;
  const fmt = n => Math.round(n).toLocaleString('fr');
  const f1 = n => (Math.round(n * 10) / 10).toLocaleString('fr');
  const f2 = n => (Math.round(n * 100) / 100).toLocaleString('fr');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mk = n => String(n || '').replace(/\s+/g, '').toUpperCase();
  const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const dOf = s => new Date(String(s).slice(0, 10) + 'T12:00:00');
  const addDays = (s, n) => iso(new Date(dOf(s).getTime() + n * DAY));
  const fr = s => dOf(s).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const MIN_N = 5;          // en dessous : « peu de données »
  let TOL = 2;              // tolérance de livraison en jours (limite haute de spécification)
  let sel = 'ALL';          // machine affichée sur la carte de contrôle
  const sim = { ref: '', qty: 10000, machine: '', date: iso(new Date()) };

  // ── Mathématiques Six Sigma ──────────────────────────────────────────────
  function zInv(p) {
    if (p <= 0) return -8; if (p >= 1) return 8;
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239],
      b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572],
      c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783],
      d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const pl = 0.02425; let q, r;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - pl) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  // Niveau sigma « court terme » (convention : décalage de 1,5 σ)
  const sigmaOf = y => Math.max(0, Math.min(6, zInv(Math.min(Math.max(y, 1e-6), 1 - 1e-7)) + 1.5));
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  const sd = a => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1)); };
  const pct = (a, p) => { const s = a.slice().sort((x, y) => x - y); if (!s.length) return null; const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };

  // ── Calculs ──────────────────────────────────────────────────────────────
  function stats(list) {
    const e = list.filter(x => x.ec != null).map(x => x.ec);
    const jug = list.filter(x => x.ot != null), ok = jug.filter(x => x.ot).length;
    const ctrl = list.filter(x => x.ctrl > 0), qc = ctrl.reduce((s, x) => s + x.conf, 0), qk = ctrl.reduce((s, x) => s + x.ctrl, 0);
    const o = { n: list.length, nE: e.length, nJ: jug.length, late: jug.length - ok };
    o.otd = jug.length ? ok / jug.length : null;
    o.mu = e.length ? mean(e) : null; o.sd = e.length ? sd(e) : null;
    o.cpk = (e.length >= MIN_N && o.sd > 0) ? (TOL - o.mu) / (3 * o.sd) : null;
    o.fpy = qk ? Math.min(1, qc / qk) : null;
    o.dpmo = o.fpy != null ? (1 - o.fpy) * 1e6 : null;
    o.sigQ = o.fpy != null ? sigmaOf(o.fpy) : null;
    o.sigD = o.otd != null ? sigmaOf(o.otd) : null;
    o.rty = (o.fpy != null && o.otd != null) ? o.fpy * o.otd : null;
    o.p50 = pct(e, .5); o.p85 = pct(e, .85); o.p95 = pct(e, .95);
    o.pHold = e.length ? e.filter(v => v <= 0).length / e.length : null;
    const seq = list.filter(x => x.ec != null).sort((a, b) => a.d.localeCompare(b.d)).map(x => x.ec);
    o.seq = seq; o.trend = seq.length >= 10 ? mean(seq.slice(-5)) - mean(seq.slice(-10, -5)) : null;
    return o;
  }
  function compute() {
    const A = (typeof archives !== 'undefined' ? archives : []).filter(a => a.machine && a.archivedAt).map(a => ({
      m: a.machine, k: mk(a.machine), d: String(a.archivedAt).slice(0, 10), id: a.id,
      ec: (typeof a.ecart_j === 'number') ? a.ecart_j : null,
      ot: a.conforme_delai === 'Oui' ? true : a.conforme_delai === 'Non' ? false : null,
      ctrl: Number(a.qty_ctrl) || 0, conf: Number(a.qty_conf) || 0, qty: Number(a.qty) || 0,
    }));
    const out = { ok: A.length > 0, all: stats(A), recs: A, by: [] };
    const g = {}; A.forEach(x => { (g[x.k] = g[x.k] || { k: x.k, m: x.m, l: [] }).l.push(x); });
    out.by = Object.values(g).map(x => Object.assign(x, { s: stats(x.l) })).sort((a, b) => (b.s.rty == null ? -1 : b.s.rty) - (a.s.rty == null ? -1 : a.s.rty));
    out.ranked = out.by.filter(x => x.s.n >= MIN_N && x.s.rty != null);
    const tl = out.by.reduce((s, x) => s + x.s.late, 0); out.totalLate = tl;
    return out;
  }
  window.fiabCompute = compute;
  const level = (v, ok, warn) => v == null ? 'na' : v >= ok ? 'ok' : v >= warn ? 'warn' : 'crit';
  const rtyLevel = v => level(v, .85, .65);

  // ── Simulateur de délai annoncé ─────────────────────────────────────────
  function queueDays(mKey) {
    if (!mKey || typeof ofs === 'undefined') return 0;
    const today = new Date(); today.setHours(12, 0, 0, 0); let d = 0;
    ofs.filter(o => mk(o.machine) === mKey && (o.stage === 'creation' || o.stage === 'usinage')).forEach(o => {
      const tc = lookupTC(o.produit); if (!tc) return;
      const th = (Number(o.qty) || 0) * tc / 3600 / HEURES_PAR_JOUR;
      const st = (o.stageEnteredAt && o.stageEnteredAt.usinage) || o.date_usinage_debut;
      const el = (o.stage === 'usinage' && st) ? Math.max(0, (today - dOf(st)) / DAY) : 0;
      d += Math.max(0, th - el);
    });
    return d;
  }
  function simulate(ref, qty, machine, start) {
    if (!ref || !(qty > 0) || typeof lookupCatalogueEntry !== 'function') return null;
    const entry = lookupCatalogueEntry(ref); if (!entry) return { err: 'Référence introuvable dans le catalogue.' };
    const D = window._fiabData || (window._fiabData = compute());
    const m = machine || entry.machine || '', key = mk(m);
    const grp = D.by.find(x => x.k === key), S = (grp && grp.s.nE >= 8) ? grp.s : D.all, own = S === (grp && grp.s);
    const tc = entry.tc || null;
    const usH = tc ? qty * tc / 3600 : null, usD = usH != null ? usH / HEURES_PAR_JOUR : null;
    const q = queueDays(key), begin = q > 0.2 ? addDays(start, Math.ceil(q)) : start;
    const cd = calcDates({ produit: entry.ref, qty, date: begin }), dates = cd.dates;
    const last = STAGES.map(s => dates[s.id]).filter(Boolean).pop() || null;
    const r = { entry, m, start, begin, q, usD, usH, tc, finT: last, usFin: dates.usinage || null, S, own, nEc: S.nE };
    if (!last) { r.err = 'Pas de temps de cycle dans le catalogue pour cette référence : le délai théorique ne peut pas être calculé.'; return r; }
    let pan = 0, dispo = null;
    try { dispo = window.arretsDispo ? window.arretsDispo(m) : null; if (dispo != null && dispo < 1 && usD) pan = Math.ceil(usD * (1 / dispo - 1)); } catch (e) { pan = 0; }
    r.pan = pan; r.dispo = dispo;
    const p50 = Math.max(0, Math.round(S.p50 == null ? 0 : S.p50)), p85 = Math.max(p50, Math.round(S.p85 == null ? 0 : S.p85)) + pan, p95 = Math.max(p85, Math.round(S.p95 == null ? 0 : S.p95) + pan);
    r.d50 = addDays(last, p50); r.d85 = addDays(last, p85); r.d95 = addDays(last, p95); r.p50 = p50; r.p85 = p85; r.p95 = p95;
    r.days = d => Math.round((dOf(d) - dOf(start)) / DAY);
    const fpy = (grp && grp.s.fpy) || D.all.fpy || 1; r.fpy = fpy; r.bonnes = Math.round(qty * fpy); r.lancer = Math.ceil(qty / fpy);
    r.cap = tc ? Math.round(86400 / tc) : null;
    return r;
  }
  function simHtml(ref, qty, machine, start, compact) {
    let r; try { r = simulate(ref, qty, machine, start); } catch (e) { console.error('[Fiab] simulate', e); return ''; }
    if (!r) return `<div class="fb-sim-empty"><i class="ti ti-clock-play"></i>Choisissez une référence et une quantité pour calculer le délai annoncé.</div>`;
    if (r.err && !r.finT) return `<div class="fb-sim-empty warn"><i class="ti ti-alert-circle"></i>${r.err}</div>`;
    const tot = Math.max(1, r.days(r.d95)), seg = (a, b) => Math.max(0, Math.min(tot, b) - a);
    const dQ = Math.max(0, r.days(r.begin)), dU = Math.max(1, r.days(r.usFin || r.finT) - dQ), dT = Math.max(0, r.days(r.finT) - dQ - dU);
    const w = v => (v / tot * 100).toFixed(2) + '%';
    const tl = `<div class="fb-tl">${dQ > 0 ? `<i class="q" style="width:${w(dQ)}" title="Attente de la machine"><span>Attente</span></i>` : ''}<i class="u" style="width:${w(dU)}" title="Usinage"><span>Usinage</span></i>${dT > 0 ? `<i class="c" style="width:${w(dT)}" title="Contrôle et joint"><span>Contrôle</span></i>` : ''}<i class="r" style="width:${w(Math.max(0, r.days(r.d95) - r.days(r.finT)))}" title="Marge de risque"><span>Marge</span></i></div>`;
    const L = (cls, t, d, sub) => `<div class="fb-ch ${cls}"><small>${t}</small><b>${fr(d)}</b><span>${sub}</span></div>`;
    const hold = r.S.pHold != null ? Math.round(r.S.pHold * 100) : null;
    const lv = hold == null ? 'na' : hold >= 80 ? 'ok' : hold >= 55 ? 'warn' : 'crit';
    const src = r.own ? `historique de ${esc(r.m)} (${r.nEc} OF)` : `historique de toutes les machines (${r.nEc} OF)`;
    const kp = `<div class="fb-kp">
      <div><b>${r.usD != null ? f1(r.usD) + ' j' : '—'}</b><span>temps d'usinage${r.usH != null ? ' · ' + fmt(r.usH) + ' h' : ''}</span></div>
      <div><b>${r.q > 0.2 ? '+' + f1(r.q) + ' j' : '0 j'}</b><span>file d'attente sur ${esc(r.m || 'la machine')}</span></div>
      <div class="${lv}"><b>${hold == null ? '—' : hold + ' %'}</b><span>de chances de tenir la date théorique</span></div>
      <div><b>${fmt(r.lancer)}</b><span>à lancer pour ${fmt(qty)} bonnes (rendement ${f1(r.fpy * 100)} %)</span></div>${r.pan > 0 ? `<div class="warn"><b>+${r.pan} j</b><span>de marge pour les arrêts de ${esc(r.m)} (disponibilité ${Math.round(r.dispo * 100)} %)</span></div>` : ''}</div>`;
    if (compact) return `<div class="fb-sim c"><div class="fb-sim-h"><i class="ti ti-clock-bolt"></i><b>Délai annoncé</b><small>${src}</small></div>${tl}
      <div class="fb-chs">${L('t', 'Théorique', r.finT, r.days(r.finT) + ' j')}${L('r', 'À annoncer (85 %)', r.d85, r.days(r.d85) + ' j · +' + r.p85 + ' j de marge')}${L('g', 'Garanti (95 %)', r.d95, r.days(r.d95) + ' j')}</div>${kp}</div>`;
    return `<div class="fb-sim"><div class="fb-sim-h"><i class="ti ti-clock-bolt"></i><b>Délai annoncé pour ${fmt(qty)} pièces de ${esc(r.entry.ref)}</b><small>${src}</small></div>${tl}
      <div class="fb-chs">${L('t', 'Date théorique', r.finT, r.days(r.finT) + ' jours après le lancement')}${L('m', 'Engagement à 50 %', r.d50, 'une chance sur deux')}${L('r', 'À annoncer au client (85 %)', r.d85, r.days(r.d85) + ' j · marge +' + r.p85 + ' j')}${L('g', 'Garanti (95 %)', r.d95, 'marge +' + r.p95 + ' j')}</div>${kp}
      <p class="fb-sim-n"><i class="ti ti-info-circle"></i>La marge vient de l'écart réellement constaté, par le passé, entre la date théorique et la fin réelle (${src}). L'attente de la machine est estimée d'après les OF déjà en création ou en usinage dessus.</p></div>`;
  }
  window.fiabSimHtml = simHtml;

  // ── Pages & graphiques ───────────────────────────────────────────────────
  function ring(v, max, col, txt, label) {
    const C = 2 * Math.PI * 38, p = v == null ? 0 : Math.max(0, Math.min(1, v / max));
    return `<div class="fb-ring"><svg viewBox="0 0 90 90"><circle class="t" cx="45" cy="45" r="38"/><circle class="v" cx="45" cy="45" r="38" style="stroke:${col};stroke-dasharray:${(p * C).toFixed(1)} ${C.toFixed(1)}"/></svg><div><b>${txt}</b></div><small>${label}</small></div>`;
  }
  const COL = { ok: '#1D9E75', warn: '#E19A1A', crit: '#D9453A', na: '#9AA7B2' };
  function spark(seq) {
    const a = seq.slice(-14); if (a.length < 3) return '<svg class="fb-sp" viewBox="0 0 100 26"></svg>';
    const mn = Math.min(...a, 0), mx = Math.max(...a, 0, 1), W = 100, H = 26, X = i => 2 + i / (a.length - 1) * (W - 4), Y = v => 3 + (1 - (v - mn) / (mx - mn || 1)) * (H - 6);
    return `<svg class="fb-sp" viewBox="0 0 100 26"><line x1="0" x2="100" y1="${Y(0)}" y2="${Y(0)}" class="z"/><polyline points="${a.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ')}" /><circle cx="${X(a.length - 1)}" cy="${Y(a[a.length - 1])}" r="2.6"/></svg>`;
  }
  const LV = { ok: 'Fiable', warn: 'À surveiller', crit: 'Instable', na: 'Peu de données' };
  function machineCard(x, i) {
    const s = x.s, lv = s.n < MIN_N ? 'na' : rtyLevel(s.rty), on = sel === x.k;
    return `<article class="fb-m ${lv} ${on ? 'on' : ''}" style="animation-delay:${Math.min(i, 12) * 40}ms" onclick="fiabSel('${x.k}')">
      <header><div><b>${esc(x.m)}</b><small>${s.n} OF analysés</small></div><em class="abc-t ${lv === 'na' ? 'na' : lv}">${LV[lv]}</em></header>
      <div class="fb-rings">${ring(s.fpy, 1, COL[level(s.fpy, .97, .9)], s.fpy == null ? '—' : Math.round(s.fpy * 100) + '%', 'conformes')}${ring(s.otd, 1, COL[level(s.otd, .9, .7)], s.otd == null ? '—' : Math.round(s.otd * 100) + '%', 'à l\'heure')}${ring(s.rty, 1, COL[lv], s.rty == null ? '—' : Math.round(s.rty * 100) + '%', 'tout bon')}</div>
      <div class="fb-mm"><span>Écart moyen<b class="${s.mu > TOL ? 'bad' : ''}">${s.mu == null ? '—' : (s.mu > 0 ? '+' : '') + f1(s.mu) + ' j'}</b></span><span>Tenue des délais<b class="${s.cpk != null && s.cpk < 1 ? 'bad' : ''}">${s.cpk == null ? '—' : s.cpk >= 1.33 ? 'solide' : s.cpk >= 1 ? 'correcte' : 'fragile'}</b></span><span>Tendance<b class="${s.trend == null ? '' : s.trend > 1 ? 'bad' : s.trend < -1 ? 'good' : ''}">${s.trend == null ? '—' : s.trend > 1 ? '↗ se dégrade' : s.trend < -1 ? '↘ s\'améliore' : '→ stable'}</b></span></div>
      ${spark(s.seq)}</article>`;
  }
  function controlChart(D) {
    const recs = D.recs.filter(r => r.ec != null && (sel === 'ALL' || r.k === sel)).sort((a, b) => a.d.localeCompare(b.d));
    if (recs.length < 6) return `<div class="fb-sim-empty"><i class="ti ti-chart-dots"></i>Pas assez d'OF avec écart de délai pour tracer une carte de contrôle (6 minimum).</div>`;
    const v = recs.map(r => r.ec), mu = mean(v), s = sd(v), ucl = mu + 3 * s, lcl = mu - 3 * s;
    const W = 760, H = 270, P = { l: 44, r: 16, t: 14, b: 26 }, iw = W - P.l - P.r, ih = H - P.t - P.b;
    const lo = Math.min(lcl, ...v, 0) - 1, hi = Math.max(ucl, ...v, TOL) + 1;
    const X = i => P.l + i / (v.length - 1) * iw, Y = y => P.t + (1 - (y - lo) / (hi - lo)) * ih;
    const out = v.map(y => y > ucl || y < lcl);
    const run = v.map((_, i) => { if (i < 6) return false; const w = v.slice(i - 6, i + 1); return w.every(y => y > mu) || w.every(y => y < mu); });
    const line = v.map((y, i) => X(i).toFixed(1) + ',' + Y(y).toFixed(1)).join(' ');
    const dots = v.map((y, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(y).toFixed(1)}" r="${out[i] ? 5.5 : 3.6}" class="${out[i] ? 'o' : run[i] ? 'r' : ''}"><title>${esc(recs[i].id)} · ${recs[i].d} · ${y > 0 ? '+' : ''}${y} j</title></circle>`).join('');
    const ticks = [Math.ceil(lo), Math.round(mu), Math.floor(hi)].concat([0]).filter((x, i, a) => a.indexOf(x) === i).map(t => `<text x="${P.l - 7}" y="${Y(t) + 3.5}" text-anchor="end">${t > 0 ? '+' : ''}${t} j</text>`).join('');
    const nOut = out.filter(Boolean).length, nRun = run.filter(Boolean).length;
    const msg = nOut ? `${nOut} OF sortent de la zone habituelle : ce ne sont pas des aléas normaux, il y a une cause précise (panne, réglage, manque de matière…) à rechercher.`
      : nRun ? `Le processus reste dans ses limites, mais ${nRun} OF d'affilée se situent du même côté de la moyenne : une dérive est en cours.`
        : `Le processus est stable (aucun point hors limites). ${mu > TOL ? `Mais il est décalé de ${f1(mu)} jours en moyenne par rapport au planning : le planning est systématiquement trop optimiste.` : 'Il est bien centré sur la date théorique.'}`;
    return `<svg class="fb-cc" viewBox="0 0 ${W} ${H}" role="img" aria-label="Régularité des écarts de livraison">
      <rect x="${P.l}" y="${Y(ucl)}" width="${iw}" height="${Math.max(0, Y(lcl) - Y(ucl))}" fill="#35D6C4" opacity=".07"/>
      <line x1="${P.l}" x2="${W - P.r}" y1="${Y(0)}" y2="${Y(0)}" class="zero"/>
      <line x1="${P.l}" x2="${W - P.r}" y1="${Y(TOL)}" y2="${Y(TOL)}" class="usl"/><text x="${W - P.r}" y="${Y(TOL) + 13}" text-anchor="end" class="lb usl">Tolérance +${TOL} j</text>
      <line x1="${P.l}" x2="${W - P.r}" y1="${Y(ucl)}" y2="${Y(ucl)}" class="lim"/><text x="${P.l + 4}" y="${Y(ucl) - 5}" class="lb">Plafond habituel ${f1(ucl)} j</text>
      <line x1="${P.l}" x2="${W - P.r}" y1="${Y(mu)}" y2="${Y(mu)}" class="mu"/><text x="${P.l + 4}" y="${Y(mu) - 5}" class="lb mu">Moyenne ${mu > 0 ? '+' : ''}${f1(mu)} j</text>
      <line x1="${P.l}" x2="${W - P.r}" y1="${Y(lcl)}" y2="${Y(lcl)}" class="lim"/><text x="${P.l + 4}" y="${Y(lcl) + 12}" class="lb">Plancher habituel ${f1(lcl)} j</text>
      ${ticks}<polyline points="${line}" class="ln"/>${dots}<text x="${P.l}" y="${H - 6}">${recs[0].d}</text><text x="${W - P.r}" y="${H - 6}" text-anchor="end">${recs[recs.length - 1].d}</text></svg>
      <p class="fb-cc-m ${nOut ? 'crit' : nRun ? 'warn' : 'ok'}"><i class="ti ${nOut ? 'ti-alert-triangle' : nRun ? 'ti-trending-up' : 'ti-circle-check'}"></i>${msg}</p>`;
  }
  function pareto(D) {
    const L = D.by.filter(x => x.s.late > 0).sort((a, b) => b.s.late - a.s.late), tot = L.reduce((s, x) => s + x.s.late, 0);
    if (!tot) return '<div class="fb-sim-empty"><i class="ti ti-circle-check"></i>Aucun OF en retard dans l\'historique.</div>';
    let cum = 0, mx = L[0].s.late;
    return `<div class="fb-par">${L.slice(0, 10).map((x, i) => { cum += x.s.late; const c = Math.round(cum / tot * 100);
      return `<div class="fb-pr" style="animation-delay:${i * 50}ms"><span class="nm">${esc(x.m)}</span><div class="bar"><i style="width:${x.s.late / mx * 100}%"></i></div><b>${x.s.late}</b><em class="${c <= 80 ? 'vit' : ''}">${c} %</em></div>`; }).join('')}</div>
      <p class="fb-par-n">La colonne de droite est le cumul : les premières machines (jusqu'à 80 %) concentrent l'essentiel des retards. C'est là qu'une action d'amélioration rapporte le plus.</p>`;
  }

  function render() {
    const el = document.getElementById('view-fiab'); if (!el) return;
    const hero = (el.firstElementChild && el.firstElementChild.classList.contains('dz-hero')) ? el.firstElementChild.outerHTML : '';
    let D; try { D = window._fiabData = compute(); } catch (e) { console.error('[Fiab]', e); D = { ok: false }; }
    if (!D.ok) { el.innerHTML = hero + '<div class="cl-wrap"><div class="cl-empty"><i class="ti ti-database-off"></i><b>Pas encore d\'historique</b><span>Archivez des OF pour mesurer la fiabilité des machines.</span></div></div>'; return; }
    const A = D.all, R = D.ranked, best = R[0], worst = R[R.length - 1], ins = [];
    if (A.sigQ != null) ins.push([level(A.sigQ, 4, 3) === 'ok' ? 'ok' : 'warn', 'ti-diamond', `Qualité : ${f1(A.fpy * 100)} % de pièces conformes`, `Environ ${fmt(Math.round((1 - A.fpy) * 1000))} pièces non conformes pour 1 000 produites. Plus ce chiffre est bas, mieux c'est.`]);
    if (A.sigD != null) ins.push([level(A.sigD, 4, 2.5) === 'ok' ? 'ok' : level(A.sigD, 4, 2.5), 'ti-target-arrow', `Délais : ${Math.round(A.otd * 100)} % des OF livrés à l'heure`, `Le respect des délais est le point faible : ${A.late} OF sur ${A.nJ} ont été livrés en retard.`]);
    if (A.mu != null) ins.push([A.mu > TOL ? 'warn' : 'ok', 'ti-clock-exclamation', `${A.mu > 0 ? '+' : ''}${f1(A.mu)} jours d'écart moyen`, A.mu > 0 ? 'Les OF finissent en moyenne après la date théorique : le planning est trop optimiste. Le délai annoncé doit intégrer cette marge.' : 'Les OF finissent en général avant la date théorique.']);
    if (best && worst && best !== worst) ins.push(['info', 'ti-trophy', `${best.m} la plus fiable, ${worst.m} la moins fiable`, `« Tout bon » (conforme ET à l'heure) : ${Math.round(best.s.rty * 100)} % contre ${Math.round(worst.s.rty * 100)} %. Étudiez ce que fait la première pour le reproduire sur la seconde.`]);
    const chips = ['ALL'].concat(D.by.filter(x => x.s.nE >= 3).map(x => x.k)), nm = k => k === 'ALL' ? 'Toutes les machines' : (D.by.find(x => x.k === k) || {}).m;
    el.innerHTML = hero + `<div class="cl-wrap">
      <div class="st-ins">${ins.slice(0, 4).map((x, i) => `<div class="st-in ${x[0]}" style="animation-delay:${i * 80}ms"><i class="ti ${x[1]}"></i><div><b>${x[2]}</b><span>${x[3]}</span></div></div>`).join('')}</div>
      <section class="st-card fb-simcard"><header><h3><i class="ti ti-clock-bolt"></i> Simulateur de délai annoncé</h3><p>Entrez ce que vous voulez fabriquer : le simulateur calcule le délai théorique, puis ajoute la marge que l'historique de la machine rend nécessaire. Le même calcul apparaît quand vous créez un OF.</p></header>
        <div class="fb-form">
          <label>Référence<input id="fb-ref" list="fb-dl" placeholder="ex : W2, K07 L27…" value="${esc(sim.ref)}" oninput="fiabSim()"><datalist id="fb-dl">${(typeof catalogue !== 'undefined' ? catalogue : []).map(c => `<option value="${esc(c.ref)}">`).join('')}</datalist></label>
          <label>Quantité<input id="fb-qty" type="number" min="1" value="${sim.qty}" oninput="fiabSim()"></label>
          <label>Machine<select id="fb-mach" onchange="fiabSim()"><option value="">Automatique (catalogue)</option>${(typeof getMachineOrder === 'function' ? getMachineOrder() : []).filter(m => m !== 'Non assigné').map(m => `<option ${m === sim.machine ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select></label>
          <label>Lancement<input id="fb-date" type="date" value="${sim.date}" oninput="fiabSim()"></label></div>
        <div id="fb-sim-out">${simHtml(sim.ref, sim.qty, sim.machine, sim.date)}</div></section>
      <h3 class="cl-h"><i class="ti ti-heartbeat"></i>Carte de santé de chaque machine <small class="fb-sub">classées de la plus fiable à la moins fiable · cliquez pour zoomer</small></h3>
      <div class="fb-ms">${D.by.map(machineCard).join('')}</div>
      <div class="abc-top">
        <section class="st-card"><header class="abc-th"><div><h3>Régularité des délais</h3><p>Chaque point = un OF terminé. Écart entre la fin réelle et la date théorique (en jours).</p></div>
          <label class="fb-tol">Tolérance <input type="number" min="0" max="15" value="${TOL}" onchange="fiabTol(this.value)"> j</label></header>
          <div class="abc-f fb-chips">${chips.map(k => `<button class="${sel === k ? 'on' : ''}" onclick="fiabSel('${k}')">${esc(nm(k))}</button>`).join('')}</div>${controlChart(D)}</section>
        <section class="st-card"><header><h3>Où se concentrent les retards ?</h3><p>Nombre d'OF livrés en retard, par machine.</p></header>${pareto(D)}</section></div>
      <section class="st-card"><header><h3>Comment lire ces indicateurs</h3></header><div class="cl-gl" style="margin-top:12px">
        <dl><dt>Conformes</dt><dd>Part des pièces bonnes du premier coup, sans retouche ni rebut.</dd></dl>
        <dl><dt>À l'heure</dt><dd>Part des OF terminés au plus tard à la date prévue, plus la tolérance indiquée.</dd></dl>
        <dl><dt>Tout bon</dt><dd>Part des OF à la fois conformes ET à l'heure. C'est la vraie fiabilité d'une machine.</dd></dl>
        <dl><dt>Tenue des délais</dt><dd>Solide : la machine tient ses dates avec de la marge. Fragile : des retards reviennent régulièrement.</dd></dl>
        <dl><dt>Zone habituelle</dt><dd>Les écarts de délai normaux. Un point rouge, hors de cette zone, mérite une enquête (panne, matière, réglage).</dd></dl>
        <dl><dt>Classement des retards</dt><dd>Quelques machines causent l'essentiel des retards : on s'occupe d'abord de celles du haut de la liste.</dd></dl></div>
        <p class="abc-note"><i class="ti ti-info-circle"></i>Basé sur ${D.recs.length} OF archivés. Le journal des arrêts (page « Arrêts machines ») complète ces chiffres avec les pannes réelles.</p></section>
    </div>`;
  }
  window.fiabSel = k => { sel = (sel === k && k !== 'ALL') ? 'ALL' : k; render(); };
  window.fiabTol = v => { TOL = Math.max(0, Math.min(15, Number(v) || 0)); render(); };
  window.fiabSim = () => {
    const g = id => document.getElementById(id);
    sim.ref = g('fb-ref').value; sim.qty = parseInt(g('fb-qty').value) || 0; sim.machine = g('fb-mach').value; sim.date = g('fb-date').value || iso(new Date());
    const o = g('fb-sim-out'); if (o) o.innerHTML = simHtml(sim.ref, sim.qty, sim.machine, sim.date);
  };
  window.renderFiab = render;

  // ── Délai annoncé dans la création d'un OF ──────────────────────────────
  function refreshBox() {
    const box = document.getElementById('fiab-box'); if (!box) return;
    const g = id => (document.getElementById(id) || {}).value;
    box.innerHTML = simHtml(g('f-produit') || '', parseInt(g('f-qty')) || 0, g('f-machine') || '', g('f-date') || iso(new Date()), true);
  }
  function install() {
    if (typeof window.showForm === 'function' && !window.showForm._fb) {
      const sf = window.showForm;
      window.showForm = function (o) {
        const r = sf.apply(this, arguments);
        try {
          const q = document.getElementById('f-qty'), row = q && q.closest('.form-row');
          if (row && !o && !document.getElementById('fiab-box')) { row.insertAdjacentHTML('afterend', '<div id="fiab-box"></div>'); window._fiabData = compute(); refreshBox();
            ['f-machine', 'f-produit', 'f-date', 'f-qty'].forEach(id => { const e = document.getElementById(id); if (e) { e.addEventListener('input', refreshBox); e.addEventListener('change', refreshBox); } }); }
        } catch (e) { console.error('[Fiab] formulaire', e); }
        return r;
      };
      window.showForm._fb = true;
    }
    if (typeof window.updateTcHint === 'function' && !window.updateTcHint._fb) {
      const u = window.updateTcHint; window.updateTcHint = function () { const r = u.apply(this, arguments); try { refreshBox(); } catch (e) {} return r; }; window.updateTcHint._fb = true;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
