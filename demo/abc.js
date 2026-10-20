// ═══ Gammes ABC / XYZ — classer les références pour piloter chacune comme il faut ═══
// Méthode Lean Six Sigma (phase « Mesurer ») : Pareto des volumes (A/B/C) croisé avec la
// régularité de la demande (X/Y/Z). Lecture seule : calculé à partir des ventes (conso.js)
// et du stock (PDP) déjà chargés. Rien n'est modifié ni sauvegardé.
(function () {
  const fmt = n => Math.round(n).toLocaleString('fr');
  const fmt1 = n => (Math.round(n * 10) / 10).toLocaleString('fr');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CL = {
    A: { c: '#0B7F79', c2: '#35D6C4', lab: 'Les piliers', sl: '98 %', rule: 'Les références qui font 80 % des volumes',
      todo: 'Suivi chaque semaine, stock de sécurité généreux, aucune rupture tolérée. Une heure perdue ici coûte plus cher que partout ailleurs.' },
    B: { c: '#B36B00', c2: '#F7C25B', lab: 'Les réguliers', sl: '95 %', rule: 'Les 15 % de volumes suivants',
      todo: 'Suivi toutes les 2 semaines, stock de sécurité modéré, fabrication en lots réguliers.' },
    C: { c: '#6B7A89', c2: '#B7C1CB', lab: 'La longue traîne', sl: '90 %', rule: 'Les 5 % de volumes restants',
      todo: 'Suivi mensuel, stock minimal, fabrication à la commande quand c\'est possible. Beaucoup de références pour peu de volume : à rationaliser.' },
  };
  const XYZ = { X: ['Demande régulière', 'au moins 3 livraisons par mois'], Y: ['Demande variable', '1 à 3 livraisons par mois'], Z: ['Demande irrégulière', 'moins d\'1 livraison par mois'] };
  // Couverture cible (en mois de ventes) — proposition de départ à ajuster avec la direction
  const TARGET = { A: { X: 1.5, Y: 2, Z: 3 }, B: { X: 1, Y: 1.5, Z: 2 }, C: { X: .5, Y: 1, Z: 1.5 } };
  let fCl = '', fXyz = '', showAll = false;

  function compute() {
    const out = { ok: false, rows: [], dormant: [] };
    if (typeof pcData === 'undefined' || typeof window.cockpitCollect !== 'function' || typeof consoGetEntry !== 'function') return out;
    const d = window.cockpitCollect(), per = consoGetActive().periodDays / 30.4375;
    const rows = d.refs.map(r => {
      const e = consoGetEntry(r.code), m = consoGetMoyenneMensuelle(r.code) || 0;
      return { r, qte: e ? e.qte : 0, nb: e ? e.nb : 0, m, stock: r.stock, cov: m > 0 ? r.stock / m : null, rup: !!r.rup };
    });
    const sold = rows.filter(x => x.qte > 0).sort((a, b) => b.qte - a.qte);
    out.dormant = rows.filter(x => !(x.qte > 0));
    const total = sold.reduce((s, x) => s + x.qte, 0); let cum = 0;
    sold.forEach(x => {
      const before = cum / total * 100; cum += x.qte; x.cum = cum / total * 100;
      x.cls = before < 80 ? 'A' : before < 95 ? 'B' : 'C';
      const f = x.nb / per; x.xyz = f >= 3 ? 'X' : f >= 1 ? 'Y' : 'Z'; x.freq = f;
      x.target = TARGET[x.cls][x.xyz];
      x.st = x.cov == null ? 'na' : x.cov < x.target * .5 ? 'crit' : x.cov < x.target ? 'warn' : x.cov > Math.max(x.target * 4, 6) ? 'over' : 'ok';
    });
    out.rows = sold; out.total = total; out.per = per; out.ok = sold.length > 0;
    out.by = {}; ['A', 'B', 'C'].forEach(c => {
      const l = sold.filter(x => x.cls === c);
      out.by[c] = { n: l.length, q: l.reduce((s, x) => s + x.qte, 0), rup: l.filter(x => x.rup).length, low: l.filter(x => x.st === 'crit' || x.st === 'warn').length, over: l.filter(x => x.st === 'over').length };
    });
    out.mx = {}; ['A', 'B', 'C'].forEach(c => ['X', 'Y', 'Z'].forEach(z => { out.mx[c + z] = sold.filter(x => x.cls === c && x.xyz === z).length; }));
    return out;
  }
  window.abcCompute = compute;

  function pareto(o) {
    const W = 640, H = 230, P = { l: 44, r: 14, t: 14, b: 28 }, n = o.rows.length, iw = W - P.l - P.r, ih = H - P.t - P.b;
    const X = i => P.l + (i / n) * iw, Y = v => P.t + (1 - v / 100) * ih;
    const pts = o.rows.map((x, i) => [X(i + 1), Y(x.cum)]);
    const line = 'M' + P.l + ',' + Y(0) + ' L' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
    const area = line + ' L' + X(n) + ',' + Y(0) + ' Z';
    const nA = o.by.A.n, nB = o.by.B.n, xA = X(nA), xB = X(nA + nB);
    const grid = [0, 25, 50, 80, 95, 100].map(v => `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}" class="g${v === 80 || v === 95 ? ' k' : ''}"/><text x="${P.l - 8}" y="${Y(v) + 3.5}" text-anchor="end">${v} %</text>`).join('');
    return `<svg class="abc-par" viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe de Pareto des références">
      <defs><linearGradient id="abcg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#0B7F79" stop-opacity=".30"/><stop offset="1" stop-color="#0B7F79" stop-opacity=".02"/></linearGradient></defs>
      <rect x="${P.l}" y="${P.t}" width="${xA - P.l}" height="${ih}" fill="#35D6C4" opacity=".10"/><rect x="${xA}" y="${P.t}" width="${xB - xA}" height="${ih}" fill="#F7C25B" opacity=".14"/><rect x="${xB}" y="${P.t}" width="${W - P.r - xB}" height="${ih}" fill="#9AA7B2" opacity=".12"/>
      ${grid}<path d="${area}" fill="url(#abcg)"/><path d="${line}" class="curve"/>
      <text x="${(P.l + xA) / 2}" y="${Y(9)}" text-anchor="middle" class="zl" fill="#0B7F79">A · ${nA} réf.</text>
      <text x="${(xA + xB) / 2}" y="${Y(9)}" text-anchor="middle" class="zl" fill="#B36B00">B · ${nB}</text>
      <text x="${(xB + W - P.r) / 2}" y="${Y(9)}" text-anchor="middle" class="zl" fill="#6B7A89">C · ${o.by.C.n} références</text>
      <text x="${P.l}" y="${H - 8}">1ʳᵉ référence</text><text x="${W - P.r}" y="${H - 8}" text-anchor="end">${n} références, de la plus vendue à la moins vendue</text></svg>`;
  }

  function matrix(o) {
    const head = ['X', 'Y', 'Z'].map(z => `<div class="abc-mh"><b>${z}</b><span>${XYZ[z][0]}</span><small>${XYZ[z][1]}</small></div>`).join('');
    const rows = ['A', 'B', 'C'].map(c => `<div class="abc-ml" style="--c:${CL[c].c}"><b>${c}</b><span>${CL[c].lab}</span></div>` +
      ['X', 'Y', 'Z'].map(z => { const n = o.mx[c + z], on = fCl === c && fXyz === z;
        return `<button class="abc-mc ${on ? 'on' : ''} ${n ? '' : 'z'}" style="--c:${CL[c].c};--a:${Math.min(1, n / 20 + .12).toFixed(2)}" onclick="abcFilter('${c}','${z}')"><b>${n}</b><span>Cible ${TARGET[c][z]} mois</span></button>`; }).join('')).join('');
    return `<div class="abc-mx"><div></div>${head}${rows}</div>`;
  }

  function stTag(x) {
    const m = { crit: ['Très en dessous', 'crit'], warn: ['Sous la cible', 'warn'], ok: ['Dans la cible', 'ok'], over: ['Sur-stock', 'info'], na: ['—', 'na'] }[x.st];
    return `<em class="abc-t ${m[1]}">${m[0]}</em>`;
  }
  function covBar(x) {
    if (x.cov == null) return '<span class="abc-na">—</span>';
    const max = Math.max(x.target * 3, x.cov, 1), w = Math.min(100, x.cov / max * 100), t = x.target / max * 100;
    const col = x.st === 'crit' ? '#D9453A' : x.st === 'warn' ? '#E19A1A' : x.st === 'over' ? '#4C8EDA' : '#1D9E75';
    return `<div class="abc-cov"><div class="bar"><i style="width:${w}%;background:${col}"></i><u style="left:${t}%" title="Cible ${x.target} mois"></u></div><b>${x.cov >= 10 ? Math.round(x.cov) : fmt1(x.cov)} <small>mois</small></b></div>`;
  }

  function render() {
    const el = document.getElementById('view-abc'); if (!el) return;
    const hero = (el.firstElementChild && el.firstElementChild.classList.contains('dz-hero')) ? el.firstElementChild.outerHTML : '';
    let o; try { o = compute(); } catch (e) { console.error('[ABC]', e); o = { ok: false }; }
    if (!o.ok) { el.innerHTML = hero + '<div class="cl-wrap"><div class="cl-empty"><i class="ti ti-database-off"></i><b>Pas encore de ventes</b><span>Importez COMMANDELIST (onglet Consommation) pour classer les références.</span></div></div>'; return; }
    const A = o.by.A, B = o.by.B, C = o.by.C, nt = o.rows.length;
    const ins = [];
    if (A.low) ins.push(['crit', 'ti-alert-triangle', `${A.low} ${A.low > 1 ? 'piliers sont' : 'pilier est'} sous leur stock cible`, 'Ce sont les références qui font 80 % des volumes : c\'est là qu\'il faut d\'abord produire ou réapprovisionner.']);
    if (C.over) ins.push(['info', 'ti-box-multiple', `${C.over} références C en sur-stock`, 'Peu de ventes mais beaucoup de stock : de l\'argent immobilisé qu\'on peut libérer en ne relançant pas la fabrication.']);
    if (o.dormant.length) ins.push(['warn', 'ti-zzz', `${o.dormant.length} références sans aucune vente sur ${Math.round(o.per / 12)} ans`, 'Candidates à l\'arrêt ou à la revue : elles coûtent du suivi sans rien rapporter.']);
    ins.push(['ok', 'ti-chart-pie', `${A.n} références sur ${nt} suffisent à faire 80 % des volumes`, 'C\'est la loi de Pareto : concentrer l\'attention sur ces références donne le meilleur rendement.']);
    const cards = ['A', 'B', 'C'].map((c, i) => { const b = o.by[c], k = CL[c];
      return `<article class="abc-card" style="--c:${k.c};--c2:${k.c2};animation-delay:${i * 80}ms"><header><span class="abc-l">${c}</span><div><b>${k.lab}</b><small>${k.rule}</small></div></header>
        <div class="abc-kp"><div><b>${b.n}</b><span>références</span></div><div><b>${Math.round(b.q / o.total * 100)} %</b><span>des volumes</span></div><div><b>${k.sl}</b><span>service visé</span></div></div>
        <div class="abc-chips">${b.rup ? `<em class="abc-t crit">${b.rup} en rupture à venir</em>` : '<em class="abc-t ok">Aucune rupture prévue</em>'}${b.low ? `<em class="abc-t warn">${b.low} sous la cible</em>` : ''}${b.over ? `<em class="abc-t info">${b.over} en sur-stock</em>` : ''}</div>
        <p>${k.todo}</p><button onclick="abcFilter('${c}','')">Voir ces références</button></article>`; }).join('');
    let list = o.rows.filter(x => (!fCl || x.cls === fCl) && (!fXyz || x.xyz === fXyz));
    list.sort((a, b) => (a.cls + a.xyz).localeCompare(b.cls + b.xyz) || b.qte - a.qte); // AX, AY, AZ, BX… puis volume décroissant
    const total = list.length; if (!showAll) list = list.slice(0, 40);
    const tbl = list.map(x => `<tr onclick="pdpShowDetail('${esc(x.r.code)}')"><td><span class="abc-pill" style="--c:${CL[x.cls].c}">${x.cls}${x.xyz}</span></td><td><b>${esc(x.r.nom)}</b><small>${esc(x.r.client)} · ${esc(x.r.code)}</small></td>
      <td class="n">${fmt(x.m)}<small>/ mois</small></td><td class="n">${fmt(x.stock)}</td><td>${covBar(x)}</td><td>${stTag(x)}</td></tr>`).join('');
    el.innerHTML = hero + `<div class="cl-wrap">
      <div class="st-ins">${ins.slice(0, 4).map((x, i) => `<div class="st-in ${x[0]}" style="animation-delay:${i * 80}ms"><i class="ti ${x[1]}"></i><div><b>${x[2]}</b><span>${x[3]}</span></div></div>`).join('')}</div>
      <div class="abc-top"><section class="st-card"><header><h3>La courbe de Pareto</h3><p>Chaque point = une référence, de la plus vendue à la moins vendue. La courbe montre quel % des ventes elles cumulent.</p></header>${pareto(o)}</section>
        <section class="st-card"><header><h3>Matrice ABC × XYZ</h3><p>Lignes : poids dans les ventes. Colonnes : régularité de la demande. Cliquez une case pour filtrer.</p></header>${matrix(o)}
        <p class="abc-note"><i class="ti ti-info-circle"></i> Les cibles de couverture sont une proposition de départ (à valider). La régularité est estimée par la fréquence des livraisons ; avec un historique mensuel on pourrait la mesurer plus finement.</p></section></div>
      <h3 class="cl-h"><i class="ti ti-layout-grid"></i>Trois gammes, trois façons de piloter</h3><div class="abc-cards">${cards}</div>
      <section class="st-card"><header class="abc-th"><div><h3>Toutes les références classées</h3><p>${total} référence${total > 1 ? 's' : ''}${fCl || fXyz ? ' · filtre : ' + (fCl || 'toutes classes') + (fXyz ? (fCl ? '' : ' · ') + fXyz : '') : ''} · la barre montre la couverture actuelle, le trait noir la cible</p></div>
          <div class="abc-fs"><div class="abc-fg"><small>Classe</small><div class="abc-f">${['', 'A', 'B', 'C'].map(c => `<button class="${fCl === c ? 'on' : ''}" onclick="abcSetC('${c}')">${c || 'Toutes'}</button>`).join('')}</div></div>
          <div class="abc-fg"><small>Régularité</small><div class="abc-f">${['', 'X', 'Y', 'Z'].map(z => `<button class="${fXyz === z ? 'on' : ''}" onclick="abcSetZ('${z}')">${z || 'Toutes'}</button>`).join('')}</div></div></div>
        </header>
        <table class="abc-tb"><thead><tr><th>Classe</th><th>Référence</th><th class="n">Ventes</th><th class="n">Stock</th><th>Couverture</th><th>Statut</th></tr></thead><tbody>${tbl}</tbody></table>
        ${total > 40 ? `<button class="abc-more" onclick="abcMore()">${showAll ? 'Réduire la liste' : 'Afficher les ' + total + ' références'}</button>` : ''}</section>
      <p class="cl-foot">Classement sur les quantités livrées des ${Math.round(o.per)} derniers mois. Les pièces sont comptées telles quelles (un blister de 5 compte comme un foret) ; la section « Et en euros ? » ci-dessous refait le classement en valeur de vente.</p></div>`;
  }
  window.abcFilter = function (c, z) { if (fCl === c && fXyz === z) { fCl = ''; fXyz = ''; } else { fCl = c; fXyz = z; } showAll = false; render(); };
  window.abcSetC = c => { fCl = c; showAll = false; render(); };
  window.abcSetZ = z => { fXyz = z; showAll = false; render(); };
  window.abcMore = function () { showAll = !showAll; render(); };
  window.renderABC = render;
})();
