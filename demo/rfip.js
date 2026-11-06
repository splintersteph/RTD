// ═══ Mise en joint (machine RFIP) ═══════════════════════════════════════════
// On saisit chaque cycle de mise en joint (début, fin, quantités, arrêts). L'onglet calcule le taux d'occupation de la machine,
// sa cadence réelle et son efficience globale, par période et par produit.
// Lecture pour tous ; saisie et réglages réservés aux administrateurs (contrôlé par le serveur : /api/rfip).
(function () {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fr = function (n, d) { return (Number(n) || 0).toLocaleString('fr', { maximumFractionDigits: d == null ? 0 : d }); };
  var isAdmin = function () { return window.PP_USER && window.PP_USER.role === 'admin'; };
  var D = null, period = '30', loaded = false, editId = null, msg = '';
  var JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  var pad = function (n) { return ('0' + n).slice(-2); };
  var isoLocal = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  var dayKey = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var parse = function (s) { return s ? new Date(s) : null; };
  var fmtDT = function (s) { return s ? s.slice(8, 10) + '/' + s.slice(5, 7) + ' ' + s.slice(11) : ''; };
  var fmtH = function (min) { var h = Math.floor(min / 60), m = Math.round(min % 60); return h + ' h ' + pad(m); };

  var css = document.createElement('style');
  css.textContent = [
    '.rf-hero{display:flex;align-items:center;gap:14px;padding:18px 26px;background:linear-gradient(120deg,#12303a,#0B7F79);color:#fff}',
    '.rf-hero h2{margin:0;font-family:Sora,sans-serif;font-size:21px;flex:1}.rf-hero small{opacity:.8;font-weight:500;margin-left:8px}',
    '.rf-hero .rf-btn{background:rgba(255,255,255,.16);color:#fff;border-color:rgba(255,255,255,.45)}',
    '.rf-wrap{padding:18px 26px 40px;max-width:1300px}',
    '.rf-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:16px}',
    '.rf-chip{padding:6px 13px;border-radius:999px;border:1px solid var(--border,#d9d4c7);background:var(--surface,#fff);font:inherit;font-size:12.5px;cursor:pointer;color:var(--text-muted,#5d6b69)}',
    '.rf-chip.on{background:#0B7F79;color:#fff;border-color:#0B7F79}',
    '.rf-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin-bottom:18px}',
    '.rf-k{background:var(--surface,#fff);border:1px solid var(--border,#e4dfd3);border-radius:14px;padding:14px 16px}',
    '.rf-k b{display:block;font-size:28px;line-height:1.1;font-family:Sora,sans-serif}.rf-k span{font-size:12px;color:var(--text-muted,#5d6b69)}.rf-k em{display:block;font-style:normal;font-size:11px;color:var(--text-faint,#8a9593);margin-top:4px}',
    '.rf-box{background:var(--surface,#fff);border:1px solid var(--border,#e4dfd3);border-radius:14px;padding:16px 18px;margin-bottom:18px}',
    '.rf-box h3{margin:0 0 10px;font-size:14px}',
    '.rf-t{width:100%;border-collapse:collapse;font-size:13px}.rf-t th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-faint,#8a9593);padding:6px 8px;border-bottom:1px solid var(--border,#e4dfd3)}',
    '.rf-t td{padding:7px 8px;border-bottom:1px solid var(--border,#efebe0)}.rf-t .r{text-align:right;font-variant-numeric:tabular-nums}',
    '.rf-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;align-items:end}',
    '.rf-form label{font-size:11.5px;color:var(--text-muted,#5d6b69);display:flex;flex-direction:column;gap:3px}',
    '.rf-form input,.rf-form select{padding:8px 10px;border:1px solid var(--border-med,#cfc9ba);border-radius:8px;font:inherit;font-size:13px;background:var(--surface,#fff);color:inherit}',
    '.rf-btn{padding:8px 14px;border-radius:9px;border:1px solid var(--border-med,#cfc9ba);background:var(--surface,#fff);font:inherit;font-size:13px;cursor:pointer;color:inherit}.rf-btn.p{background:#0B7F79;border-color:#0B7F79;color:#fff}.rf-btn.d{color:#a12a1f}',
    '.rf-live{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border-radius:12px;background:#e7f6f0;color:#0b5d49;margin-bottom:14px;font-size:13.5px}',
    '.rf-live i{width:10px;height:10px;border-radius:50%;background:#1D9E75;animation:rfp 1.2s infinite}@keyframes rfp{50%{opacity:.25}}',
    '.rf-msg{font-size:13px;margin:8px 0}.rf-msg.e{color:#a12a1f}.rf-msg.o{color:#0B7F79}',
    '.rf-help{font-size:12px;color:var(--text-muted,#5d6b69);line-height:1.5}',
    '.rf-pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11.5px;font-weight:700}.rf-pill.g{background:#e3f4ea;color:#1b6b3a}.rf-pill.o{background:#fff1d6;color:#8a5a00}.rf-pill.r{background:#fde5e3;color:#a12a1f}'
  ].join('\n');
  document.head.appendChild(css);

  function api(method, body) {
    return fetch('/api/rfip', { method: method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().then(function (j) { j._ok = r.ok && j.ok !== false; return j; }); });
  }
  window.renderRfip = function () {
    var el = document.getElementById('view-rfip'); if (!el) return;
    if (!loaded) { el.innerHTML = '<div class="rf-wrap">Chargement…</div>'; return api('GET').then(function (j) { D = j; loaded = true; window.renderRfip(); }).catch(function () { el.innerHTML = '<div class="rf-wrap">Serveur injoignable.</div>'; }); }
    draw(el);
  };

  // ───── calculs ─────
  function range() {
    var end = new Date(); end.setHours(23, 59, 59, 999);
    var start = new Date();
    if (period === 'all') {
      var ds = D.cycles.map(function (c) { return c.debut; }).sort(); start = ds.length ? new Date(ds[0]) : new Date(); start.setHours(0, 0, 0, 0);
    } else if (period === 'month') { start = new Date(end.getFullYear(), end.getMonth(), 1); }
    else { start.setDate(start.getDate() - (parseInt(period, 10) - 1)); start.setHours(0, 0, 0, 0); }
    return { start: start, end: end };
  }
  function compute() {
    var P = D.params, R = range(), now = new Date(), days = [], k;
    for (k = new Date(R.start); k <= R.end; k.setDate(k.getDate() + 1)) if (P.jours.indexOf(k.getDay()) >= 0) days.push(dayKey(k));
    var cy = D.cycles.filter(function (c) { var d = parse(c.debut); return d >= R.start && d <= R.end; });
    var byDay = {}, byProd = {}, run = 0, arret = 0, qte = 0, rebut = 0, done = 0;
    cy.forEach(function (c) {
      var d0 = parse(c.debut), d1 = c.fin ? parse(c.fin) : null; if (!d1) return;
      var m = (d1 - d0) / 60000, a = Math.min(c.arret_min || 0, m), net = m - a;
      run += m; arret += a; qte += c.qte || 0; rebut += c.rebut || 0; done++;
      var dk = dayKey(d0); (byDay[dk] = byDay[dk] || { run: 0, net: 0, qte: 0 }); byDay[dk].run += m; byDay[dk].net += net; byDay[dk].qte += c.qte || 0;
      var pk = c.produit || '(non précisé)'; var p = byProd[pk] = byProd[pk] || { n: 0, qte: 0, rebut: 0, net: 0, run: 0, cad: [] };
      p.n++; p.qte += c.qte || 0; p.rebut += c.rebut || 0; p.net += net; p.run += m; if (net > 0 && c.qte) p.cad.push(c.qte / (net / 60));
    });
    var open = D.cycles.filter(function (c) { return !c.fin; });
    var ouvre = days.length * P.heures_jour * 60, net = run - arret;
    var cadence = net > 0 ? qte / (net / 60) : null, nominal = P.cadence_nominale;
    var perf = cadence && nominal ? cadence / nominal : null, qual = qte > 0 ? (qte - rebut) / qte : null, dispo = ouvre > 0 ? net / ouvre : null;
    var oee = dispo != null && perf != null && qual != null ? dispo * perf * qual : null;
    return { days: days, byDay: byDay, byProd: byProd, run: run, arret: arret, net: net, ouvre: ouvre, occ: ouvre > 0 ? run / ouvre : null, cadence: cadence, nominal: nominal, perf: perf, qual: qual, dispo: dispo, oee: oee, qte: qte, rebut: rebut, done: done, open: open, cycles: cy };
  }
  var pct = function (x) { return x == null ? '—' : fr(x * 100, 0) + ' %'; };
  var tone = function (x, a, b) { return x == null ? '' : x >= a ? 'g' : x >= b ? 'o' : 'r'; };

  // ───── affichage ─────
  function ofOptions() {
    var seen = {}, L = [];
    (typeof ofs !== 'undefined' ? ofs : []).forEach(function (o) { if (!seen[o.id]) { seen[o.id] = 1; L.push(o); } });
    L.sort(function (a, b) { return (b.stage === 'joint') - (a.stage === 'joint'); });
    return L.map(function (o) { return '<option value="' + esc(o.id) + '">' + esc(o.produit + ' · ' + (o.stage || '')) + '</option>'; }).join('');
  }
  function draw(el) {
    var C = compute(), P = D.params, adm = isAdmin();
    var editing = editId ? D.cycles.filter(function (c) { return c.id === editId; })[0] : null, e = editing || {};
    var chips = [['7', '7 jours'], ['30', '30 jours'], ['month', 'Ce mois'], ['all', 'Tout']].map(function (p) { return '<button class="rf-chip' + (period === p[0] ? ' on' : '') + '" data-per="' + p[0] + '">' + p[1] + '</button>'; }).join('');
    var live = C.open.map(function (c) {
      var m = Math.round((new Date() - parse(c.debut)) / 60000);
      return '<div class="rf-live"><i></i><b>Cycle en cours</b> ' + esc(c.of || '') + ' ' + esc(c.produit || '') + ' · depuis ' + fmtDT(c.debut) + ' (' + fmtH(m) + ')' + (adm ? ' <button class="rf-btn p" data-end="' + c.id + '">Terminer ce cycle</button>' : '') + '</div>';
    }).join('');
    var maxH = 1; C.days.forEach(function (d) { var v = (C.byDay[d] || { run: 0 }).run / 60; if (v > maxH) maxH = v; }); maxH = Math.max(maxH, P.heures_jour);
    var barW = Math.max(6, Math.min(40, Math.floor(900 / Math.max(C.days.length, 1) - 4)));
    var chart = C.days.length ? '<svg viewBox="0 0 ' + (C.days.length * (barW + 4) + 40) + ' 150" style="width:100%;max-width:1100px;height:auto" role="img" aria-label="Heures de marche par jour">'
      + '<line x1="30" x2="' + (C.days.length * (barW + 4) + 36) + '" y1="' + (130 - P.heures_jour / maxH * 110) + '" y2="' + (130 - P.heures_jour / maxH * 110) + '" stroke="#D4880A" stroke-dasharray="4 3"/><text x="0" y="' + (134 - P.heures_jour / maxH * 110) + '" font-size="9" fill="#D4880A">' + P.heures_jour + ' h</text>'
      + C.days.map(function (d, i) {
        var v = (C.byDay[d] || { run: 0 }).run / 60, h = v / maxH * 110, x = 34 + i * (barW + 4);
        return '<rect x="' + x + '" y="' + (130 - h) + '" width="' + barW + '" height="' + Math.max(h, 0.5) + '" rx="3" fill="' + (v >= P.heures_jour * 0.85 ? '#1D9E75' : v >= P.heures_jour * 0.5 ? '#D4880A' : '#E5484D') + '"><title>' + d.slice(8) + '/' + d.slice(5, 7) + ' : ' + fr(v, 1) + ' h</title></rect>'
          + (C.days.length <= 31 ? '<text x="' + (x + barW / 2) + '" y="144" font-size="8" text-anchor="middle" fill="#8a9593">' + d.slice(8) + '</text>' : '');
      }).join('') + '</svg>' : '<p class="rf-help">Aucun jour ouvré dans cette période.</p>';
    var prod = Object.keys(C.byProd).sort(function (a, b) { return C.byProd[b].qte - C.byProd[a].qte; }).map(function (k) {
      var p = C.byProd[k], cad = p.net > 0 ? p.qte / (p.net / 60) : null, ref = P.cadence_nominale;
      return '<tr><td><b>' + esc(k) + '</b></td><td class="r">' + p.n + '</td><td class="r">' + fr(p.qte) + '</td><td class="r">' + fr(p.rebut) + '</td><td class="r">' + (cad ? fr(cad) + ' /h' : '—') + '</td><td class="r">' + (cad && ref ? '<span class="rf-pill ' + tone(cad / ref, 0.9, 0.7) + '">' + pct(cad / ref) + '</span>' : '—') + '</td></tr>';
    }).join('');
    var rows = D.cycles.slice().sort(function (a, b) { return b.debut.localeCompare(a.debut); }).slice(0, 60).map(function (c) {
      var m = c.fin ? Math.round((parse(c.fin) - parse(c.debut)) / 60000) : null, net = m != null ? m - Math.min(c.arret_min || 0, m) : null;
      return '<tr><td>' + fmtDT(c.debut) + '</td><td>' + (c.fin ? fmtDT(c.fin) : '<span class="rf-pill o">en cours</span>') + '</td><td>' + esc(c.of) + '</td><td>' + esc(c.produit) + '</td><td class="r">' + (m != null ? fmtH(m) : '—') + '</td><td class="r">' + fr(c.qte) + '</td><td class="r">' + (c.rebut ? fr(c.rebut) : '') + '</td><td class="r">' + (c.arret_min ? c.arret_min + ' min' : '') + '</td><td class="r">' + (net > 0 && c.qte ? fr(c.qte / (net / 60)) + ' /h' : '—') + '</td><td>' + esc(c.motif) + '</td>'
        + '<td style="white-space:nowrap">' + (adm ? '<button class="rf-btn" data-edit="' + c.id + '">Modifier</button> <button class="rf-btn d" data-del="' + c.id + '">Supprimer</button>' : '') + '</td></tr>';
    }).join('');
    var form = !adm ? '' : '<div class="rf-box"><h3>' + (editing ? 'Modifier le cycle' : 'Nouveau cycle de mise en joint') + '</h3><div class="rf-form">'
      + '<label>N° d’OF<input id="rf-of" list="rf-ofl" value="' + esc(e.of || '') + '" maxlength="30" placeholder="OF-74041"><datalist id="rf-ofl">' + ofOptions() + '</datalist></label>'
      + '<label>Produit<input id="rf-pr" value="' + esc(e.produit || '') + '" maxlength="80"></label>'
      + '<label>Début<input id="rf-d0" type="datetime-local" value="' + esc(e.debut || isoLocal(new Date())) + '"></label>'
      + '<label>Fin (vide = cycle en cours)<input id="rf-d1" type="datetime-local" value="' + esc(e.fin || '') + '"></label>'
      + '<label>Pièces mises en joint<input id="rf-q" type="number" min="0" value="' + (e.qte != null ? e.qte : '') + '"></label>'
      + '<label>Dont rebut<input id="rf-rb" type="number" min="0" value="' + (e.rebut || '') + '"></label>'
      + '<label>Arrêts pendant le cycle (min)<input id="rf-ar" type="number" min="0" value="' + (e.arret_min || '') + '"></label>'
      + '<label>Motif des arrêts<input id="rf-mo" value="' + esc(e.motif || '') + '" maxlength="120" placeholder="changement de joint, réglage…"></label>'
      + '</div><div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="rf-btn p" id="rf-save">' + (editing ? 'Enregistrer les modifications' : 'Enregistrer le cycle') + '</button>'
      + (editing ? '<button class="rf-btn" id="rf-cancel">Annuler</button>' : '<button class="rf-btn" id="rf-start">Démarrer un cycle maintenant</button>') + '</div><div class="rf-msg" id="rf-m">' + esc(msg) + '</div></div>';
    var settings = !adm ? '' : '<div class="rf-box"><h3>Réglages de la machine</h3><div class="rf-form">'
      + '<label>Cadence nominale (pièces / heure)<input id="rf-cn" type="number" min="1" value="' + (P.cadence_nominale || '') + '" placeholder="ex. 3000"></label>'
      + '<label>Heures d’ouverture par jour<input id="rf-hj" type="number" min="0.5" max="24" step="0.5" value="' + P.heures_jour + '"></label>'
      + '<label>Jours travaillés<span style="display:flex;gap:6px;flex-wrap:wrap;margin-top:2px">' + [1, 2, 3, 4, 5, 6, 0].map(function (j) { return '<label style="flex-direction:row;align-items:center;gap:3px"><input type="checkbox" data-j="' + j + '"' + (P.jours.indexOf(j) >= 0 ? ' checked' : '') + '>' + JOURS[j] + '</label>'; }).join('') + '</span></label>'
      + '<button class="rf-btn" id="rf-sp">Enregistrer les réglages</button></div></div>';
    el.innerHTML = '<div class="rf-hero"><i class="ti ti-circle-half-2" style="font-size:26px"></i><h2>Mise en joint<small>machine RFIP</small></h2>' + (adm ? '' : '<small>Consultation seule</small>') + '<button class="rf-btn" id="rf-xl">Exporter (Excel)</button></div>'
      + '<div class="rf-wrap">' + live + '<div class="rf-bar">' + chips + '<span class="rf-help" style="margin-left:auto">' + C.done + ' cycle(s) terminé(s) sur la période</span></div>'
      + '<div class="rf-kpis">'
      + '<div class="rf-k"><span>Taux d’occupation</span><b>' + pct(C.occ) + '</b><em>' + fmtH(C.run) + ' de marche sur ' + fmtH(C.ouvre) + ' d’ouverture</em></div>'
      + '<div class="rf-k"><span>Cadence réelle</span><b>' + (C.cadence ? fr(C.cadence) : '—') + '<small style="font-size:13px"> /h</small></b><em>' + (C.nominal ? 'objectif ' + fr(C.nominal) + ' /h' : 'cadence nominale à renseigner') + '</em></div>'
      + '<div class="rf-k"><span>Rendement de cadence</span><b>' + pct(C.perf) + '</b><em>cadence réelle ÷ cadence nominale</em></div>'
      + '<div class="rf-k"><span>Pièces bonnes</span><b>' + pct(C.qual) + '</b><em>' + fr(C.qte - C.rebut) + ' bonnes sur ' + fr(C.qte) + '</em></div>'
      + '<div class="rf-k"><span>Efficience globale</span><b>' + pct(C.oee) + '</b><em>temps utile × cadence × pièces bonnes</em></div>'
      + '<div class="rf-k"><span>Temps d’arrêt</span><b>' + fmtH(C.arret) + '</b><em>' + pct(C.run > 0 ? C.arret / C.run : null) + ' du temps de marche</em></div></div>'
      + form
      + '<div class="rf-box"><h3>Heures de marche par jour <span class="rf-help">(trait orange : heures d’ouverture)</span></h3>' + chart + '</div>'
      + '<div class="rf-box"><h3>Par produit</h3>' + (prod ? '<table class="rf-t"><tr><th>Produit</th><th class="r">Cycles</th><th class="r">Pièces</th><th class="r">Rebut</th><th class="r">Cadence</th><th class="r">Rendement</th></tr>' + prod + '</table>' : '<p class="rf-help">Pas encore de cycle terminé sur cette période.</p>') + '</div>'
      + '<div class="rf-box"><h3>Derniers cycles</h3>' + (rows ? '<div style="overflow:auto"><table class="rf-t"><tr><th>Début</th><th>Fin</th><th>OF</th><th>Produit</th><th class="r">Durée</th><th class="r">Pièces</th><th class="r">Rebut</th><th class="r">Arrêts</th><th class="r">Cadence</th><th>Motif</th><th></th></tr>' + rows + '</table></div>' : '<p class="rf-help">Aucun cycle enregistré. ' + (adm ? 'Utilisez le formulaire ci-dessus à chaque début de mise en joint.' : '') + '</p>') + '</div>'
      + settings
      + '<p class="rf-help">Les définitions : <b>taux d’occupation</b> = temps de marche ÷ temps d’ouverture · <b>cadence réelle</b> = pièces ÷ heures de marche hors arrêts · <b>efficience globale</b> = (heures utiles ÷ heures d’ouverture) × rendement de cadence × part de pièces bonnes.</p></div>';
    bind(el);
  }
  function bind(el) {
    var $ = function (s) { return el.querySelector(s); };
    el.querySelectorAll('[data-per]').forEach(function (b) { b.onclick = function () { period = b.dataset.per; window.renderRfip(); }; });
    var sv = function (body, ok) {
      return api('POST', body).then(function (j) { if (!j._ok) { msg = j.error || 'Refusé.'; var m = $('#rf-m'); if (m) { m.className = 'rf-msg e'; m.textContent = msg; } return; } D = j; editId = null; msg = ok || ''; window.renderRfip(); });
    };
    var save = $('#rf-save');
    if (save) save.onclick = function () {
      var cyc = { of: $('#rf-of').value, produit: $('#rf-pr').value, debut: $('#rf-d0').value, fin: $('#rf-d1').value || null, qte: $('#rf-q').value === '' ? 0 : Number($('#rf-q').value), rebut: $('#rf-rb').value === '' ? 0 : Number($('#rf-rb').value), arret_min: $('#rf-ar').value === '' ? 0 : Number($('#rf-ar').value), motif: $('#rf-mo').value };
      sv(editId ? { action: 'update', id: editId, cycle: cyc } : { action: 'add', cycle: cyc }, 'Cycle enregistré.');
    };
    var of = $('#rf-of'); if (of) of.onchange = function () { var o = (typeof ofs !== 'undefined' ? ofs : []).filter(function (x) { return x.id === of.value; })[0]; if (o && !$('#rf-pr').value) $('#rf-pr').value = o.produit || ''; if (o && !$('#rf-q').value) $('#rf-q').value = o.qty || ''; };
    var cn = $('#rf-cancel'); if (cn) cn.onclick = function () { editId = null; window.renderRfip(); };
    var st = $('#rf-start'); if (st) st.onclick = function () { sv({ action: 'add', cycle: { of: $('#rf-of').value, produit: $('#rf-pr').value, debut: isoLocal(new Date()), fin: null, qte: 0, rebut: 0, arret_min: 0, motif: '' } }, 'Cycle démarré : pensez à le terminer à la fin de la mise en joint.'); };
    el.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { editId = b.dataset.edit; window.renderRfip(); window.scrollTo(0, 0); el.scrollTop = 0; }; });
    el.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (confirm('Supprimer ce cycle ?')) sv({ action: 'delete', id: b.dataset.del }, 'Cycle supprimé.'); }; });
    el.querySelectorAll('[data-end]').forEach(function (b) {
      b.onclick = function () {
        var c = D.cycles.filter(function (x) { return x.id === b.dataset.end; })[0]; if (!c) return;
        var q = prompt('Nombre de pièces mises en joint pendant ce cycle :', c.qte || ''); if (q === null) return;
        var rb = prompt('Dont rebut (0 si aucun) :', c.rebut || 0); if (rb === null) return;
        var ar = prompt('Minutes d’arrêt pendant le cycle (0 si aucun) :', c.arret_min || 0); if (ar === null) return;
        sv({ action: 'update', id: c.id, cycle: Object.assign({}, c, { fin: isoLocal(new Date()), qte: Number(q) || 0, rebut: Number(rb) || 0, arret_min: Number(ar) || 0 }) }, 'Cycle terminé.');
      };
    });
    var sp = $('#rf-sp'); if (sp) sp.onclick = function () {
      var j = []; el.querySelectorAll('[data-j]').forEach(function (c) { if (c.checked) j.push(Number(c.dataset.j)); });
      sv({ action: 'params', params: { cadence_nominale: $('#rf-cn').value === '' ? null : Number($('#rf-cn').value), heures_jour: Number($('#rf-hj').value), jours: j } }, 'Réglages enregistrés.');
    };
    var xl = $('#rf-xl'); if (xl) xl.onclick = function () {
      var go = function () {
        var safe = window.csvSafe || function (v) { return v; };
        var data = [['Début', 'Fin', 'OF', 'Produit', 'Durée (min)', 'Pièces', 'Rebut', 'Arrêts (min)', 'Motif', 'Saisi par']].concat(D.cycles.slice().sort(function (a, b) { return a.debut.localeCompare(b.debut); }).map(function (c) {
          return [c.debut.replace('T', ' '), c.fin ? c.fin.replace('T', ' ') : '', safe(c.of), safe(c.produit), c.fin ? Math.round((parse(c.fin) - parse(c.debut)) / 60000) : '', c.qte, c.rebut, c.arret_min, safe(c.motif), safe(c.par || '')];
        }));
        var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'RFIP'); XLSX.writeFile(wb, 'mise-en-joint-RFIP.xlsx');
      };
      if (typeof XLSX !== 'undefined') go(); else if (typeof loadXLSX === 'function') loadXLSX(go);
    };
  }
})();
