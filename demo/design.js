// ═══ Design — bandeaux d'en-tête animés pour toutes les pages ═══════════════
// Ajoute en haut de chaque onglet un bandeau avec titre et chiffres clés animés.
// Lecture seule : ne modifie aucune donnée. Si un calcul échoue, le bandeau
// s'affiche simplement sans chiffres.
(function () {
  const fmt = n => Math.round(n).toLocaleString('fr');
  const CFG = {
    pdp:        { id: 'view-pdp',        hue: 'teal',   ico: 'ti-chart-bar',       t: 'Plan directeur de production', s: 'Stock, commandes et couverture pour chaque référence, regroupés par client et par famille.' },
    besoins:    { id: 'view-besoins',    hue: 'red',    ico: 'ti-alert-triangle',  t: 'Besoins et ruptures à venir',  s: 'Les références qui ne pourront plus être livrées, classées de la plus urgente à la moins urgente.' },
    conso:      { id: 'view-conso',      hue: 'violet', ico: 'ti-trending-up',     t: 'Ventes et couverture',         s: 'Combien de mois de ventes votre stock couvre, référence par référence.' },
    commandes:  { id: 'view-commandes',  hue: 'amber',  ico: 'ti-shopping-cart',   t: 'Carnet de commandes',          s: 'Les commandes ouvertes par client, par date de livraison, et le calculateur de commande.' },
    gantt:      { id: 'view-gantt',      hue: 'blue',   ico: 'ti-calendar-stats',  t: 'Planning machines',            s: 'Les OF à l\'usinage, machine par machine, sur le calendrier.' },
    fiab:       { id: 'view-fiab',       hue: 'violet', ico: 'ti-heartbeat',        t: 'Fiabilité des machines',       s: 'Qualité, respect des délais et stabilité de chaque machine, en clair.' },
    abc:        { id: 'view-abc',        hue: 'teal',   ico: 'ti-chart-pie-2',     t: 'Gammes ABC',                   s: 'Les références classées par poids dans les ventes (A, B, C) et par régularité de la demande (X, Y, Z).' },
    stats:      { id: 'view-stats',      hue: 'violet', ico: 'ti-chart-bar',       t: 'Statistiques de production', s: 'Ce qui a été produit, à quel rythme, et si l\'on tient nos promesses.' },
    planning:   { id: 'view-planning',   hue: 'blue',   ico: 'ti-table-import',    t: 'Planning composite',           s: 'Le planning importé depuis votre fichier Excel.' },
    pultrusion: { id: 'view-pultrusion', hue: 'teal',   ico: 'ti-columns-2',       t: 'Pultrusion',                   s: 'Les OF de pultrusion et les besoins prévisionnels.' },
    '3m':       { id: 'view-3m',         hue: 'amber',  ico: 'ti-star',            t: 'Objectif 3M',                  s: 'Avancement des livraisons pour le client 3M par rapport à l\'objectif.' },
    archives:   { id: 'archive-view',    hue: 'green',  ico: 'ti-archive',         t: 'Archives',                     s: 'Tous les OF terminés.' },
  };
  const HUES = { teal: ['#35D6C4', '#0B7F79'], red: ['#FF7A6B', '#B02A22'], violet: ['#A798FF', '#4C3FC1'], amber: ['#F7C25B', '#B36B00'], blue: ['#6FB1FF', '#1F5FB4'], green: ['#6BE3A4', '#1B7A4A'] };

  function stats(view) {
    const out = [];
    const d = (typeof window.cockpitCollect === 'function' && typeof pcData !== 'undefined' && (pcData.commandes || []).length) ? window.cockpitCollect() : null;
    const open = d ? d.lignes.reduce((s, l) => s + l.q, 0) : 0;
    try {
      if (view === 'pdp' && d) {
        const cl = new Set(d.refs.map(r => r.client).filter(Boolean));
        const avec = d.refs.filter(r => r.totalCde > 0), ok = avec.filter(r => !r.rup).length;
        out.push([d.refs.length, 'références'], [cl.size, 'clients et familles'], [avec.length ? Math.round(ok / avec.length * 100) : 100, '% couvertes', true], [open, 'pièces à livrer']);
      } else if (view === 'besoins' && d) {
        const r = d.refs.filter(x => x.rup);
        out.push([r.filter(x => x.joursRup <= 14).length, 'sous 2 semaines', false, 'warn'], [r.filter(x => x.joursRup > 14 && x.joursRup <= 42).length, 'entre 2 et 6 semaines'], [r.reduce((s, x) => s + x.rup.manque, 0), 'pièces manquantes'], [r.length, 'références concernées']);
      } else if (view === 'conso' && d && typeof consoGetCouvertureMois === 'function') {
        let m1 = 0, m3 = 0, tot = 0;
        d.refs.forEach(r => { const m = consoGetCouvertureMois(r.code, r.stock); if (m == null) return; tot++; if (m < 1) m1++; else if (m < 3) m3++; });
        out.push([m1, 'à moins d\'1 mois', false, 'warn'], [m3, 'entre 1 et 3 mois'], [Math.max(0, tot - m1 - m3), 'à plus de 3 mois'], [tot, 'références suivies']);
      } else if (view === 'commandes' && d) {
        const t0 = d.t0.getTime(), ech = d.lignes.filter(l => new Date(l.d + 'T12:00:00') < t0);
        out.push([d.lignes.length, 'lignes ouvertes'], [open, 'pièces à livrer'], [ech.length, 'lignes échues', false, ech.length ? 'warn' : ''], [new Set(d.lignes.map(l => l.ref)).size, 'références commandées']);
      } else if (view === 'gantt' && typeof ofs !== 'undefined') {
        const u = ofs.filter(o => o.stage === 'usinage');
        out.push([u.length, 'OF à l\'usinage'], [new Set(u.map(o => o.machine).filter(Boolean)).size, 'machines occupées'], [u.reduce((s, o) => s + (Number(o.qty) || 0), 0), 'pièces en cours']);
      } else if (view === 'fiab' && typeof window.fiabCompute === 'function') {
        const o = window.fiabCompute();
        if (o.ok) { const A = o.all; if (A.otd != null) out.push([Math.round(A.otd * 100), '% livrés à l\'heure', true]); if (A.fpy != null) out.push([Math.round(A.fpy * 1000) / 10, '% pièces conformes']); out.push([o.ranked.length, 'machines suivies'], [A.late, 'OF livrés en retard', false, A.late ? 'warn' : '']); }
      } else if (view === 'abc' && typeof window.abcCompute === 'function') {
        const o = window.abcCompute();
        if (o.ok) out.push([o.by.A.n, 'références A · ' + Math.round(o.by.A.q / o.total * 100) + ' % des ventes'], [o.by.B.n, 'références B'], [o.by.C.n, 'références C'], [o.dormant.length, 'sans vente', false, o.dormant.length ? 'warn' : '']);
      } else if (view === 'stats' && typeof window.statsHist === 'function') {
        const o = window.statsHist();
        if (o.ok) { const s = o.s; out.push([s.n, 'OF produits'], [s.pieces, 'pièces produites']); if (s.otd != null) out.push([Math.round(s.otd * 100), '% livrés à l\'heure', true]); if (s.lead != null) out.push([Math.round(s.lead), 'jours de délai médian']); }
      } else if (view === 'archives' && typeof archives !== 'undefined') {
        out.push([archives.length, 'OF archivés'], [archives.reduce((s, o) => s + (Number(o.qty) || 0), 0), 'pièces produites']);
      }
    } catch (e) { console.error('[Design] stats', view, e); }
    return out;
  }

  function heroHtml(view) {
    const c = CFG[view], h = HUES[c.hue], st = stats(view);
    return `<div class="dz-hero" data-view="${view}" style="--h1:${h[0]};--h2:${h[1]}">
      <div class="dz-aurora"></div>
      <div class="dz-hero-main"><span class="dz-ico"><i class="ti ${c.ico}"></i></span><div><h2>${c.t}</h2><p>${c.s}</p></div></div>
      ${st.length ? `<div class="dz-stats">${st.map(x => `<div class="dz-stat ${x[3] || ''}"><b data-cu="${Math.round(x[0])}" data-pc="${x[2] ? 1 : ''}">${fmt(x[0])}${x[2] ? ' %' : ''}</b><span>${x[1].replace('% ', '')}</span></div>`).join('')}</div>` : ''}
    </div>`;
  }

  function countUp(root) {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.querySelectorAll('[data-cu]').forEach(n => {
      const to = Number(n.dataset.cu), pc = n.dataset.pc, t0 = performance.now();
      (function step(now) { const p = Math.min(1, (now - t0) / 1000), e = 1 - Math.pow(1 - p, 3);
        n.textContent = fmt(to * e) + (pc ? ' %' : ''); if (p < 1) requestAnimationFrame(step); })(t0);
    });
  }

  let busy = false;
  function ensure(view) {
    const c = CFG[view]; if (!c) return;
    const el = document.getElementById(c.id); if (!el) return;
    if (el.firstElementChild && el.firstElementChild.classList.contains('dz-hero')) return;
    if (el.querySelector(':scope > .dz-hero')) return;
    busy = true;
    el.insertAdjacentHTML('afterbegin', heroHtml(view));
    countUp(el.firstElementChild);
    try { const rd = window.dzReadingHtml && window.dzReadingHtml(view); if (rd) el.firstElementChild.insertAdjacentHTML('afterend', rd); } catch (e) { console.error('[Design] lecture', e); }
    busy = false;
  }
  function stageAccents() {
    document.querySelectorAll('.kanban-col').forEach(col => {
      const dot = col.querySelector('.kanban-head-title span, .kanban-head-title i');
      const bg = dot && (dot.style.background || dot.style.backgroundColor);
      if (bg) col.style.setProperty('--stage', bg);
    });
  }
  function tick() {
    if (busy) return;
    const v = (typeof currentView !== 'undefined') ? currentView : '';
    ensure(v); stageAccents();
  }
  // Re-render des onglets : on surveille le contenu pour remettre le bandeau si la page se redessine.
  let raf = 0;
  const obs = new MutationObserver(() => { if (busy) return; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); });
  function start() {
    Object.values(CFG).forEach(c => { const el = document.getElementById(c.id); if (el) obs.observe(el, { childList: true }); });
    const k = document.getElementById('kanban-view'); if (k) obs.observe(k, { childList: true });
    tick();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.addEventListener('hashchange', () => setTimeout(tick, 50));
  const _sv = window.setView;
  if (typeof _sv === 'function') window.setView = function () { const r = _sv.apply(this, arguments); setTimeout(tick, 30); return r; };
})();
