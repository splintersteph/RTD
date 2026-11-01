// ═══ Clients ═══════════════════════════════════════════════════════════════
// Une fiche par client (adresse, incoterm, contact, logo) et, au clic, la liste des produits qu'on lui vend.
// Les produits viennent du catalogue ; les fiches sont enregistrées sur le serveur (clients.json).
// Lecture pour tous ; modification réservée aux administrateurs (contrôlé par le serveur).
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const INCOTERMS = [['EXW', 'À l\'usine'], ['FCA', 'Franco transporteur'], ['FAS', 'Le long du navire'], ['FOB', 'Franco à bord'], ['CFR', 'Coût et fret'], ['CIF', 'Coût, assurance, fret'], ['CPT', 'Port payé jusqu\'à'], ['CIP', 'Port payé, assurance incluse'], ['DAP', 'Rendu au lieu de destination'], ['DPU', 'Rendu déchargé'], ['DDP', 'Rendu droits acquittés']];
  let FICHES = {}, loaded = false, selected = null;
  const isAdmin = () => window.PP_USER && window.PP_USER.role === 'admin';
  const palette = n => (typeof PDP_CLIENT_COLORS !== 'undefined' && PDP_CLIENT_COLORS[n]) || null;
  const initials = n => String(n).split(/[\s_-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  // Un client existe dès qu'il figure dans le catalogue ou qu'une fiche a été créée pour lui.
  function clients() {
    const map = {};
    (typeof catalogue !== 'undefined' ? catalogue : []).forEach(c => {
      const n = String(c.client || '').trim(); if (!n) return;
      (map[n] = map[n] || { name: n, produits: [] }).produits.push(c);
    });
    Object.keys(FICHES).forEach(n => { map[n] = map[n] || { name: n, produits: [] }; });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }
  function logo(name, size) {
    const f = FICHES[name] || {}, p = palette(name), s = size || 56;
    if (f.logo) return '<img class="cli-logo" src="' + esc(f.logo) + '" alt="" style="width:' + s + 'px;height:' + s + 'px">';
    return '<span class="cli-logo cli-ini" style="width:' + s + 'px;height:' + s + 'px;background:' + (p ? p.bg : '#E7ECEB') + ';color:' + (p ? p.text : '#2c5a56') + ';font-size:' + Math.round(s * 0.36) + 'px">' + esc(initials(name)) + '</span>';
  }
  const incLabel = c => { const x = INCOTERMS.filter(i => i[0] === c)[0]; return x ? x[1] : ''; };

  function load() {
    return fetch('/api/clients').then(r => r.json()).then(j => { FICHES = j.clients || {}; loaded = true; }).catch(() => { loaded = true; });
  }
  window.renderClients = function () {
    const el = document.getElementById('view-clients'); if (!el) return;
    if (!loaded) { el.innerHTML = '<div class="cli-wrap"><p>Chargement…</p></div>'; return load().then(window.renderClients); }
    return selected ? detail(el) : liste(el);
  };

  function liste(el) {
    const L = clients();
    el.innerHTML = '<div class="cli-hero"><span class="cli-hico"><i class="ti ti-building-store"></i></span><h2>Clients</h2><div class="cli-hstat"><b>' + L.length + '</b>clients</div><div class="cli-hstat"><b>' + L.reduce((a, c) => a + c.produits.length, 0) + '</b>références</div></div>'
      + '<div class="cli-wrap"><div class="cli-grid">' + L.map(c => {
        const f = FICHES[c.name] || {}, ville = (f.adresse || '').split('\n').pop();
        return '<button class="cli-card" data-c="' + esc(c.name) + '">' + logo(c.name, 56)
          + '<div class="cli-cb"><b>' + esc(c.name) + '</b><span>' + (ville ? esc(ville) : (isAdmin() ? '<i>À compléter</i>' : '&nbsp;')) + '</span></div>'
          + '<div class="cli-meta">' + (f.incoterm ? '<span class="cli-inc">' + esc(f.incoterm) + '</span>' : '') + '<span class="cli-n">' + c.produits.length + ' réf.</span></div></button>';
      }).join('') + '</div></div>';
    el.querySelectorAll('.cli-card').forEach(b => b.onclick = () => { selected = b.dataset.c; window.renderClients(); });
  }

  function detail(el) {
    const c = clients().filter(x => x.name === selected)[0] || { name: selected, produits: [] }, f = FICHES[c.name] || {};
    const row = (k, v) => v ? '<div class="cli-row"><span>' + k + '</span><b>' + esc(v).replace(/\n/g, '<br>') + '</b></div>' : '';
    el.innerHTML = '<div class="cli-hero"><button class="cli-back" id="cli-back" aria-label="Retour"><i class="ti ti-arrow-left"></i></button>' + logo(c.name, 64) + '<h2>' + esc(c.name) + '</h2>'
      + (isAdmin() ? '<button class="cli-edit" id="cli-edit"><i class="ti ti-pencil"></i> Modifier</button>' : '') + '</div>'
      + '<div class="cli-wrap"><div class="cli-two"><div class="cli-box"><h3>Fiche client</h3>'
      + row('Adresse', f.adresse) + row('Pays', f.pays) + row('Incoterm', f.incoterm ? f.incoterm + (f.lieu_incoterm ? ' ' + f.lieu_incoterm : '') + ' — ' + incLabel(f.incoterm) : '') + row('Contact', f.contact) + row('Notes', f.note)
      + (!f.adresse && !f.incoterm && !f.contact ? '<p class="cli-empty">Fiche vide' + (isAdmin() ? ' : cliquez sur « Modifier ».' : '.') + '</p>' : '') + '</div>'
      + '<div class="cli-box"><h3>Produits vendus (' + c.produits.length + ')</h3>' + (c.produits.length
        ? '<table class="cli-tab"><thead><tr><th>Référence</th><th>Matière</th><th>Machine</th><th class="r">Cycle (s)</th></tr></thead><tbody>' + c.produits.map(p => '<tr><td><b>' + esc(p.ref) + '</b></td><td>' + esc(p.matiere) + '</td><td>' + esc(p.machine) + '</td><td class="r">' + (p.tc != null ? esc(p.tc) : '—') + '</td></tr>').join('') + '</tbody></table>'
        : '<p class="cli-empty">Aucun produit au catalogue pour ce client.</p>') + '</div></div></div>';
    el.querySelector('#cli-back').onclick = () => { selected = null; window.renderClients(); };
    const ed = el.querySelector('#cli-edit'); if (ed) ed.onclick = () => editor(c.name);
  }

  // ───── éditeur (administrateurs) ─────
  function editor(name) {
    const f = Object.assign({ adresse: '', pays: '', incoterm: '', lieu_incoterm: '', contact: '', note: '', logo: '' }, FICHES[name] || {});
    const ov = document.createElement('div'); ov.className = 'pp-ov'; document.body.appendChild(ov);
    ov.innerHTML = '<div class="pp-mod" role="dialog" aria-label="Fiche ' + esc(name) + '"><h2>' + esc(name) + '</h2>'
      + '<div class="tb-f">'
      + '<div class="pp-row" style="margin:0"><span id="cli-prev">' + logo2(f.logo, name) + '</span><input type="file" id="cli-file" accept="image/png,image/jpeg,image/webp"><button class="pp-b d" id="cli-nologo">Retirer le logo</button></div>'
      + '<textarea id="cli-adr" placeholder="Adresse (une ligne par élément, ville en dernier)" maxlength="400">' + esc(f.adresse) + '</textarea>'
      + '<div class="pp-row" style="margin:0"><input id="cli-pays" placeholder="Pays" maxlength="60" value="' + esc(f.pays) + '" style="flex:1">'
      + '<select id="cli-inc"><option value="">Incoterm…</option>' + INCOTERMS.map(i => '<option value="' + i[0] + '"' + (f.incoterm === i[0] ? ' selected' : '') + '>' + i[0] + ' — ' + i[1] + '</option>').join('') + '</select>'
      + '<input id="cli-lieu" placeholder="Lieu (ex. Grenoble)" maxlength="80" value="' + esc(f.lieu_incoterm) + '" style="flex:1"></div>'
      + '<input id="cli-ct" placeholder="Contact (nom, téléphone, e-mail)" maxlength="120" value="' + esc(f.contact) + '">'
      + '<textarea id="cli-note" placeholder="Notes" maxlength="600" style="min-height:60px">' + esc(f.note) + '</textarea></div>'
      + '<div class="pp-row" style="justify-content:flex-end"><button class="pp-b" id="cli-x">Annuler</button><button class="pp-b p" id="cli-ok">Enregistrer</button></div><div class="pp-msg e" id="cli-m"></div></div>';
    const $ = s => ov.querySelector(s), msg = t => { $('#cli-m').textContent = t; };
    ov.addEventListener('mousedown', e => { if (e.target === ov) ov.remove(); });
    $('#cli-x').onclick = () => ov.remove();
    $('#cli-nologo').onclick = () => { f.logo = ''; $('#cli-prev').innerHTML = logo2('', name); };
    // le logo est réduit à 256 px dans le navigateur avant envoi
    $('#cli-file').onchange = e => {
      const file = e.target.files[0]; if (!file) return;
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return msg('Formats acceptés : PNG, JPEG ou WebP.');
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, 256 / Math.max(img.width, img.height)), cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(img.width * k)); cv.height = Math.max(1, Math.round(img.height * k));
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
        f.logo = cv.toDataURL('image/png'); $('#cli-prev').innerHTML = logo2(f.logo, name); msg('');
      };
      img.onerror = () => msg('Image illisible.'); img.src = url;
    };
    $('#cli-ok').onclick = () => {
      const fiche = { adresse: $('#cli-adr').value, pays: $('#cli-pays').value, incoterm: $('#cli-inc').value, lieu_incoterm: $('#cli-lieu').value, contact: $('#cli-ct').value, note: $('#cli-note').value, logo: f.logo };
      fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set', name: name, fiche: fiche }) })
        .then(r => r.json().then(j => ({ ok: r.ok && j.ok !== false, j: j })))
        .then(x => { if (!x.ok) return msg((x.j && x.j.error) || 'Enregistrement refusé.'); FICHES = x.j.clients; ov.remove(); window.renderClients(); })
        .catch(() => msg('Serveur injoignable.'));
    };
  }
  function logo2(data, name) { const t = FICHES[name]; FICHES[name] = Object.assign({}, t || {}, { logo: data }); const h = logo(name, 56); if (t) FICHES[name] = t; else delete FICHES[name]; return h; }
})();
