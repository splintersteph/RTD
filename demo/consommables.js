// ═══ Consommables par produit (PDP) ═══════════════════════════════════════════
// Pour chaque produit fini : sa boîte, sa notice, ses étiquettes et tous ses accessoires.
// La liste vient d'un fichier Excel de correspondances (modèle téléchargeable) : on le remplit,
// on l'importe, et on le ré-importe quand une référence change. Lecture pour tous, import réservé aux administrateurs.
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isAdmin = () => window.PP_USER && window.PP_USER.role === 'admin';
  const TYPES = ['Boîte', 'Notice', 'Étiquette', 'Sachet', 'Accessoire', 'Autre'];
  const ICON = { 'boite': 'ti-box', 'notice': 'ti-file-text', 'etiquette': 'ti-tag', 'sachet': 'ti-package', 'accessoire': 'ti-tool' };
  const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  let ITEMS = [], loaded = false;

  function load() { return fetch('/api/consommables').then(r => r.json()).then(j => { ITEMS = j.items || []; loaded = true; }).catch(() => { loaded = true; }); }
  const produits = () => (typeof pdpGetActiveCorrespondances === 'function' ? pdpGetActiveCorrespondances() : []);

  // ── bloc affiché dans la fiche produit du PDP ──
  function bloc(code) {
    const L = ITEMS.filter(i => i.produit === code);
    const head = '<div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;display:flex;align-items:center;gap:8px">'
      + '<i class="ti ti-box-seam" style="font-size:14px"></i>Consommables (' + L.length + ')'
      + '<span style="margin-left:auto;display:flex;gap:6px;text-transform:none;letter-spacing:0">'
      + '<button class="btn cs-dl" style="font-size:11px;padding:3px 9px"><i class="ti ti-download"></i> Modèle / export</button>'
      + (isAdmin() ? '<label class="btn" style="font-size:11px;padding:3px 9px;cursor:pointer"><i class="ti ti-file-import"></i> Importer<input type="file" accept=".xlsx,.xls,.csv" style="display:none" class="cs-in"></label>' : '')
      + '</span></div>';
    if (!L.length) return head + '<p style="color:var(--text-faint);font-size:13px;margin:0">Aucun consommable renseigné pour ce produit.' + (isAdmin() ? ' Téléchargez le modèle, remplissez-le puis importez-le.' : '') + '</p>';
    const px = isAdmin() && L.some(i => i.prix_prod != null || i.prix_vente != null);   // prix : administrateurs uniquement
    const eur = n => n == null ? '—' : (+n).toLocaleString('fr', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + ' €';
    const tot = k => L.reduce((a, i) => a + (i[k] != null ? i.qte * i[k] : 0), 0);
    return head + '<table class="cat-table" style="width:100%"><thead><tr><th>Type</th><th>Référence</th><th>Désignation</th><th style="text-align:right">Par produit</th><th style="text-align:right">Pour 1 000</th>' + (px ? '<th style="text-align:right">Prix de production</th><th style="text-align:right">Prix de vente</th>' : '') + '</tr></thead><tbody>'
      + L.map(i => '<tr><td style="font-size:12px"><i class="ti ' + (ICON[norm(i.type)] || 'ti-circle-dot') + '" style="vertical-align:-2px;margin-right:5px;color:var(--accent)"></i>' + esc(i.type || '—') + '</td>'
        + '<td style="font-size:12px;font-family:monospace">' + esc(i.ref) + '</td><td style="font-size:12px">' + esc(i.designation) + (i.fournisseur ? ' <span style="color:var(--text-faint)">· ' + esc(i.fournisseur) + '</span>' : '') + '</td>'
        + '<td style="text-align:right;font-size:12px">' + (+i.qte).toLocaleString('fr') + '</td><td style="text-align:right;font-size:12px">' + Math.round(i.qte * 1000).toLocaleString('fr') + '</td>' + (px ? '<td style="text-align:right;font-size:12px">' + eur(i.prix_prod) + '</td><td style="text-align:right;font-size:12px">' + eur(i.prix_vente) + '</td>' : '') + '</tr>').join('')
      + (px ? '<tr style="font-weight:700"><td colspan="5" style="text-align:right;font-size:12px">Total par produit</td><td style="text-align:right;font-size:12px">' + eur(tot('prix_prod')) + '</td><td style="text-align:right;font-size:12px">' + eur(tot('prix_vente')) + '</td></tr>' : '')
      + '</tbody></table>';
  }

  const _show = window.pdpShowDetail;
  window.pdpShowDetail = function (code) {
    _show.apply(this, arguments);
    const go = () => {
      const body = document.querySelector('#modal .modal-body'); if (!body) return;
      const d = document.createElement('div'); d.id = 'cs-bloc'; d.innerHTML = bloc(code); body.appendChild(d);
      const dl = d.querySelector('.cs-dl'); if (dl) dl.onclick = () => telecharger(code);
      const inp = d.querySelector('.cs-in'); if (inp) inp.onchange = () => importer(inp.files[0], code);
    };
    if (loaded) go(); else load().then(go);
  };

  // ── modèle / export Excel (même mise en page pour remplir et pour ré-exporter) ──
  const COLS = ['Produit (code)', 'Type', 'Référence consommable', 'Désignation', 'Quantité par produit', 'Fournisseur', 'Commentaire', 'Prix de production (€)', 'Prix de vente (€)'];
  function telecharger(code) {
    if (typeof XLSX === 'undefined') return loadXLSX(() => telecharger(code));
    const safe = v => (typeof window.csvSafe === 'function' ? window.csvSafe(v) : v);
    const rows = ITEMS.length ? ITEMS.map(i => [i.produit, i.type, i.ref, i.designation, i.qte, i.fournisseur, i.commentaire, i.prix_prod, i.prix_vente])
      : [[code || '7100318946', 'Boîte', 'BOX-001', 'Boîte carton 10 pièces', 1, '', 'EXEMPLE : à remplacer', 0.12, 0.2], [code || '7100318946', 'Notice', 'NOT-014', 'Notice d\'utilisation FR/EN', 1, '', '', 0.03, 0.05], [code || '7100318946', 'Étiquette', 'ETQ-220', 'Étiquette lot', 1, '', '', 0.01, 0.02]];
    const ws = XLSX.utils.aoa_to_sheet([COLS].concat(rows.map(r => r.map(safe))));
    ws['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 22 }, { wch: 40 }, { wch: 12 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 18 }];
    const wp = XLSX.utils.aoa_to_sheet([['Produit (code)', 'Désignation', 'Client']].concat(produits().map(p => [p.code_client, p.libelle_fg, p.client].map(safe))));
    wp['!cols'] = [{ wch: 18 }, { wch: 46 }, { wch: 16 }];
    const wm = XLSX.utils.aoa_to_sheet([
      ['Comment remplir ce fichier'], [''],
      ['1. Une ligne = un consommable pour un produit. Un produit peut avoir autant de lignes que nécessaire.'],
      ['2. « Produit (code) » : le code de la feuille « Produits » (copiez-le tel quel).'],
      ['3. « Type » : Boîte, Notice, Étiquette, Sachet, Accessoire ou Autre.'],
      ['4. « Quantité par produit » : combien de ce consommable pour 1 produit (1 boîte pour 10 pièces = 0,1).'],
      ['5. Prix (réservés aux administrateurs, jamais visibles par les lecteurs) : prix de production et prix de vente d\'UNE unité du consommable, en euros. Colonnes facultatives.'],
      ['6. Si une référence change : corrigez la ligne, puis réimportez le fichier. L\'import REMPLACE toute la liste actuelle.'],
      ['7. Pour repartir de la liste actuelle : le bouton « Modèle / export » la contient déjà.']]);
    wm['!cols'] = [{ wch: 110 }];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Consommables'); XLSX.utils.book_append_sheet(wb, wp, 'Produits'); XLSX.utils.book_append_sheet(wb, wm, 'Mode d\'emploi');
    XLSX.writeFile(wb, 'correspondances_consommables.xlsx');
  }

  // ── import : lecture, contrôle, aperçu, puis envoi au serveur ──
  function importer(file) {
    if (!file) return;
    if (file.size > 3e6) return alert('Fichier trop lourd (3 Mo maximum).');
    if (typeof XLSX === 'undefined') return loadXLSX(() => importer(file));
    const rd = new FileReader();
    rd.onload = e => {
      let rows;
      try { const wb = XLSX.read(e.target.result, { type: 'array' }); rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' }); } catch (x) { return alert('Fichier illisible.'); }
      const map = { 'produit code': 'produit', 'produit': 'produit', 'code produit': 'produit', 'code client': 'produit', 'type': 'type', 'reference consommable': 'ref', 'reference': 'ref', 'ref': 'ref', 'designation': 'designation', 'libelle': 'designation',
        'quantite par produit': 'qte', 'quantite': 'qte', 'qte': 'qte', 'fournisseur': 'fournisseur', 'commentaire': 'commentaire',
        'prix de production': 'prix_prod', 'prix production': 'prix_prod', 'prix prod': 'prix_prod', 'prix de vente': 'prix_vente', 'prix vente': 'prix_vente' };
      const items = [], erreurs = [], connus = new Set(produits().map(p => String(p.code_client)));
      rows.forEach((r, i) => {
        const o = {}; Object.keys(r).forEach(k => { const m = map[norm(k)]; if (m) o[m] = r[k]; });
        if (!String(o.produit || '').trim() && !String(o.ref || '').trim()) return;   // ligne vide
        o.produit = String(o.produit || '').trim(); o.ref = String(o.ref || '').trim();
        const q = o.qte === '' || o.qte == null ? 1 : Number(String(o.qte).replace(',', '.'));
        if (!o.produit || !o.ref) return erreurs.push('Ligne ' + (i + 2) + ' : produit ou référence manquant');
        if (!(q > 0 && q <= 100000)) return erreurs.push('Ligne ' + (i + 2) + ' : quantité invalide');
        const px = k => { const v = o[k]; if (v === '' || v == null) return null; const n = Number(String(v).replace(/\s/g, '').replace(',', '.').replace('€', '')); return isFinite(n) && n >= 0 ? n : NaN; };
        o.prix_prod = px('prix_prod'); o.prix_vente = px('prix_vente');
        if (Number.isNaN(o.prix_prod) || Number.isNaN(o.prix_vente)) return erreurs.push('Ligne ' + (i + 2) + ' : prix invalide');
        o.qte = q; items.push(o);
      });
      const inconnus = Array.from(new Set(items.filter(i => !connus.has(i.produit)).map(i => i.produit)));
      apercu(items, erreurs, inconnus);
    };
    rd.readAsArrayBuffer(file);
  }
  function apercu(items, erreurs, inconnus) {
    const ov = document.createElement('div'); ov.className = 'pp-ov'; document.body.appendChild(ov);
    const nb = new Set(items.map(i => i.produit)).size;
    ov.innerHTML = '<div class="pp-mod" role="dialog" aria-label="Import des consommables"><h2>Import des consommables</h2>'
      + '<p><b>' + items.length + '</b> lignes valides pour <b>' + nb + '</b> produits. Cet import <b>remplace</b> la liste actuelle (' + ITEMS.length + ' lignes).</p>'
      + (inconnus.length ? '<p class="pp-msg e">Codes produit absents du PDP (vérifiez la frappe) : ' + esc(inconnus.slice(0, 12).join(', ')) + (inconnus.length > 12 ? '…' : '') + '</p>' : '')
      + (erreurs.length ? '<p class="pp-msg e">' + erreurs.length + ' ligne(s) ignorée(s) :<br>' + erreurs.slice(0, 8).map(esc).join('<br>') + (erreurs.length > 8 ? '<br>…' : '') + '</p>' : '')
      + '<div class="pp-row" style="justify-content:flex-end"><button class="pp-b" id="cs-x">Annuler</button><button class="pp-b p" id="cs-ok"' + (items.length ? '' : ' disabled') + '>Importer</button></div><div class="pp-msg e" id="cs-m"></div></div>';
    ov.querySelector('#cs-x').onclick = () => ov.remove();
    ov.querySelector('#cs-ok').onclick = () => {
      fetch('/api/consommables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: items }) })
        .then(r => r.json().then(j => ({ ok: r.ok && j.ok !== false, j: j })))
        .then(x => { if (!x.ok) { ov.querySelector('#cs-m').textContent = (x.j && x.j.error) || 'Import refusé.'; return; } ITEMS = x.j.items; ov.remove(); if (typeof closeOverlay === 'function') closeOverlay(); if (typeof showToast === 'function') showToast('✓ ' + ITEMS.length + ' consommables importés'); })
        .catch(() => { ov.querySelector('#cs-m').textContent = 'Serveur injoignable.'; });
    };
  }
})();
