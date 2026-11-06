// ═══ Familles de la barre latérale ═══════════════════════════════════════════
// Les vues sont rangées selon la logique du modèle SCOR (référence ASCM/APICS) : Planifier, Fabriquer, Livrer, + pilotage et performance.
// Au survol (ou au clic / clavier) d'une famille, un petit menu affiche ses vues. Les boutons d'origine sont conservés (mêmes identifiants).
(function () {
  'use strict';
  var GROUPS = [
    { id: 'pilotage', label: 'Pilotage', icon: 'ti-gauge', views: ['jour', 'synthese', 'cockpit', 'revue'] },
    { id: 'planifier', label: 'Planifier', icon: 'ti-calendar-time', views: ['pdp', 'besoins', 'conso', 'abc', 'etsi'] },
    { id: 'fabriquer', label: 'Fabriquer', icon: 'ti-building-factory-2', views: ['kanban', 'list', 'gantt', 'forets', 'pultrusion', 'rfip', 'planning', 'archives'] },
    { id: 'livrer', label: 'Livrer', icon: 'ti-truck-delivery', views: ['commandes', 'clients'] },
    { id: 'performance', label: 'Performance', icon: 'ti-chart-line', views: ['stats', '3m', 'fiab', 'arrets', 'heat', 'vsm'] }
  ];
  var open = null, timer = null;
  function closeAll() { clearTimeout(timer); if (open) { open.fly.classList.remove('on'); open.btn.setAttribute('aria-expanded', 'false'); open = null; } }
  function init() {
    var sb = document.getElementById('sidebar'); if (!sb || document.getElementById('grp-pilotage')) return;
    var css = document.createElement('style');
    css.textContent = '.grp-fly{position:fixed;z-index:9000;min-width:220px;padding:6px;border-radius:12px;background:var(--ink2,#14212b);border:1px solid var(--ink-line,rgba(255,255,255,.12));box-shadow:0 18px 40px -10px rgba(0,0,0,.55);display:none;flex-direction:column;gap:2px}'
      + '.grp-fly.on{display:flex}.grp-fly .sidebar-item{width:100%}.sidebar-item .grp-chev{margin-left:auto;font-size:14px;opacity:.6}';
    document.head.appendChild(css);
    var mark = document.createComment('familles'); var first = document.getElementById('nav-jour') || sb.querySelector('.sidebar-item'); first.parentNode.insertBefore(mark, first);
    GROUPS.forEach(function (g) {
      var kids = g.views.map(function (k) { return document.getElementById('nav-' + k); }).filter(Boolean);
      if (!kids.length) return;
      var btn = document.createElement('button'); btn.className = 'sidebar-item'; btn.id = 'grp-' + g.id; btn.type = 'button';
      btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<i class="ti ' + g.icon + '"></i>' + g.label + '<i class="ti ti-chevron-right grp-chev"></i>';
      var fly = document.createElement('div'); fly.className = 'grp-fly'; fly.setAttribute('role', 'menu'); document.body.appendChild(fly);
      mark.parentNode.insertBefore(btn, mark);
      kids.forEach(function (k) { fly.appendChild(k); });
      var me = { btn: btn, fly: fly };
      function show() { closeAll(); var r = btn.getBoundingClientRect(); fly.style.left = (r.right + 6) + 'px'; fly.classList.add('on'); fly.style.top = Math.max(8, Math.min(r.top, innerHeight - fly.offsetHeight - 8)) + 'px'; btn.setAttribute('aria-expanded', 'true'); open = me; }
      function later() { clearTimeout(timer); timer = setTimeout(closeAll, 220); }
      btn.addEventListener('mouseenter', show); btn.addEventListener('mouseleave', later);
      fly.addEventListener('mouseenter', function () { clearTimeout(timer); }); fly.addEventListener('mouseleave', later);
      btn.addEventListener('click', function (e) { e.stopPropagation(); open === me ? closeAll() : show(); });
      fly.addEventListener('click', function () { setTimeout(closeAll, 0); });
      function sync() {
        btn.classList.toggle('active', kids.some(function (k) { return k.classList.contains('active'); }));
        btn.style.display = kids.every(function (k) { return k.style.display === 'none'; }) ? 'none' : '';
      }
      var mo = new MutationObserver(sync); kids.forEach(function (k) { mo.observe(k, { attributes: true, attributeFilter: ['class', 'style'] }); });
      sync();
    });
    document.addEventListener('click', function (e) { if (open && !open.fly.contains(e.target)) closeAll(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
    sb.addEventListener('scroll', closeAll);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
