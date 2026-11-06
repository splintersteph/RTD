// Mode démonstration : données fictives, dates recalées sur aujourd'hui, rien n'est enregistré.
(function () {
  window.DEMO = true;
  const BASE = Date.UTC(2026, 7, 21); // date de l'import de référence (21/08/2026)
  const now = new Date(), tod = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const shift = Math.round((tod - BASE) / 864e5) - 1; // l'import date de « hier »
  const pad = n => String(n).padStart(2, '0');
  const addIso = (y, m, d) => { const t = new Date(Date.UTC(y, m - 1, d) + shift * 864e5); return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()); };
  function walk(v) {
    if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = walk(v[i]); return v; }
    if (v && typeof v === 'object') { for (const k in v) v[k] = walk(v[k]); return v; }
    if (typeof v === 'string') {
      let m = v.match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/);
      if (m && +m[1] >= 2019 && +m[1] <= 2030) return addIso(+m[1], +m[2], +m[3]) + m[4];
      m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})( .*)?$/);
      if (m && +m[3] >= 2019 && +m[3] <= 2030) { const s = addIso(+m[3], +m[2], +m[1]).split('-'); return s[2] + '/' + s[1] + '/' + s[0] + (m[4] || ''); }
    }
    return v;
  }

  // ── Comptes fictifs : on simule les réponses du serveur (rien n'est réellement enregistré) ──
  const role = (function(){ try { return sessionStorage.getItem('demoRole') === 'lecteur' ? 'lecteur' : 'admin'; } catch (e) { return 'admin'; } })();
  const ME = role === 'admin' ? 'Marie Dupont' : 'Sophie Bernard';
  let demandes = [{ id: 'd1a2b3c4', type: 'create', name: 'Lucie Moreau', role: 'lecteur', demandeur: 'Julien Martin', date: '2026-11-05T16:40:00' }, { id: 'e5f6a7b8', type: 'role', name: 'Thomas Leroy', role: 'admin', demandeur: 'Julien Martin', date: '2026-11-05T16:42:00' }];
  const iso = (minAgo) => { const t = new Date(Date.now() - minAgo * 60000); return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()) + 'T' + pad(t.getHours()) + ':' + pad(t.getMinutes()) + ':' + pad(t.getSeconds()); };
  const users = [
    { name: 'Marie Dupont', role: 'key', disabled: false, created: '2026-09-01T09:00:00' },
    { name: 'Julien Martin', role: 'admin', disabled: false, created: '2026-09-01T09:05:00' },
    { name: 'Sophie Bernard', role: 'lecteur', disabled: false, created: '2026-09-15T14:20:00' },
    { name: 'Thomas Leroy', role: 'lecteur', disabled: false, created: '2026-09-15T14:22:00' },
    { name: 'Atelier Usinage', role: 'lecteur', disabled: false, created: '2026-10-02T08:10:00' },
    { name: 'Camille Roux', role: 'lecteur', disabled: true, created: '2026-09-20T11:00:00' }
  ];
  const events = [
    ['login_ok', 'Marie Dupont', '192.168.1.115', 2, { role: 'admin' }], ['sauvegarde', 'Marie Dupont', '192.168.1.115', 9, { ofs: 29, archives: 271, avant: 300 }],
    ['login_ok', 'Sophie Bernard', '192.168.1.42', 25, { role: 'lecteur' }], ['ecriture_refusee', 'Sophie Bernard', '192.168.1.42', 31, { role: 'lecteur' }],
    ['login_echec', 'camille', '192.168.1.77', 80, {}], ['login_echec', 'camille', '192.168.1.77', 81, {}], ['login_ok', 'Thomas Leroy', '192.168.1.58', 95, { role: 'lecteur' }],
    ['compte_create', 'Marie Dupont', '192.168.1.115', 600, { cible: 'Atelier Usinage', role: 'lecteur' }], ['sauvegarde', 'Julien Martin', '192.168.1.103', 640, { ofs: 28, archives: 271, avant: 299 }],
    ['sauvegarde_refusee', 'Julien Martin', '192.168.1.103', 700, { raison: 'garde-fou anti-perte' }], ['mdp_change', 'Julien Martin', '192.168.1.103', 1500, {}], ['demarrage', '-', '-', 1560, { port: 8765, tls: false }]
  ].map(e => Object.assign({ ts: iso(e[3]), evt: e[0], user: e[1], ip: e[2] }, e[4]));
  const J = (o, s) => Promise.resolve(new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json' } }));
  let consoCfg = [{ produit: '7100318946', type: 'Boîte', ref: 'BOX-001', designation: 'Boîte carton 10 pièces', qte: 0.1, fournisseur: 'Cartonnages Alpes', commentaire: '', prix_prod: 0.12, prix_vente: 0.2 }, { produit: '7100318946', type: 'Notice', ref: 'NOT-014', designation: 'Notice d\'utilisation FR/EN', qte: 1, fournisseur: '', commentaire: '', prix_prod: 0.03, prix_vente: 0.05 }, { produit: '7100318946', type: 'Étiquette', ref: 'ETQ-220', designation: 'Étiquette lot', qte: 1, fournisseur: '', commentaire: '', prix_prod: 0.01, prix_vente: 0.02 }];
  let tabsCfg = { hidden: [], custom: [] }; let clientsCfg = {
    BRASSELER: { adresse: '12 rue des Lilas\n69003 Lyon', pays: 'France', contact: 'Service achats', note: '', lieu_incoterm: 'Lyon', incoterm: 'DAP', logo: '' },
    '3M': { adresse: '1 avenue de l\'Industrie\n95000 Cergy', pays: 'France', contact: '', note: '', lieu_incoterm: 'Cergy', incoterm: 'FCA', logo: '' } };
  const rfip = (function () {
    const cycles = [], prods = ['W1', 'W0', 'W2', 'K101', 'AE2'], d = new Date(); let n = 0, seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 21; i >= 1; i--) {
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i); if (day.getDay() === 0 || day.getDay() === 6) continue;
      [[7, 0, 11, 15], [12, 20, 15, 40]].forEach((p, k) => {
        const a = new Date(day.getFullYear(), day.getMonth(), day.getDate(), p[0], p[1] + Math.round(rnd() * 15)), b = new Date(day.getFullYear(), day.getMonth(), day.getDate(), p[2], p[3] + Math.round(rnd() * 20) - 10);
        const h = (b - a) / 36e5, arret = rnd() < 0.35 ? 10 + Math.round(rnd() * 35) : 0, q = Math.round((h - arret / 60) * (2300 + rnd() * 900));
        const f = t => t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()) + 'T' + pad(t.getHours()) + ':' + pad(t.getMinutes());
        cycles.push({ id: 'c' + (++n), debut: f(a), fin: f(b), of: 'OF-' + (74000 + n), produit: prods[(n + k) % prods.length], qte: q, rebut: Math.round(q * rnd() * 0.012), arret_min: arret, motif: arret ? ['changement de joint', 'réglage', 'attente matière'][n % 3] : '', commentaire: '', par: 'Marie Dupont' });
      });
    }
    return { cycles, params: { cadence_nominale: 3200, heures_jour: 7, jours: [1, 2, 3, 4, 5] } };
  })();
  function fakeApi(path, o) {
    const body = o && o.body ? JSON.parse(o.body) : {};
    if (path === '/api/me') return J({ name: ME, role, key: role === 'admin' });
    if (path === '/api/audit') return J({ events });
    if (path === '/api/tabs') {
      if (o && o.method === 'POST') { if (role !== 'admin') return J({ ok: false, error: 'Réservé aux administrateurs.' }, 403); tabsCfg = { hidden: body.hidden || [], custom: body.custom || [] }; return J(Object.assign({ ok: true }, tabsCfg)); }
      return J(tabsCfg);
    }
    if (path === '/api/clients') {
      if (o && o.method === 'POST') { if (role !== 'admin') return J({ ok: false, error: 'Réservé aux administrateurs.' }, 403); if (body.action === 'delete') delete clientsCfg[body.name]; else clientsCfg[body.name] = body.fiche; return J({ ok: true, clients: clientsCfg }); }
      return J({ clients: clientsCfg });
    }
    if (path === '/api/consommables') {
      if (o && o.method === 'POST') { if (role !== 'admin') return J({ ok: false, error: 'Réservé aux administrateurs.' }, 403); consoCfg = body.items || []; return J({ ok: true, items: consoCfg }); }
      return J({ items: role === 'admin' ? consoCfg : consoCfg.map(i => { const c = Object.assign({}, i); delete c.prix_prod; delete c.prix_vente; return c; }) });
    }
    if (path === '/api/logout') return J({ ok: true });
    if (path === '/api/password') return J({ ok: true });
    if (path === '/api/users') {
      const KEY = role === 'admin', view = (x) => J(Object.assign({ ok: true, users, me: ME, key: KEY, demandes: KEY ? demandes : [] }, x || {}));
      if (!o || !o.method || o.method === 'GET') return view();
      if (!KEY) return J({ ok: false, error: 'Réservé au key user (démo : passez en « Administrateur »).' }, 403);
      const u = users.find(x => x.name.toLowerCase() === String(body.name || '').toLowerCase());
      if (body.action === 'approve' || body.action === 'reject' || body.action === 'cancel') {
        const x = demandes.find(q => q.id === body.id); if (!x) return J({ ok: false, error: 'Demande introuvable ou expirée.' }, 404);
        demandes.splice(demandes.indexOf(x), 1);
        if (body.action === 'approve') { if (x.type === 'create') users.push({ name: x.name, role: x.role, disabled: false, created: iso(0) }); else { const t = users.find(z => z.name === x.name); if (t && x.type === 'role') t.role = x.role; else if (t && x.type === 'delete') users.splice(users.indexOf(t), 1); } }
        return view();
      }
      if (body.action === 'create') { if (String(body.password || '').length < 12) return J({ ok: false, error: 'Le mot de passe doit contenir au moins 12 caractères.' }); if (u) return J({ ok: false, error: 'Ce nom existe déjà.' }); users.push({ name: String(body.name).trim(), role: body.role, disabled: false, created: iso(0) }); }
      else if (u && body.action === 'role') u.role = body.role;
      else if (u && body.action === 'disable') u.disabled = !!body.disabled;
      else if (u && body.action === 'delete') users.splice(users.indexOf(u), 1);
      return view();
    }
    if (path === '/api/rfip') {
      if (o && o.method === 'POST') {
        if (role !== 'admin') return J({ ok: false, error: 'Réservé aux administrateurs.' }, 403);
        if (body.action === 'params') rfip.params = body.params;
        else if (body.action === 'add') { const c = Object.assign({}, body.cycle, { id: 'c' + Math.random().toString(36).slice(2, 8), par: ME }); rfip.cycles.push(c); }
        else if (body.action === 'update') { const i = rfip.cycles.findIndex(x => x.id === body.id); if (i >= 0) rfip.cycles[i] = Object.assign({}, body.cycle, { id: body.id, par: ME }); }
        else if (body.action === 'delete') rfip.cycles = rfip.cycles.filter(x => x.id !== body.id);
        return J(Object.assign({ ok: true }, rfip));
      }
      return J(rfip);
    }
    return J({ ok: false, error: 'Démo' }, 404);
  }
  document.addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('button');
    s.style.cssText = 'position:fixed;left:14px;bottom:10px;z-index:9998;border:0;background:#0B7F79;color:#fff;padding:7px 14px;border-radius:99px;font:700 12px Figtree,system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.3)';
    s.textContent = 'Voir en tant que : ' + (role === 'admin' ? 'Lecteur' : 'Administrateur') + ' →';
    s.onclick = () => { try { sessionStorage.setItem('demoRole', role === 'admin' ? 'lecteur' : 'admin'); } catch (e) {} location.reload(); };
    document.body.appendChild(s);
  });
  const f0 = window.fetch.bind(window);
  window.fetch = function (u, o) {
    if (typeof u === 'string' && /^\/api\/(me|users|audit|logout|password|tabs|clients|consommables|rfip)$/.test(u)) return fakeApi(u, o);
    if (typeof u === 'string' && /donnees\.json/.test(u)) return f0(u, Object.assign({}, o, { cache: 'default' })).then(r => r.json()).then(j => new Response(JSON.stringify(walk(j)), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    return f0(u, o);
  };
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.createElement('div');
    b.style.cssText = 'position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:9998;background:#121C26;color:#fff;padding:7px 16px;border-radius:99px;font:600 12px Figtree,system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.3);opacity:.92;pointer-events:none';
    b.textContent = 'Version de démonstration · données fictives · modifications non enregistrées';
    document.body.appendChild(b);
    setInterval(() => { const l = document.getElementById('save-label'); if (l && l.textContent !== 'Démo') l.textContent = 'Démo'; }, 600);
  });
})();
