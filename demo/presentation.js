// ═══ Mode Présentation du PDP ═══════════════════════════════════════════════
// Plein écran pour la réunion PDP : une page par client (OEM) puis une page par famille de tenon RTD,
// avec stock, commandes, verdict et OF en cours. Navigation au clavier, ordre des pages modifiable par glisser-déposer,
// comparaison avec la réunion précédente, notes de décision et compte rendu à télécharger.
// Lecture seule : ce mode n'écrit jamais dans les données du PDP (notes et photos d'état restent dans ce navigateur).
(function () {
  'use strict';
  var KEY_CFG = 'pp_pres_cfg', KEY_SNAP = 'pp_pres_snaps', KEY_NOTES = 'pp_pres_notes';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fr = function (n) { return (Number(n) || 0).toLocaleString('fr'); };
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible : on continue sans */ } }
  var todayISO = function () { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  var fmtDate = function (iso) { return iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : ''; };

  var css = document.createElement('style');
  css.textContent = [
    '#pres-root{position:fixed;inset:0;z-index:100000;background:#0E1A22;color:#E8EEF2;font-family:var(--font,system-ui,sans-serif);display:flex;flex-direction:column;font-size:clamp(15px,1.25vw,30px)}',
    '#pres-root *{box-sizing:border-box}',
    '.pr-top{display:flex;align-items:center;gap:14px;padding:12px 22px;background:#0A141B;border-bottom:1px solid rgba(255,255,255,.08)}',
    '.pr-top h1{margin:0;font-size:1.5em;font-weight:700;flex:1;display:flex;align-items:center;gap:12px}',
    '.pr-dot{width:.7em;height:.7em;border-radius:50%;display:inline-block}',
    '.pr-cnt{color:#8FA3B0;font-size:.8em;white-space:nowrap}',
    '.pr-b{background:rgba(255,255,255,.08);color:#E8EEF2;border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:.45em .9em;font:inherit;font-size:.8em;cursor:pointer;display:inline-flex;gap:.4em;align-items:center}',
    '.pr-b:hover{background:rgba(255,255,255,.16)}.pr-b.on{background:#1D9E75;border-color:#1D9E75;color:#fff}',
    '.pr-body{flex:1;display:flex;min-height:0}',
    '.pr-side{width:19em;max-width:32vw;background:#0A141B;border-right:1px solid rgba(255,255,255,.08);overflow:auto;padding:12px;display:none}',
    '.pr-side.on{display:block}.pr-side h3{margin:4px 6px 10px;font-size:.8em;color:#8FA3B0;text-transform:uppercase;letter-spacing:.08em}',
    '.pr-it{display:flex;align-items:center;gap:8px;padding:.5em .6em;border-radius:8px;cursor:grab;font-size:.85em;border:1px solid transparent}',
    '.pr-it:hover{background:rgba(255,255,255,.06)}.pr-it.cur{background:rgba(29,158,117,.18);border-color:rgba(29,158,117,.5)}.pr-it.off{opacity:.4}.pr-it.over{border-color:#35D6C4}',
    '.pr-it .x{margin-left:auto;background:none;border:none;color:#8FA3B0;cursor:pointer;font-size:1.1em}',
    '.pr-main{flex:1;overflow:auto;padding:18px 26px 30px}',
    '.pr-kpis{display:flex;gap:14px;margin-bottom:16px;flex-wrap:wrap}',
    '.pr-kpi{background:#14232D;border-radius:14px;padding:.6em 1.1em;min-width:9em}.pr-kpi b{display:block;font-size:1.8em;line-height:1.1}.pr-kpi span{color:#8FA3B0;font-size:.8em}',
    '.pr-hd,.pr-row{display:grid;grid-template-columns:1.7fr 2.5fr 1fr 1.5fr 2fr;gap:14px;align-items:center;padding:.6em 1em}',
    '.pr-hd{color:#8FA3B0;font-size:.75em;text-transform:uppercase;letter-spacing:.08em}',
    '.pr-row{background:#14232D;border-radius:14px;margin-bottom:9px;border-left:6px solid #35566A}',
    '.pr-row.bad{border-left-color:#E5484D;background:#2A171B}.pr-row.ok{border-left-color:#1D9E75}',
    '.pr-nm{font-size:1.45em;font-weight:700;line-height:1.1}.pr-lb{color:#8FA3B0;font-size:.7em;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.pr-num{font-size:1.7em;font-weight:700;font-variant-numeric:tabular-nums}.pr-dl{font-size:.55em;font-weight:600;margin-left:.4em}.pr-dl.up{color:#4ADE80}.pr-dl.dn{color:#FF8A8F}',
    '.pr-v{display:inline-block;padding:.25em .8em;border-radius:999px;font-weight:700;font-size:.95em}',
    '.pr-v.ok{background:#12372B;color:#4ADE80}.pr-v.bad{background:#4A1D22;color:#FF8A8F}',
    '.pr-vs{display:block;color:#FF8A8F;font-size:.7em;margin-top:.2em}',
    '.pr-of{display:inline-flex;gap:.4em;align-items:center;padding:.2em .65em;border-radius:999px;font-size:.72em;font-weight:600;margin:0 .35em .3em 0;background:#1F3442}',
    '.pr-of i{width:.6em;height:.6em;border-radius:50%;display:inline-block}',
    '.pr-stk{display:flex;flex-direction:column;gap:.1em}',
    '.pr-lv{display:grid;grid-template-columns:1fr auto 3.4em;gap:.6em;align-items:baseline;font-size:.8em;color:#B9C8D2}.pr-lv span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.pr-lv b{font-variant-numeric:tabular-nums;color:#E8EEF2;font-size:1.05em}.pr-lv i{font-style:normal;color:#6F8797;font-size:.85em;text-align:right}.pr-lv.fg span,.pr-lv.fg b{color:#7FE3C0}',
    '.pr-tot{display:flex;align-items:baseline;gap:.6em;margin-top:.25em;padding-top:.3em;border-top:1px solid rgba(255,255,255,.14)}.pr-tot span{flex:1;font-size:.72em;color:#8FA3B0;text-transform:uppercase;letter-spacing:.05em}.pr-tot b{font-size:1.7em;font-variant-numeric:tabular-nums}',
    '.pr-nt{background:none;border:1px dashed rgba(255,255,255,.2);color:#8FA3B0;border-radius:8px;padding:.15em .6em;font:inherit;font-size:.65em;cursor:pointer;margin-top:.4em}',
    '.pr-nt.has{border-style:solid;border-color:#D4880A;color:#F5B65A}',
    '.pr-card{background:#14232D;border-radius:16px;padding:1em 1.2em;cursor:pointer;border-top:5px solid #35566A}.pr-card:hover{background:#1A2E3A}',
    '.pr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(15em,1fr));gap:14px}',
    '.pr-ov{position:absolute;inset:0;background:rgba(0,0,0,.6);display:grid;place-items:center;z-index:5}',
    '.pr-box{background:#14232D;border-radius:16px;padding:1.2em 1.4em;width:min(46em,92vw);max-height:84vh;overflow:auto}',
    '.pr-box textarea{width:100%;min-height:5em;background:#0E1A22;color:#E8EEF2;border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:.6em;font:inherit;font-size:.9em}',
    '.pr-empty{color:#8FA3B0;padding:2em;text-align:center}',
    '.pr-ptn{display:inline-flex;margin-left:12px}'
  ].join('\n');
  document.head.appendChild(css);

  // ───── données ─────
  function groups() {
    var cl = {}, fam = {};
    pdpGetActiveCorrespondances().forEach(function (c) {
      if (c.client === 'RTD' && c.famille && c.famille !== 'RTD') (fam[c.famille] = fam[c.famille] || []).push(c);
      else (cl[c.client] = cl[c.client] || []).push(c);
    });
    return { cl: cl, fam: fam };
  }
  // Déclinaison du stock par niveau de fabrication (non jointé → jointé → blister → produit fini), même calcul que les tuiles du PDP.
  function levelsOf(r) {
    var kit = (typeof INTROKITS !== 'undefined') ? INTROKITS[r.code_client] : null, L = [];
    if (kit) {
      kit.composants.forEach(function (c) {
        var stk = (typeof pdpGetStockForWip === 'function') ? pdpGetStockForWip(c.codart) : 0;
        L.push({ label: c.label, raw: stk || 0, fg: Math.floor((stk || 0) / (c.qte || 1)), ratio: c.qte || 1, isFG: false });
      });
      return { L: L, kit: true, total: L.length ? Math.min.apply(null, L.map(function (l) { return l.fg; })) : 0 };
    }
    var _stk = typeof pdpGetStockForWip === 'function' ? pdpGetStockForWip : function () { return 0; };
    var _enc = typeof pdpGetEnCoursForWip === 'function' ? pdpGetEnCoursForWip : function () { return 0; };
    var noms = pdpFindAllNomenclatures(r.codart_wip, r.code_client);
    if (!noms.length) { var v = _stk(r.codart_wip) + _enc(r.codart_wip); return { L: [{ label: r.libelle_fg || r.codart_wip, raw: v, fg: v, ratio: 1, isFG: true }], total: v }; }
    noms.forEach(function (nom) {
      var et = nom.etapes;
      et.forEach(function (e, i) {
        var cum = 1; for (var j = i; j < et.length - 1; j++) if (et[j].ratio) cum *= et[j].ratio;
        var enc = i === 0 ? _enc(e.codart) : 0, raw = pdpStockForEtape(e, null, i, -1, _stk) + enc;
        L.push({ label: e.label, raw: raw, enc: enc, fg: cum > 1 ? Math.floor(raw / cum) : raw, ratio: cum, isFG: e.ratio === null });
      });
    });
    return { L: L, total: L.reduce(function (a, l) { return a + l.fg; }, 0) };
  }
  function rowData(r) {
    var d = { code: r.code_client, name: '', lib: r.libelle_fg || '', stock: 0, cde: 0, rupture: null, ofs: [], err: false };
    try {
      d.name = r._shortName || pdpAutoShortName(r);
      var lv = levelsOf(r); d.levels = lv ? lv.L : null; d.kit = !!(lv && lv.kit);
      d.stock = pdpGetTotalFGForRef(r.codart_wip, r.code_client);
      d.cde = pdpGetCommandesForRef(pdpResolveFG(r.codart_wip, r.code_client));
      d.rupture = pdpCalcRupture(r.code_client, d.stock);
      d.ofs = pdpGetOFsForRef(r.codart_wip, pdpAutoShortName(r)).concat(typeof foretsGetOFsForRef === 'function' ? foretsGetOFsForRef(r.codart_wip) : []);
    } catch (e) { d.err = true; d.name = d.name || r.code_client; }
    d.bad = !!d.rupture || (d.stock - d.cde) < 0;
    return d;
  }
  var CACHE = null;
  function build() {
    var g = groups(), S = [];
    S.push({ id: 'syn', title: 'Vue d’ensemble', color: '#35D6C4' });
    S.push({ id: 'alert', title: 'À décider aujourd’hui', color: '#E5484D' });
    Object.keys(g.cl).sort().forEach(function (k) { S.push({ id: 'c:' + k, title: k, color: ((PDP_CLIENT_COLORS[k] || {}).dot) || '#35D6C4', refs: g.cl[k] }); });
    Object.keys(g.fam).sort().forEach(function (k) { S.push({ id: 'f:' + k, title: k, sub: 'Famille RTD', color: ((RTD_FAM_COLORS[k] || {}).dot) || '#35D6C4', refs: g.fam[k] }); });
    S.forEach(function (s) { if (s.refs) s.rows = s.refs.map(rowData); });
    return S;
  }
  function orderedScenes(all, cfg) {
    var byId = {}; all.forEach(function (s) { byId[s.id] = s; });
    var out = [], seen = {};
    (cfg.order || []).forEach(function (id) { if (byId[id] && !seen[id]) { out.push(byId[id]); seen[id] = 1; } });
    all.forEach(function (s) { if (!seen[s.id]) out.push(s); });
    return out;
  }
  function lastSnap() { var a = lsGet(KEY_SNAP, []); return a.length ? a[a.length - 1] : null; }

  // ───── affichage ─────
  var st = null; // état d'une présentation en cours
  function delta(now, prev) {
    if (prev == null || now === prev) return '';
    var d = now - prev; return '<span class="pr-dl ' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? '▲ +' : '▼ ') + fr(d) + '</span>';
  }
  function ofChips(ofs) {
    if (!ofs.length) return '<span style="color:#5F7686;font-size:.8em">—</span>';
    var STG = {}; (typeof STAGES !== 'undefined' ? STAGES : []).forEach(function (s) { STG[s.id] = s; });
    var h = ofs.slice(0, 4).map(function (o) {
      var s = STG[o.stage] || { label: o.stage, color: '#8FA3B0' };
      var dl = o.deadline ? fmtDate(String(o.deadline).slice(0, 10)).slice(0, 5) : '';
      return '<span class="pr-of" title="' + esc(o.id + ' — ' + o.produit) + '"><i style="background:' + s.color + '"></i>' + esc(s.label) + ' · ' + fr(o.qty) + (dl ? ' · ' + dl : '') + '</span>';
    }).join('');
    if (ofs.length > 4) h += '<span class="pr-of">+' + (ofs.length - 4) + '</span>';
    return h;
  }
  function stockCell(d, prev) {
    var tot = '<div class="pr-tot"><span>' + (d.kit ? 'Kits complets possibles' : d.levels && d.levels.length > 1 ? 'Total en produits finis' : 'Stock') + '</span><b>' + fr(d.stock) + '</b>' + delta(d.stock, prev && prev.stock) + '</div>';
    if (!st.detail || !d.levels || d.levels.length < 2) return tot;
    var lv = d.levels.map(function (l) {
      return '<div class="pr-lv' + (l.isFG ? ' fg' : '') + '" title="' + esc(l.label) + (l.ratio > 1 ? ' — ' + fr(l.raw) + ' ÷ ' + l.ratio + ' = ' + fr(l.fg) + ' produits finis' : '') + '"><span>' + esc(l.label) + '</span><b>' + fr(l.raw) + '</b><i>' + (l.ratio > 1 ? '≈ ' + fr(l.fg) : '') + '</i></div>';
    }).join('');
    return '<div class="pr-stk">' + lv + tot + '</div>';
  }
  function rowHtml(d, snap, scene) {
    var prev = snap && snap.rows ? snap.rows[d.code] : null, note = (st.notes[d.code] || {}).text;
    var verdict = d.bad
      ? '<span class="pr-v bad">' + (d.rupture ? 'Rupture le ' + fmtDate(d.rupture.date).slice(0, 5) : 'Insuffisant') + '</span>' + (d.rupture ? '<span class="pr-vs">manque ' + fr(d.rupture.manque) + '</span>' : '<span class="pr-vs">solde ' + fr(d.stock - d.cde) + '</span>')
      : '<span class="pr-v ok">✓ Couvert</span>';
    return '<div class="pr-row ' + (d.bad ? 'bad' : 'ok') + '">'
      + '<div><div class="pr-nm">' + esc(d.name) + '</div><div class="pr-lb" title="' + esc(d.lib) + '">' + esc(d.lib) + '</div>'
      + '<button class="pr-nt' + (note ? ' has' : '') + '" data-note="' + esc(d.code) + '" data-name="' + esc(d.name) + '" data-scene="' + esc(scene.title) + '">' + (note ? '✎ ' + esc(note.length > 34 ? note.slice(0, 34) + '…' : note) : '＋ Décision') + '</button></div>'
      + '<div>' + stockCell(d, prev) + '</div>'
      + '<div class="pr-num" style="color:#FF9A9E">' + fr(d.cde) + delta(d.cde, prev && prev.cde) + '</div>'
      + '<div>' + verdict + '</div>'
      + '<div>' + ofChips(d.ofs) + '</div></div>';
  }
  function kpi(v, l, c) { return '<div class="pr-kpi"><b' + (c ? ' style="color:' + c + '"' : '') + '>' + v + '</b><span>' + l + '</span></div>'; }
  var HEAD = '<div class="pr-hd"><div>Produit</div><div>Stock par niveau</div><div>En commande</div><div>Couverture</div><div>En production</div></div>';

  function sceneBody(s, all) {
    var snap = st.snap;
    if (s.id === 'syn') {
      var g = all.filter(function (x) { return x.rows; });
      return '<div class="pr-grid">' + g.map(function (x) {
        var stock = 0, cde = 0, bad = 0; x.rows.forEach(function (d) { stock += d.stock; cde += d.cde; if (d.bad) bad++; });
        return '<div class="pr-card" data-go="' + esc(x.id) + '" style="border-top-color:' + x.color + '"><div style="font-weight:700;font-size:1.2em;margin-bottom:.4em">' + esc(x.title) + '</div>'
          + '<div style="display:flex;justify-content:space-between;color:#8FA3B0;font-size:.8em"><span>Stock</span><b style="color:#E8EEF2">' + fr(stock) + '</b></div>'
          + '<div style="display:flex;justify-content:space-between;color:#8FA3B0;font-size:.8em"><span>Commandes</span><b style="color:#FF9A9E">' + fr(cde) + '</b></div>'
          + '<div style="margin-top:.5em">' + (bad ? '<span class="pr-v bad" style="font-size:.8em">' + bad + ' à traiter</span>' : '<span class="pr-v ok" style="font-size:.8em">✓ Tout couvert</span>') + '</div></div>';
      }).join('') + '</div>';
    }
    if (s.id === 'alert') {
      var L = []; all.forEach(function (x) { (x.rows || []).forEach(function (d) { if (d.bad) L.push({ d: d, x: x }); }); });
      L.sort(function (a, b) { return String(a.d.rupture ? a.d.rupture.date : '9999').localeCompare(String(b.d.rupture ? b.d.rupture.date : '9999')); });
      if (!L.length) return '<div class="pr-empty">Rien à décider : tout est couvert.</div>';
      return '<div class="pr-kpis">' + kpi(L.length, 'références à traiter', '#FF8A8F') + '</div>' + HEAD + L.map(function (e) { return rowHtml(e.d, snap, e.x); }).join('');
    }
    var rows = s.rows.slice(); if (st.badFirst) rows.sort(function (a, b) { return (b.bad ? 1 : 0) - (a.bad ? 1 : 0); });
    var stock = 0, cde = 0, bad = 0; rows.forEach(function (d) { stock += d.stock; cde += d.cde; if (d.bad) bad++; });
    return '<div class="pr-kpis">' + kpi(rows.length, 'références') + kpi(fr(stock), 'en stock') + kpi(fr(cde), 'en commande', '#FF9A9E') + kpi(bad, 'à traiter', bad ? '#FF8A8F' : '#4ADE80') + '</div>' + HEAD + rows.map(function (d) { return rowHtml(d, snap, s); }).join('');
  }

  function render() {
    var list = st.list.filter(function (s) { return !st.cfg.hidden[s.id]; });
    if (!list.length) list = st.list;
    if (st.i >= list.length) st.i = list.length - 1; if (st.i < 0) st.i = 0;
    var s = list[st.i], root = st.root;
    root.querySelector('.pr-top h1').innerHTML = '<span class="pr-dot" style="background:' + s.color + '"></span>' + esc(s.title) + (s.sub ? '<span class="pr-cnt">' + esc(s.sub) + '</span>' : '');
    root.querySelector('.pr-cnt.n').textContent = (st.i + 1) + ' / ' + list.length;
    root.querySelector('.pr-main').innerHTML = sceneBody(s, st.list);
    root.querySelector('.pr-snapinfo').textContent = st.snap ? 'Comparé au ' + fmtDate(st.snap.date) : 'Pas encore de comparaison';
    root.querySelector('[data-a="bad"]').classList.toggle('on', st.badFirst); root.querySelector('[data-a="detail"]').classList.toggle('on', st.detail);
    // sommaire
    var side = root.querySelector('.pr-side');
    side.innerHTML = '<h3>Pages · glisser pour réordonner</h3>' + st.list.map(function (x) {
      var vis = !st.cfg.hidden[x.id], cur = vis && x.id === s.id;
      return '<div class="pr-it' + (cur ? ' cur' : '') + (vis ? '' : ' off') + '" draggable="true" data-id="' + esc(x.id) + '"><span class="pr-dot" style="background:' + x.color + '"></span>' + esc(x.title) + '<button class="x" data-vis="' + esc(x.id) + '" title="' + (vis ? 'Masquer cette page' : 'Afficher cette page') + '">' + (vis ? '👁' : '🚫') + '</button></div>';
    }).join('');
    st.cur = s;
  }
  function go(n) { var list = st.list.filter(function (s) { return !st.cfg.hidden[s.id]; }); st.i = Math.max(0, Math.min(list.length - 1, n)); render(); }
  function goId(id) { var list = st.list.filter(function (s) { return !st.cfg.hidden[s.id]; }); var k = list.findIndex(function (s) { return s.id === id; }); if (k >= 0) go(k); }
  function saveCfg() { st.cfg.order = st.list.map(function (s) { return s.id; }); lsSet(KEY_CFG, st.cfg); }

  function noteDlg(code, name, sceneTitle) {
    var ov = document.createElement('div'); ov.className = 'pr-ov'; var cur = (st.notes[code] || {}).text || '';
    ov.innerHTML = '<div class="pr-box"><h2 style="margin:0 0 .5em">' + esc(name) + ' <span class="pr-cnt">' + esc(sceneTitle) + '</span></h2><textarea id="pr-ta" maxlength="400" placeholder="Décision, action, responsable… (ex. Lancer un OF de 5 000 — chef d’atelier — pour le 20/11)"></textarea>'
      + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:.8em"><button class="pr-b" data-x="1">Annuler</button>' + (cur ? '<button class="pr-b" data-del="1">Supprimer</button>' : '') + '<button class="pr-b on" data-ok="1">Enregistrer</button></div></div>';
    st.root.appendChild(ov); var ta = ov.querySelector('#pr-ta'); ta.value = cur; ta.focus();
    ov.addEventListener('click', function (e) {
      var t = e.target; if (t === ov || t.dataset.x) return ov.remove();
      if (t.dataset.ok || t.dataset.del) {
        var v = t.dataset.del ? '' : ta.value.trim();
        if (v) st.notes[code] = { text: v, name: name, scene: sceneTitle, ts: new Date().toISOString() }; else delete st.notes[code];
        lsSet(KEY_NOTES, { date: todayISO(), notes: st.notes }); ov.remove(); render();
      }
    });
  }
  function reportText() {
    var n = Object.keys(st.notes).map(function (k) { return st.notes[k]; }), L = ['Compte rendu PDP — ' + fmtDate(todayISO()), ''];
    if (!n.length) L.push('Aucune décision saisie.');
    var by = {}; n.forEach(function (x) { (by[x.scene] = by[x.scene] || []).push(x); });
    Object.keys(by).forEach(function (sc) { L.push(sc.toUpperCase()); by[sc].forEach(function (x) { L.push('  • ' + x.name + ' : ' + x.text); }); L.push(''); });
    return L.join('\n');
  }
  function reportDlg() {
    var ov = document.createElement('div'); ov.className = 'pr-ov';
    ov.innerHTML = '<div class="pr-box"><h2 style="margin:0 0 .5em">Compte rendu</h2><pre style="white-space:pre-wrap;font:inherit;font-size:.85em;background:#0E1A22;padding:.8em;border-radius:10px">' + esc(reportText()) + '</pre>'
      + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:.8em"><button class="pr-b" data-x="1">Fermer</button><button class="pr-b" data-cp="1">Copier</button><button class="pr-b on" data-dl="1">Télécharger (.txt)</button></div></div>';
    st.root.appendChild(ov);
    ov.addEventListener('click', function (e) {
      var t = e.target; if (t === ov || t.dataset.x) return ov.remove();
      if (t.dataset.cp) { try { navigator.clipboard.writeText(reportText()); t.textContent = 'Copié ✓'; } catch (x) { t.textContent = 'Copie impossible'; } }
      if (t.dataset.dl) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([reportText()], { type: 'text/plain;charset=utf-8' })); a.download = 'compte-rendu-PDP-' + todayISO() + '.txt'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); }
    });
  }
  function saveSnapshot(btn) {
    var rows = {}; st.list.forEach(function (s) { (s.rows || []).forEach(function (d) { rows[d.code] = { stock: d.stock, cde: d.cde }; }); });
    var a = lsGet(KEY_SNAP, []).filter(function (x) { return x.date !== todayISO(); }); a.push({ date: todayISO(), rows: rows }); lsSet(KEY_SNAP, a.slice(-8));
    btn.textContent = '✓ État enregistré';
  }

  function open() {
    if (st) return;
    var all = build(), cfg = lsGet(KEY_CFG, { order: [], hidden: {} }); cfg.hidden = cfg.hidden || {};
    var saved = lsGet(KEY_NOTES, { date: '', notes: {} });
    var prev = lastSnap(), snap = prev && prev.date < todayISO() ? prev : (lsGet(KEY_SNAP, []).slice(-2, -1)[0] || null);
    var root = document.createElement('div'); root.id = 'pres-root'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Présentation du PDP');
    root.innerHTML = '<div class="pr-top"><button class="pr-b" data-a="side" title="Sommaire (S)">☰ Pages</button><h1></h1><span class="pr-cnt pr-snapinfo"></span><span class="pr-cnt n"></span>'
      + '<button class="pr-b" data-a="detail" title="Afficher ou masquer le détail du stock par niveau (non jointé, jointé, blister, produit fini)">Détail du stock</button>'
      + '<button class="pr-b" data-a="bad" title="Les produits à traiter en premier">Problèmes d’abord</button>'
      + '<button class="pr-b" data-a="report">Compte rendu</button><button class="pr-b" data-a="snap" title="Enregistre le stock et les commandes d’aujourd’hui pour les comparer à la prochaine réunion">Enregistrer l’état</button>'
      + '<button class="pr-b" data-a="fs" title="Plein écran (F)">⛶</button><button class="pr-b" data-a="quit" title="Quitter (Échap)">✕</button></div>'
      + '<div class="pr-body"><div class="pr-side"></div><div class="pr-main" tabindex="0"></div></div>';
    document.body.appendChild(root);
    st = { root: root, list: orderedScenes(all, cfg), cfg: cfg, i: 0, snap: snap, badFirst: false, detail: true, notes: saved.date === todayISO() ? saved.notes : {} };
    document.body.style.overflow = 'hidden';
    root.addEventListener('click', function (e) {
      var t = e.target.closest('button,.pr-card,.pr-it'); if (!t) return;
      if (t.dataset.vis) { e.stopPropagation(); st.cfg.hidden[t.dataset.vis] = !st.cfg.hidden[t.dataset.vis]; saveCfg(); return render(); }
      if (t.dataset.note) return noteDlg(t.dataset.note, t.dataset.name, t.dataset.scene);
      if (t.dataset.go) return goId(t.dataset.go);
      if (t.classList.contains('pr-it')) return goId(t.dataset.id);
      var a = t.dataset.a; if (!a) return;
      if (a === 'quit') close(); else if (a === 'side') root.querySelector('.pr-side').classList.toggle('on');
      else if (a === 'bad') { st.badFirst = !st.badFirst; render(); }
      else if (a === 'detail') { st.detail = !st.detail; render(); }
      else if (a === 'report') reportDlg(); else if (a === 'snap') saveSnapshot(t);
      else if (a === 'fs') { if (document.fullscreenElement) document.exitFullscreen(); else if (root.requestFullscreen) root.requestFullscreen().catch(function () { }); }
    });
    // glisser-déposer des pages dans le sommaire
    var drag = null, side = root.querySelector('.pr-side');
    side.addEventListener('dragstart', function (e) { var it = e.target.closest('.pr-it'); if (it) { drag = it.dataset.id; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', drag); } catch (x) { } } });
    side.addEventListener('dragover', function (e) { var it = e.target.closest('.pr-it'); if (it && drag) { e.preventDefault(); side.querySelectorAll('.over').forEach(function (n) { n.classList.remove('over'); }); it.classList.add('over'); } });
    side.addEventListener('drop', function (e) {
      var it = e.target.closest('.pr-it'); if (!it || !drag) return; e.preventDefault();
      var from = st.list.findIndex(function (s) { return s.id === drag; }), to = st.list.findIndex(function (s) { return s.id === it.dataset.id; });
      if (from < 0 || to < 0 || from === to) return; var curId = st.cur && st.cur.id;
      st.list.splice(to, 0, st.list.splice(from, 1)[0]); drag = null; saveCfg(); render(); if (curId) goId(curId);
    });
    document.addEventListener('keydown', onKey, true);
    render(); root.querySelector('.pr-main').focus();
  }
  function onKey(e) {
    if (!st) return; var tag = (e.target.tagName || '').toLowerCase(); if (tag === 'textarea' || tag === 'input') { return; }
    if (st.root.querySelector('.pr-ov')) { if (e.key === 'Escape') { e.stopPropagation(); st.root.querySelector('.pr-ov').remove(); } return; }
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); e.stopPropagation(); go(st.i + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); e.stopPropagation(); go(st.i - 1); }
    else if (k === 'Home') { go(0); } else if (k === 'End') { go(999); }
    else if (k === 'Escape') { if (document.fullscreenElement) return; e.stopPropagation(); close(); }
    else if (k === 's' || k === 'S') st.root.querySelector('.pr-side').classList.toggle('on');
    else if (k === 'f' || k === 'F') st.root.querySelector('[data-a="fs"]').click();
  }
  function close() {
    if (!st) return; document.removeEventListener('keydown', onKey, true);
    if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) { } }
    st.root.remove(); document.body.style.overflow = ''; st = null;
  }
  window.ppPresentation = open;

  // Bouton « Présentation » en tête de l'onglet PDP
  function addButton() {
    var el = document.getElementById('view-pdp'); if (!el || el.querySelector('#pres-launch')) return;
    var b = document.createElement('button'); b.id = 'pres-launch'; b.type = 'button';
    b.style.cssText = 'position:absolute;right:18px;top:10px;z-index:5;display:inline-flex;gap:6px;align-items:center;padding:8px 14px;border-radius:10px;border:0;background:#0B7F79;color:#fff;font:600 13px var(--font,system-ui);cursor:pointer;box-shadow:0 6px 16px -6px rgba(0,0,0,.4)';
    b.innerHTML = '<i class="ti ti-presentation"></i> Présentation'; b.onclick = open;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.insertBefore(b, el.firstChild);
  }
  var _r = window.renderPdpPage;
  if (typeof _r === 'function') window.renderPdpPage = function () { var x = _r.apply(this, arguments); try { addButton(); } catch (e) { } return x; };
})();
