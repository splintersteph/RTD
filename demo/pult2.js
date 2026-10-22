// ═══ Pultrusion — vue en tuiles et thermomètre de couverture ════════════════
// Lecture seule : s'ajoute au-dessus du tableau existant, ne modifie aucune donnée.
// Si un calcul échoue, la page d'origine reste affichée telle quelle.
(function () {
  'use strict';
  if (typeof renderPultrusionPage !== 'function') return;
  const orig = renderPultrusionPage;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = n => Math.round(n).toLocaleString('fr');
  const f1 = n => (Math.round(n * 10) / 10).toLocaleString('fr');
  const MAXM = 12;               // la jauge va jusqu'à 12 mois de couverture
  window.puMode = window.puMode || 'tuiles';

  function collect() {
    const search = (typeof pultSearchFilter === 'string' ? pultSearchFilter : '').toLowerCase();
    let refs = pultGetActiveRefs();
    if (search) refs = refs.filter(r => (r.client || '').toLowerCase().includes(search) || (r.code || '').toLowerCase().includes(search) || (r.fibre || '').toLowerCase().includes(search));
    return refs.map(r => {
      const cov = pultCouvertureMois(r), live = pultGetLiveStock(r.code);
      const hist = r.historiqueMl || {}, ys = Object.keys(hist).filter(a => hist[a] != null).sort();
      return {
        r, cov, lots: pultTotalStock(r), ml: live !== null ? live : ((r.stockMezzMl || 0) + (r.stockRtdMl || 0)),
        conso: ys.length ? hist[ys[ys.length - 1]] : null, an: ys.length ? ys[ys.length - 1] : null,
        ofs: (typeof pultOFs !== 'undefined' ? pultOFs : []).filter(o => o.code === r.code),
        live: pultIsLiveStock(r), sous: r.limiteBasse != null && pultTotalStock(r) < r.limiteBasse,
      };
    });
  }
  const lvl = c => c == null ? 'na' : c < 1 ? 'crit' : c < 3 ? 'warn' : 'ok';
  const TXT = { crit: 'Moins d\'un mois de stock', warn: 'À surveiller', ok: 'Confortable', na: 'Couverture non calculable' };

  function thermo(list) {
    const n = { crit: 0, warn: 0, ok: 0, na: 0 }; list.forEach(x => n[lvl(x.cov)]++);
    const tot = list.length || 1, seg = (k, label) => n[k] ? `<div class="pu-seg ${k}" style="flex:${n[k]}" title="${n[k]} ${label}"><b>${n[k]}</b><span>${label}</span></div>` : '';
    return `<div class="pu-thermo">${seg('crit', 'moins d\'1 mois')}${seg('warn', '1 à 3 mois')}${seg('ok', 'plus de 3 mois')}${seg('na', 'sans limite')}</div>`;
  }
  function tile(x, i) {
    const { r, cov } = x, k = lvl(cov), pct = cov == null ? 0 : Math.min(100, cov / MAXM * 100);
    const big = cov == null ? '—' : cov >= 10 ? Math.round(cov) : f1(cov);
    const chips = [];
    if (x.sous) chips.push('<span class="pu-chip crit"><i class="ti ti-alert-triangle"></i> sous la limite basse</span>');
    if (r.lotsAttente > 0) chips.push(`<span class="pu-chip"><i class="ti ti-clock"></i> ${f1(r.lotsAttente)} lots en contrôle</span>`);
    x.ofs.forEach(o => chips.push(`<span class="pu-chip of"><i class="ti ti-tool"></i> ${esc(o.id)} · ${f1(o.qty)} L</span>`));
    return `<div class="pu-tile ${k}" style="animation-delay:${Math.min(i, 24) * 35}ms" onclick="pultShowDetail('${String(r.code).replace(/'/g, "\\'")}')" title="${TXT[k]}">
      <div class="pu-top"><b>${esc(r.code)}</b>${x.live ? '<i class="ti ti-refresh pu-live" title="Stock en direct"></i>' : ''}</div>
      <div class="pu-cli">${esc(r.client || '—')}</div>
      <div class="pu-big">${big}<small>${cov == null ? '' : ' mois'}</small></div>
      <div class="pu-bar"><i style="width:${pct}%"></i><u style="left:${100 / MAXM}%"></u><u style="left:${300 / MAXM}%"></u></div>
      <div class="pu-st">${TXT[k]}</div>
      <div class="pu-meta"><span><b>${f1(x.lots)}</b> lots</span><span><b>${fmt(x.ml)}</b> m</span>${x.conso != null ? `<span title="Consommation ${x.an}"><b>${fmt(x.conso)}</b> m/an</span>` : ''}</div>
      ${chips.length ? `<div class="pu-chips">${chips.join('')}</div>` : ''}
    </div>`;
  }
  function block() {
    const list = collect().sort((a, b) => (a.cov == null ? 1e9 : a.cov) - (b.cov == null ? 1e9 : b.cov));
    if (!list.length) return '';
    const worst = list.find(x => x.cov != null);
    const msg = worst && worst.cov < 1 ? `<div class="pu-alert"><i class="ti ti-flame"></i><div><b>${esc(worst.r.code)} : ${f1(worst.cov)} mois de stock seulement</b><span>${esc(worst.r.client || '')} · ${fmt(worst.ml)} m en stock${worst.conso != null ? ', ' + fmt(worst.conso) + ' m consommés en ' + worst.an : ''}. C'est la prochaine rupture à anticiper.</span></div></div>` : '';
    return `<div class="pu-wrap">
      <div class="pu-head"><div><h3>Couverture des joncs</h3><p>Combien de mois de stock il reste pour chaque référence, du plus urgent au plus confortable. Les repères de la jauge : 1 mois et 3 mois.</p></div>
        <div class="pu-tog"><button class="${window.puMode === 'tuiles' ? 'on' : ''}" onclick="puSet('tuiles')"><i class="ti ti-layout-grid"></i> Tuiles</button><button class="${window.puMode === 'table' ? 'on' : ''}" onclick="puSet('table')"><i class="ti ti-table"></i> Tableau</button></div></div>
      ${thermo(list)}${msg}
      <div class="pu-grid">${list.map(tile).join('')}</div></div>`;
  }
  function apply() {
    const el = document.getElementById('view-pultrusion'); if (!el) return;
    el.classList.toggle('pu-tiles', window.puMode === 'tuiles');
  }
  window.puSet = m => { window.puMode = m; if (typeof renderPultrusionPage === 'function') renderPultrusionPage(); };

  window.renderPultrusionPage = function () {
    orig.apply(this, arguments);
    try {
      const el = document.getElementById('view-pultrusion'), body = el && el.firstElementChild && el.firstElementChild.children[1];
      if (!body) return;
      // les 3 premiers éléments d'origine : titre « Stock de joncs », tableau, espace
      for (let i = 0; i < 3 && body.children[i]; i++) body.children[i].classList.add('pu-orig');
      body.insertAdjacentHTML('afterbegin', block());
      apply();
    } catch (e) { console.error('[Pultrusion] vue en tuiles', e); }
  };
})();
