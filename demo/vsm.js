// ═══ Chaîne de valeur (VSM) ═══════════════════════════════════════════════
// Le parcours d'un OF de la création à la mise en joint, mesuré sur vos OF terminés :
// combien de temps il travaille vraiment, et combien de temps il attend.
// Lecture seule : ne modifie aucune donnée.
(function () {
  'use strict';
  const fmt = n => Math.round(n).toLocaleString('fr');
  const f1 = n => (Math.round(n * 10) / 10).toLocaleString('fr');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mk = n => String(n || '').replace(/\s+/g, '').toUpperCase();
  const dOf = s => new Date(String(s).slice(0, 10) + 'T12:00:00');
  const DAY = 864e5;
  const HUES = { teal: ['#35D6C4', '#0B7F79'], amber: ['#F7C25B', '#B36B00'], blue: ['#6FB1FF', '#1F5FB4'] };
  const ORDER = ['creation', 'usinage', 'attente', 'controle', 'joint'];
  // Nature de chaque étape : « travail » (la pièce est transformée) ou « attente » (elle patiente)
  const KIND = { creation: 'wait', usinage: 'work', attente: 'wait', controle: 'work', joint: 'work' };
  const NAME = { creation: 'Attente de lancement', usinage: 'Usinage', attente: 'Attente', controle: 'Contrôle', joint: 'Mise en joint' };
  const state = { machine: '' };

  const med = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const pct = (a, p) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };

  function workDays(stage, o) {
    if (stage === 'usinage') { try { const tc = typeof lookupTC === 'function' ? lookupTC(o.produit) : null; if (tc) return (Number(o.qty) || 0) * tc / 3600 / 24; } catch (e) { /* rien */ } return null; }
    if (stage === 'controle' || stage === 'joint') { const h = (typeof DUREES_ETAPES !== 'undefined' && DUREES_ETAPES[stage] != null) ? DUREES_ETAPES[stage] : null; return h == null ? null : h / 24; }
    return 0;
  }
  function compute() {
    const A = (typeof archives !== 'undefined' ? archives : []).filter(a => a.stageEnteredAt && a.archivedAt && (!state.machine || mk(a.machine) === mk(state.machine)));
    const meas = {}, work = {}; ORDER.forEach(k => { meas[k] = []; work[k] = []; });
    A.forEach(o => {
      const s = o.stageEnteredAt, seq = ORDER.filter(k => s[k]).map(k => [k, s[k]]);
      seq.forEach(([k, v], i) => {
        const nxt = i + 1 < seq.length ? seq[i + 1][1] : o.archivedAt; if (!nxt) return;
        const d = Math.round((dOf(nxt) - dOf(v)) / DAY); if (d < 0 || d > 200) return;
        meas[k].push(d); const w = workDays(k, o); if (w != null) work[k].push(w);
      });
    });
    const cur = (typeof ofs !== 'undefined' ? ofs : []).filter(o => !state.machine || mk(o.machine) === mk(state.machine));
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const wip = {}; ORDER.forEach(k => {
      const l = cur.filter(o => o.stage === k), ages = l.map(o => { const e = o.stageEnteredAt && o.stageEnteredAt[k]; return e ? Math.max(0, Math.round((today - dOf(e)) / DAY)) : null; }).filter(x => x != null);
      wip[k] = { n: l.length, pieces: l.reduce((s, o) => s + (Number(o.qty) || 0), 0), oldest: ages.length ? Math.max(...ages) : null, list: l };
    });
    const stages = ORDER.map(k => {
      const m = med(meas[k]), w = Math.min(m == null ? 0 : m, med(work[k]) || 0), wt = m == null ? null : Math.max(0, m - w);
      return { k, n: meas[k].length, med: m, p80: pct(meas[k], .8), work: KIND[k] === 'work' ? w : 0, wait: m == null ? null : (KIND[k] === 'work' ? wt : m), wip: wip[k] };
    });
    const have = stages.filter(s => s.med != null), lead = have.reduce((s, x) => s + x.med, 0), wk = have.reduce((s, x) => s + x.work, 0);
    return { stages, lead, work: wk, eff: lead > 0 ? wk / lead : null, nOF: A.length, ok: have.length >= 3 && lead > 0 };
  }

  const COL = { work: '#0B7F79', wait: '#F0A62B' };
  function tri(s) {
    const w = s.wip, hot = w.oldest != null && s.med != null && w.oldest > Math.max(2 * s.med, 3);
    return `<div class="vs-tri ${hot ? 'hot' : ''}" onclick="vsmOpen('${s.k}')" title="${w.n} OF actuellement : cliquez pour les voir">
      <svg viewBox="0 0 60 54" aria-hidden="true"><path d="M30 4 L56 50 L4 50 Z"/></svg><b>${w.n}</b><span class="vs-t">${NAME[s.k]}</span>
      <em>${w.n ? fmt(w.pieces) + ' pièces' + (w.oldest != null ? ' · le plus ancien : ' + w.oldest + ' j' : '') : 'vide'}</em></div>`;
  }
  function box(s, bn) {
    const st = typeof STAGES !== 'undefined' ? STAGES.find(x => x.id === s.k) : null, w = s.wip;
    return `<div class="vs-box ${bn ? 'bn' : ''}" onclick="vsmOpen('${s.k}')" title="Cliquez pour voir les OF en cours">
      <header><i class="ti ${st ? st.icon : 'ti-tool'}"></i>${NAME[s.k]}</header>
      <dl><div><dt>Durée réelle</dt><dd>${s.med == null ? '—' : f1(s.med) + ' j'}</dd></div>
      <div><dt>Travail effectif</dt><dd>${s.work ? (s.work < 1 ? Math.round(s.work * 24) + ' h' : f1(s.work) + ' j') : '—'}</dd></div>
      <div><dt>Souvent jusqu'à</dt><dd>${s.p80 == null ? '—' : f1(s.p80) + ' j'}</dd></div>
      <div><dt>OF mesurés</dt><dd>${s.n}</dd></div></dl>
      <footer><i class="ti ti-player-play"></i> ${w.n} OF en cours${w.n ? ' · ' + fmt(w.pieces) + ' pièces' : ''}</footer></div>`;
  }
  const arrow = '<div class="vs-ar"><i></i><i></i><i></i></div>';

  function ladder(D) {
    const seg = [];
    D.stages.forEach(s => {
      if (s.med == null) return;
      if (s.wait > 0.05) seg.push({ t: 'wait', d: s.wait, l: NAME[s.k] });
      if (s.work > 0.001) seg.push({ t: 'work', d: s.work, l: NAME[s.k] });
    });
    const tot = seg.reduce((a, x) => a + x.d, 0) || 1;
    return `<div class="vs-lad">${seg.map((x, i) => `<div class="vs-seg ${x.t}" style="flex:${Math.max(x.d, tot * 0.012)}" title="${x.l} : ${x.t === 'wait' ? 'attente' : 'travail'} ${x.d < 1 ? Math.round(x.d * 24) + ' h' : f1(x.d) + ' j'}"><b>${x.d >= tot * 0.05 ? (x.d < 1 ? Math.round(x.d * 24) + ' h' : f1(x.d) + ' j') : ''}</b><span>${x.d >= tot * 0.09 ? x.l : ''}</span></div>`).join('')}</div>`;
  }
  function insights(D) {
    const ins = [], st = D.stages.filter(s => s.med != null);
    const waitMax = st.slice().sort((a, b) => b.wait - a.wait)[0];
    if (waitMax && waitMax.wait >= 1) ins.push(['crit', 'ti-hourglass', `${esc(NAME[waitMax.k])} : là où ça attend le plus`, `${f1(waitMax.wait)} jours d'attente en médiane, soit ${Math.round(waitMax.wait / D.lead * 100)} % du parcours. Réduire cette attente raccourcit le plus le délai.`]);
    const spread = st.filter(s => s.n >= 6 && s.p80 != null && s.med > 0).sort((a, b) => (b.p80 - b.med) - (a.p80 - a.med))[0];
    if (spread && spread.p80 - spread.med >= 2) ins.push(['warn', 'ti-chart-histogram', `${esc(NAME[spread.k])} : un délai très variable`, `En général ${f1(spread.med)} j, mais 1 OF sur 5 dépasse ${f1(spread.p80)} j. La variabilité est ce qui rend les dates de livraison difficiles à promettre.`]);
    const busy = D.stages.slice().sort((a, b) => b.wip.pieces - a.wip.pieces)[0];
    if (busy && busy.wip.n) ins.push(['info', 'ti-packages', `${esc(NAME[busy.k])} : le plus de pièces en ce moment`, `${busy.wip.n} OF, ${fmt(busy.wip.pieces)} pièces${busy.wip.oldest != null ? ', le plus ancien depuis ' + busy.wip.oldest + ' j' : ''}.`]);
    return ins;
  }
  function hero(hue, ico, t, s, st) {
    const h = HUES[hue];
    return `<div class="dz-hero" style="--h1:${h[0]};--h2:${h[1]}"><div class="dz-aurora"></div>
      <div class="dz-hero-main"><span class="dz-ico"><i class="ti ${ico}"></i></span><div><h2>${t}</h2><p>${s}</p></div></div>
      ${st && st.length ? `<div class="dz-stats">${st.map(x => `<div class="dz-stat ${x[2] || ''}"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>` : ''}</div>`;
  }
  function machineOptions() {
    const seen = new Map();
    (typeof archives !== 'undefined' ? archives : []).filter(a => a.stageEnteredAt && a.machine).forEach(a => { if (!seen.has(mk(a.machine))) seen.set(mk(a.machine), a.machine); });
    return [...seen.values()].sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
  }

  function render() {
    const el = document.getElementById('view-vsm'); if (!el) return;
    const D = compute(), sel = `<label class="vs-sel">Machine <select onchange="vsmSet(this.value)"><option value="">Toutes</option>${machineOptions().map(m => `<option ${mk(m) === mk(state.machine) ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select></label>`;
    const sub = 'Le voyage d\'un OF, étape par étape : combien de temps il travaille, combien de temps il attend.';
    if (!D.ok) { el.innerHTML = hero('teal', 'ti-route', 'Chaîne de valeur', sub, []) + `<div class="cl-wrap">${sel}<p class="id-none">Pas assez d'OF terminés avec leurs dates d'étapes pour dessiner la chaîne${state.machine ? ' sur cette machine' : ''}. Essayez « Toutes ».</p></div>`; return; }
    const S = Object.fromEntries(D.stages.map(s => [s.k, s])), bnK = D.stages.filter(s => s.med != null).sort((a, b) => b.wait - a.wait)[0];
    const flow = `<div class="vs-flow">
      <div class="vs-end"><i class="ti ti-building-store"></i><b>Commande</b><span>le besoin client</span></div>${arrow}
      ${tri(S.creation)}${arrow}${box(S.usinage, false)}${arrow}${tri(S.attente)}${arrow}${box(S.controle, false)}${arrow}${box(S.joint, false)}${arrow}
      <div class="vs-end ok"><i class="ti ti-truck-delivery"></i><b>Livraison</b><span>OF terminé</span></div></div>`;
    const ins = insights(D);
    el.innerHTML = hero('teal', 'ti-route', 'Chaîne de valeur', sub, [[f1(D.lead) + ' j', 'de la création à la fin'], [Math.round(D.eff * 100) + ' %', 'du temps à travailler', D.eff < .25 ? 'warn' : ''], [D.nOF, 'OF mesurés']]) + `
      <div class="cl-wrap">
        <div class="vs-bar">${sel}<span class="vs-leg"><i class="vs-d work"></i> la pièce travaille <i class="vs-d wait"></i> la pièce attend <i class="vs-tr"></i> OF en attente (stock tampon)</span></div>
        <section class="st-card vs-card"><header><h3><i class="ti ti-route"></i> Le parcours d'un OF</h3><p>Durées mesurées sur ${D.nOF} OF terminés (valeur médiane) ; l'étape qui attend le plus est entourée. Cliquez une étape pour voir les OF qui s'y trouvent maintenant.</p></header>
          <div class="vs-scroll">${flow.replace(/class="vs-box ([^"]*)" onclick="vsmOpen\('([a-z]+)'\)"/g, (m, c, k) => bnK && k === bnK.k ? m.replace('vs-box ', 'vs-box bn ') : m)}</div></section>
        <section class="st-card vs-card"><header><h3><i class="ti ti-timeline"></i> Où passe le temps</h3><p>Un OF met en moyenne <b>${f1(D.lead)} jours</b> de la création à la fin. Il ne travaille vraiment que <b>${D.work < 1 ? Math.round(D.work * 24) + ' heures' : f1(D.work) + ' jours'}</b> (${Math.round(D.eff * 100)} %). Le reste, il attend.</p></header>
          ${ladder(D)}</section>
        ${ins.length ? `<div class="st-ins">${ins.map((x, i) => `<div class="st-in ${x[0]}" style="animation-delay:${i * 80}ms"><i class="ti ${x[1]}"></i><div><b>${x[2]}</b><span>${x[3]}</span></div></div>`).join('')}</div>` : ''}
        <p class="vs-note"><i class="ti ti-info-circle"></i> Le « travail effectif » est le temps prévu dans votre catalogue (cycle × quantité pour l'usinage) et dans les paramètres (contrôle, mise en joint). Tout le reste de la durée mesurée est de l'attente.</p>
        <div id="vs-open"></div>
      </div>`;
  }
  window.vsmSet = v => { state.machine = v; render(); };
  window.vsmOpen = k => {
    const box = document.getElementById('vs-open'); if (!box) return;
    const l = (typeof ofs !== 'undefined' ? ofs : []).filter(o => o.stage === k && (!state.machine || mk(o.machine) === mk(state.machine)));
    box.innerHTML = `<section class="st-card vs-card"><header><h3><i class="ti ti-list-details"></i> ${esc(NAME[k])} : ${l.length} OF en ce moment</h3><p><a href="#" onclick="document.getElementById('vs-open').innerHTML='';return false">Fermer</a></p></header>
      ${l.length ? `<div class="ht-tbl"><table><tr><th>OF</th><th>Produit</th><th>Machine</th><th>Quantité</th><th>Depuis</th></tr>${l.map(o => { const e = o.stageEnteredAt && o.stageEnteredAt[k]; return `<tr style="cursor:pointer" onclick="openDetail('${esc(o.id)}')"><td><b>${esc(o.id)}</b></td><td>${esc(o.produit)}</td><td>${esc(o.machine || '—')}</td><td>${fmt(Number(o.qty) || 0)}</td><td>${e ? e.split('-').reverse().join('/') : '—'}</td></tr>`; }).join('')}</table></div>` : '<p class="id-none">Aucun OF à cette étape.</p>'}</section>`;
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  window.renderVsm = render; window.vsmCompute = compute;
})();
