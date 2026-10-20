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
  const f0 = window.fetch.bind(window);
  window.fetch = function (u, o) {
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
