/* PlanProd — onglets : masquer/afficher les onglets existants et créer des onglets personnels (note ou lien).
   Réservé aux administrateurs (le serveur refuse toute modification venant d'un autre profil).
   La configuration est enregistrée côté serveur (onglets.json) et vaut pour tous les utilisateurs. */
(function () {
'use strict';
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var CFG = { hidden: [], custom: [] };
var ICONS = [['ti-file-text', 'Document'], ['ti-notes', 'Notes'], ['ti-link', 'Lien'], ['ti-world', 'Site'], ['ti-book', 'Livre'], ['ti-checklist', 'Liste'],
  ['ti-star', 'Étoile'], ['ti-flag', 'Drapeau'], ['ti-bulb', 'Idée'], ['ti-calendar', 'Calendrier'], ['ti-users', 'Équipe'], ['ti-tool', 'Outil'], ['ti-chart-bar', 'Graphique'], ['ti-shield-check', 'Qualité']];
var css = document.createElement('style');
css.textContent = [
  '.tb-hero{display:flex;gap:16px;align-items:center;padding:22px 26px;margin:0 0 18px;border-radius:0 0 22px 22px;color:#fff;background:linear-gradient(135deg,#0F2E2C,#0B7F79)}',
  '.tb-hero .ico{width:52px;height:52px;border-radius:15px;background:rgba(255,255,255,.16);display:grid;place-items:center;font-size:28px}.tb-hero h2{margin:0;font-family:Sora,sans-serif;font-size:24px}',
  '.tb-body{padding:6px 26px 30px;max-width:900px}.tb-note{background:var(--surface,#fff);border:1px solid var(--border,#e6e1d6);border-radius:16px;padding:22px 26px;font-size:15px;line-height:1.65}',
  '.tb-note p{margin:0 0 10px}.tb-note ul{margin:0 0 10px 20px;padding:0}.tb-link{display:flex;gap:16px;align-items:center;background:var(--surface,#fff);border:1px solid var(--border,#e6e1d6);border-radius:16px;padding:22px 26px}',
  '.tb-link code{display:block;font-size:12.5px;color:#5d6b69;word-break:break-all;margin-top:4px}.tb-go{margin-left:auto;padding:10px 18px;border-radius:10px;background:#0B7F79;color:#fff;text-decoration:none;font-weight:700;white-space:nowrap}',
  '.tb-sw{display:flex;align-items:center;gap:10px;padding:7px 4px;border-bottom:1px solid #f0ede4;font-size:13.5px}.tb-sw input{width:auto}.tb-sw span{flex:1}',
  '.tb-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 24px}@media(max-width:700px){.tb-grid{grid-template-columns:1fr}}',
  '.tb-f{display:grid;gap:8px;margin-top:8px}.tb-f textarea{padding:8px 10px;border:1px solid #d5d0c4;border-radius:8px;font:inherit;font-size:13px;min-height:90px;resize:vertical}',
  '.tb-mini{font-size:12px;color:#5d6b69}'
].join('\n');
document.head.appendChild(css);

function isAdmin() { return window.PP_USER && window.PP_USER.role === 'admin'; }

function applyCfg() {
  // onglets existants masqués
  document.querySelectorAll('.sidebar-item[id^="nav-"]').forEach(function (b) { var k = b.id.slice(4); if (b.dataset.tbCustom) return; b.style.display = CFG.hidden.indexOf(k) >= 0 ? 'none' : ''; });
  // onglets personnels : bouton + conteneur de page
  document.querySelectorAll('[data-tb-custom]').forEach(function (n) { n.remove(); });
  var anchor = document.querySelector('.sidebar-item[onclick^="openCalculateur"]');
  var host = document.querySelector('.layout .flex-view') ? document.querySelector('.layout .flex-view').parentNode : null;
  CFG.custom.forEach(function (c) {
    if (typeof VALID_VIEWS !== 'undefined' && VALID_VIEWS.indexOf(c.id) < 0) VALID_VIEWS.push(c.id);
    var b = document.createElement('button'); b.className = 'sidebar-item'; b.id = 'nav-' + c.id; b.dataset.tbCustom = '1';
    b.innerHTML = '<i class="ti ' + esc(c.icon) + '"></i>' + esc(c.title); b.onclick = function () { setView(c.id); };
    if (anchor) anchor.parentNode.insertBefore(b, anchor);
    if (host) { var v = document.createElement('div'); v.className = 'flex-view'; v.id = 'view-' + c.id; v.dataset.tbCustom = '1'; v.style.cssText = 'padding:0;display:none;flex-direction:column;overflow:auto'; host.appendChild(v); }
  });
  var ad = document.getElementById('tb-manage');
  if (isAdmin() && !ad && anchor) {
    ad = document.createElement('button'); ad.className = 'sidebar-item'; ad.id = 'tb-manage'; ad.setAttribute('data-pp-write', '1');
    ad.innerHTML = '<i class="ti ti-layout-sidebar"></i>Gérer les onglets'; ad.onclick = openManager; anchor.parentNode.insertBefore(ad, anchor.nextSibling);
  }
  // si l'onglet affiché vient d'être masqué, on en prend un autre
  var cur = (typeof currentView !== 'undefined') ? currentView : null;
  if (cur && CFG.hidden.indexOf(cur) >= 0) { var f = document.querySelector('.sidebar-item[id^="nav-"]:not([data-tb-custom])'); var all = Array.prototype.slice.call(document.querySelectorAll('.sidebar-item[id^="nav-"]')).filter(function (x) { return x.style.display !== 'none' && x.id.indexOf('nav-all') !== 0 && ['nav-bloque', 'nav-haute', 'nav-basse'].indexOf(x.id) < 0; }); if (all[0]) setView(all[0].id.slice(4)); }
}

function paragraphs(t) {
  var out = '', list = [];
  var flush = function () { if (list.length) { out += '<ul>' + list.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; list = []; } };
  String(t).split(/\r?\n/).forEach(function (l) { if (/^\s*[-•]\s+/.test(l)) list.push(l.replace(/^\s*[-•]\s+/, '')); else { flush(); if (l.trim()) out += '<p>' + esc(l) + '</p>'; } });
  flush(); return out || '<p class="tb-mini">(page vide)</p>';
}

function showCustom(id) {
  var c = CFG.custom.filter(function (x) { return x.id === id; })[0]; if (!c) return;
  var el = document.getElementById('view-' + id); if (!el) return;
  el.style.display = 'flex';
  var body = c.type === 'lien'
    ? '<div class="tb-link"><i class="ti ti-external-link" style="font-size:30px;color:#0B7F79"></i><div><b>Ouvrir ce lien dans un nouvel onglet</b><code>' + esc(c.content) + '</code></div><a class="tb-go" target="_blank" rel="noopener noreferrer" href="' + esc(c.content) + '">Ouvrir</a></div>'
    : '<div class="tb-note">' + paragraphs(c.content) + '</div>';
  el.innerHTML = '<div class="tb-hero"><span class="ico"><i class="ti ' + esc(c.icon) + '"></i></span><h2>' + esc(c.title) + '</h2></div><div class="tb-body">' + body + '</div>';
  document.querySelectorAll('.sidebar-item').forEach(function (b) { b.classList.remove('active'); });
  var nb = document.getElementById('nav-' + id); if (nb) nb.classList.add('active');
  document.title = 'PlanProd — ' + c.title;
}

// setView : on enveloppe la fonction existante pour gérer les onglets personnels
var _sv = window.setView;
window.setView = function (v, push) {
  var custom = CFG.custom.some(function (c) { return c.id === v; });
  if (!custom && CFG.hidden.indexOf(v) >= 0 && !isAdmin()) v = 'cockpit';
  _sv(v, push);
  if (custom) showCustom(v);
  else document.querySelectorAll('[data-tb-custom].flex-view').forEach(function (e) { e.style.display = 'none'; });
};

function load() {
  fetch('/api/tabs').then(function (r) { return r.json(); }).then(function (j) { CFG = { hidden: j.hidden || [], custom: j.custom || [] }; applyCfg(); var h = location.hash.replace('#', ''); if (h && CFG.custom.some(function (c) { return c.id === h; })) setView(h, false); }).catch(function () { });
}

/* ───── fenêtre de gestion (administrateurs) ───── */
function openManager() {
  if (!isAdmin()) return;
  var draft = JSON.parse(JSON.stringify(CFG));
  var ov = document.createElement('div'); ov.className = 'pp-ov';
  ov.innerHTML = '<div class="pp-mod" role="dialog" aria-label="Gérer les onglets"></div>'; document.body.appendChild(ov);
  var mod = ov.firstChild; ov.addEventListener('mousedown', function (e) { if (e.target === ov) ov.remove(); });
  var builtins = Array.prototype.slice.call(document.querySelectorAll('.sidebar-item[id^="nav-"]')).filter(function (b) { return !b.dataset.tbCustom && ['nav-all', 'nav-bloque', 'nav-haute', 'nav-basse'].indexOf(b.id) < 0; })
    .map(function (b) { return { id: b.id.slice(4), label: b.textContent.replace(/\d+$/, '').trim() }; });
  function draw(msg, err) {
    mod.innerHTML = '<h2>Gérer les onglets</h2><p class="s">Ces réglages valent pour tous les utilisateurs. Masquer un onglet ne supprime aucune donnée : vous pouvez le réafficher à tout moment.</p>'
      + '<h3 style="font-size:14px;margin:6px 0">Onglets de l\'application</h3><div class="tb-grid">' + builtins.map(function (b) {
        return '<label class="tb-sw"><input type="checkbox" data-h="' + esc(b.id) + '"' + (draft.hidden.indexOf(b.id) < 0 ? ' checked' : '') + '><span>' + esc(b.label) + '</span></label>';
      }).join('') + '</div>'
      + '<h3 style="font-size:14px;margin:18px 0 6px">Vos onglets</h3>'
      + (draft.custom.length ? '<table><tbody>' + draft.custom.map(function (c, i) { return '<tr><td><i class="ti ' + esc(c.icon) + '"></i> <b>' + esc(c.title) + '</b> <span class="tb-mini">(' + (c.type === 'lien' ? 'lien' : 'note') + ')</span></td><td style="text-align:right"><button class="pp-b" data-e="' + i + '">Modifier</button><button class="pp-b d" data-d="' + i + '">Supprimer</button></td></tr>'; }).join('') + '</tbody></table>' : '<p class="tb-mini">Aucun onglet personnel pour l\'instant.</p>')
      + '<div class="tb-f" id="tb-form"><b style="font-size:13.5px" id="tb-ft">Ajouter un onglet</b>'
      + '<div class="pp-row" style="margin:0"><input id="tb-n" placeholder="Nom de l\'onglet" maxlength="40" style="flex:1;min-width:160px"><select id="tb-i">' + ICONS.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join('') + '</select><select id="tb-t"><option value="note">Page de notes</option><option value="lien">Lien vers un site / document</option></select></div>'
      + '<textarea id="tb-c" placeholder="Votre texte (une ligne commençant par « - » devient une puce)"></textarea><div><button class="pp-b" id="tb-add">Ajouter l\'onglet</button></div></div>'
      + '<div class="pp-row" style="justify-content:flex-end"><button class="pp-b" id="tb-x">Annuler</button><button class="pp-b p" id="tb-ok">Enregistrer</button></div><div class="pp-msg ' + (err ? 'e' : 'o') + '" id="tb-m">' + esc(msg || '') + '</div>';
    var edit = -1;
    var t = mod.querySelector('#tb-t'), c = mod.querySelector('#tb-c');
    t.onchange = function () { c.placeholder = t.value === 'lien' ? 'https://… (adresse du site ou du document)' : 'Votre texte (une ligne commençant par « - » devient une puce)'; c.style.minHeight = t.value === 'lien' ? '40px' : '90px'; };
    mod.querySelectorAll('[data-h]').forEach(function (cb) { cb.onchange = function () { var k = cb.dataset.h, ix = draft.hidden.indexOf(k); if (cb.checked && ix >= 0) draft.hidden.splice(ix, 1); if (!cb.checked && ix < 0) draft.hidden.push(k); }; });
    mod.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { draft.custom.splice(+b.dataset.d, 1); draw(); }; });
    mod.querySelectorAll('[data-e]').forEach(function (b) { b.onclick = function () { var x = draft.custom[+b.dataset.e]; edit = +b.dataset.e; mod.querySelector('#tb-n').value = x.title; mod.querySelector('#tb-i').value = x.icon; t.value = x.type; c.value = x.content; mod.querySelector('#tb-ft').textContent = 'Modifier « ' + x.title + ' »'; mod.querySelector('#tb-add').textContent = 'Valider la modification'; t.onchange(); mod.querySelector('#tb-n').focus(); }; });
    mod.querySelector('#tb-add').onclick = function () {
      var n = mod.querySelector('#tb-n').value.trim(), v = c.value, ty = t.value;
      if (!n) return draw2('Donnez un nom à l\'onglet.', true);
      if (ty === 'lien' && !/^https?:\/\/\S+$/.test(v.trim())) return draw2('Le lien doit commencer par http:// ou https://', true);
      var obj = { id: edit >= 0 ? draft.custom[edit].id : 'c' + Math.random().toString(36).slice(2, 8), title: n, icon: mod.querySelector('#tb-i').value, type: ty, content: v };
      if (edit >= 0) draft.custom[edit] = obj; else draft.custom.push(obj);
      draw('Onglet prêt — cliquez sur « Enregistrer » pour l\'appliquer.');
    };
    function draw2(m, e) { var el = mod.querySelector('#tb-m'); el.className = 'pp-msg ' + (e ? 'e' : 'o'); el.textContent = m; }
    mod.querySelector('#tb-x').onclick = function () { ov.remove(); };
    mod.querySelector('#tb-ok').onclick = function () {
      fetch('/api/tabs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok !== false, j: j }; }); })
        .then(function (x) { if (!x.ok) return draw2((x.j && x.j.error) || 'Enregistrement refusé.', true); CFG = { hidden: x.j.hidden, custom: x.j.custom }; applyCfg(); ov.remove(); })
        .catch(function () { draw2('Serveur injoignable.', true); });
    };
  }
  draw();
}

window.addEventListener('DOMContentLoaded', function () {
  var n = 0, iv = setInterval(function () { n++; if (window.PP_USER || n > 40) { clearInterval(iv); load(); } }, 150);
});
})();
