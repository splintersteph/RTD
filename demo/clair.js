// ═══ En clair — la supply chain expliquée à tout le monde ═══════════════════
// 1. Page « En clair » : l'atelier en 60 secondes, en phrases simples + feux tricolores
// 2. Bandeau « À retenir » sous le titre de chaque page
// 3. Aide « Comment lire cette page » + glossaire
// 4. Mode TV : défilement automatique des pages pour un écran d'atelier
// Lecture seule : aucune donnée n'est modifiée ni sauvegardée.
(function () {
  const DAY = 86400000;
  const fmt = n => Math.round(n).toLocaleString('fr');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const plur = (n, a, b) => n > 1 ? b : a;
  const hasData = () => typeof pcData !== 'undefined' && (pcData.commandes || []).length && typeof window.cockpitCollect === 'function';

  // ───────────────────────── Données communes ─────────────────────────
  function facts() {
    const f = { ok: false };
    try {
      f.sc = (typeof window.statsCompute === 'function' && typeof ofs !== 'undefined') ? window.statsCompute() : null;
      if (!hasData()) return f;
      const d = window.cockpitCollect(); f.d = d; f.ok = true;
      f.avec = d.refs.filter(r => r.totalCde > 0);
      f.rup = d.refs.filter(r => r.rup);
      f.rup14 = f.rup.filter(r => r.joursRup <= 14);
      f.rup42 = f.rup.filter(r => r.joursRup <= 42);
      f.manque = f.rup.reduce((s, r) => s + r.rup.manque, 0);
      f.echues = d.lignes.filter(l => new Date(l.d + 'T12:00:00') < d.t0);
      f.echuesQ = f.echues.reduce((s, l) => s + l.q, 0);
      f.open = d.lignes.reduce((s, l) => s + l.q, 0);
      f.next30 = d.lignes.filter(l => { const x = (new Date(l.d + 'T12:00:00') - d.t0) / DAY; return x >= 0 && x <= 30; }).reduce((s, l) => s + l.q, 0);
      f.score = window.cockpitScore ? window.cockpitScore(d) : null;
    } catch (e) { console.error('[En clair] facts', e); }
    return f;
  }
  const tone = (v, okMin, warnMin) => v >= okMin ? 'ok' : v >= warnMin ? 'warn' : 'crit';

  // ───────────────────────── « À retenir » par page ─────────────────────────
  function reading(view) {
    const f = facts(), R = [];
    const add = (t, i, h, p) => R.push({ t, i, h, p });
    try {
      if (view === 'pdp' && f.ok) {
        const pc = f.avec.length ? Math.round((f.avec.length - f.rup.length) / f.avec.length * 100) : 100;
        add(tone(pc, 90, 70), 'ti-shield-check', `${pc} % des références sont couvertes`, `Une référence est « couverte » quand le stock suffit pour toutes ses commandes ouvertes. ${f.rup.length ? f.rup.length + ' ' + plur(f.rup.length, 'référence va', 'références vont') + ' manquer.' : 'Aucune rupture à prévoir.'}`);
        const by = {}; f.rup.forEach(r => { by[r.client || 'Autre'] = (by[r.client || 'Autre'] || 0) + 1; });
        const top = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
        if (top) add('warn', 'ti-users', `${top[0]} : le client le plus exposé`, `${top[1]} ${plur(top[1], 'référence', 'références')} concernée${top[1] > 1 ? 's' : ''} par une rupture. Ouvrez sa tuile pour voir laquelle.`);
        add('info', 'ti-package', `${fmt(f.open)} pièces à livrer`, `Dont ${fmt(f.next30)} dans les 30 prochains jours.`);
      } else if (view === 'besoins' && f.ok) {
        const first = f.rup.slice().sort((a, b) => a.joursRup - b.joursRup)[0];
        if (first) add(first.joursRup <= 14 ? 'crit' : 'warn', 'ti-alarm', `Le plus urgent : ${first.nom}`, first.joursRup < 0 ? `La rupture est déjà là depuis ${-first.joursRup} jours. Il manque ${fmt(first.rup.manque)} pièces.` : `Rupture dans ${first.joursRup} jours. Il manquera ${fmt(first.rup.manque)} pièces.`);
        add(f.rup14.length ? 'crit' : 'ok', 'ti-clock-exclamation', `${f.rup14.length} ${plur(f.rup14.length, 'référence', 'références')} sous 2 semaines`, 'C\'est la zone où il n\'est quasiment plus possible de fabriquer à temps : il faut agir tout de suite (accélérer, livrer en partie, prévenir le client).');
        add('info', 'ti-math-function', `${fmt(f.manque)} pièces manquantes au total`, 'Somme de ce qui manquera pour honorer toutes les commandes ouvertes, tous clients confondus.');
      } else if (view === 'conso' && f.ok && typeof consoGetCouvertureMois === 'function') {
        const m = f.d.refs.map(r => ({ r, m: consoGetCouvertureMois(r.code, r.stock) })).filter(x => x.m != null);
        const m1 = m.filter(x => x.m < 1);
        add(m1.length ? 'crit' : 'ok', 'ti-hourglass-low', `${m1.length} ${plur(m1.length, 'référence', 'références')} à moins d'un mois de ventes`, 'La couverture, c\'est le nombre de mois de ventes que le stock actuel permet de tenir. Sous 1 mois, le moindre aléa crée une rupture.');
        const big = m.filter(x => x.m > 12);
        if (big.length) add('info', 'ti-box-multiple', `${big.length} ${plur(big.length, 'référence', 'références')} à plus d'un an de stock`, 'Trop de stock immobilise de la trésorerie et peut devenir obsolète : à surveiller aussi.');
      } else if (view === 'commandes' && f.ok) {
        add(f.echues.length ? 'warn' : 'ok', 'ti-calendar-x', `${f.echues.length} lignes dont la date de livraison est dépassée`, f.echues.length ? `Cela représente ${fmt(f.echuesQ)} pièces. Si elles sont en réalité déjà livrées, il faut mettre l'export ERP à jour.` : 'Aucune commande en retard.');
        const byC = {}; f.d.lignes.forEach(l => { const r = f.d.refs.find(x => x.code === l.ref); const c = (r && r.client) || 'Autre'; byC[c] = (byC[c] || 0) + l.q; });
        const top = Object.entries(byC).sort((a, b) => b[1] - a[1])[0];
        if (top) add('info', 'ti-user-star', `${top[0]} : ${Math.round(top[1] / f.open * 100)} % du carnet`, `${fmt(top[1])} pièces sur ${fmt(f.open)} à livrer.`);
        add('info', 'ti-truck-delivery', `${fmt(f.next30)} pièces à livrer d'ici 30 jours`, 'C\'est la charge « immédiate » que l\'atelier doit absorber.');
      } else if (view === 'gantt' && typeof ofs !== 'undefined') {
        const u = ofs.filter(o => o.stage === 'usinage'), ms = {};
        u.forEach(o => { ms[o.machine || '—'] = (ms[o.machine || '—'] || 0) + 1; });
        const late = (typeof calcDates === 'function') ? u.filter(o => { const e = calcDates(o).dates.usinage; return e && new Date(e + 'T12:00:00') < new Date(); }) : [];
        add(late.length ? 'warn' : 'ok', 'ti-calendar-time', late.length ? `${late.length} ${plur(late.length, 'OF a', 'OF ont')} dépassé leur date de fin d'usinage` : 'Tous les OF sont dans leur calendrier', 'Une barre qui finit avant la ligne verticale « aujourd\'hui » devrait déjà être terminée : l\'OF est probablement bloqué ou la date à revoir.');
        add('info', 'ti-hand-click', 'Astuce', 'Faites glisser une barre pour décaler un OF, tirez ses bords pour changer sa durée. La barre prend la couleur du client.');
      } else if (view === '3m' && typeof get3MData === 'function') {
        const { refs3m, obj, qtyArchivees } = get3MData();
        const O = refs3m.reduce((s, r) => s + (obj[r] || 0), 0), F = refs3m.reduce((s, r) => s + (qtyArchivees[r] || 0), 0);
        const pct = O ? Math.round(F / O * 100) : 0, yr = new Date().getFullYear(), elapsed = Math.round(((new Date() - new Date(yr, 0, 1)) / (365 * DAY)) * 100);
        add(pct >= elapsed - 5 ? 'ok' : pct >= elapsed - 20 ? 'warn' : 'crit', 'ti-target', `${pct} % de l'objectif atteint`, `${fmt(F)} pièces livrées sur ${fmt(O)}. À cette date de l'année, on devrait être autour de ${elapsed} % si le rythme était régulier.`);
        const left = Math.max(0, O - F), weeks = Math.max(1, Math.round((new Date(yr, 11, 31) - new Date()) / (7 * DAY)));
        add('info', 'ti-gauge', `${fmt(left / weeks)} pièces par semaine pour finir l'année`, `Il reste ${fmt(left)} pièces à livrer sur environ ${weeks} semaines.`);
      } else if (view === 'archives' && f.sc) {
        const d = f.sc;
        if (d.otd != null) add(tone(d.otd, .9, .7), 'ti-target-arrow', `${Math.round(d.otd * 100)} % des OF livrés dans les délais`, `${d.nOui} sur ${d.nJug} OF évalués. Objectif courant d'une bonne usine : au-dessus de 90 %.`);
        if (d.lead != null) add('info', 'ti-clock', `${d.lead} jours entre création et archivage`, 'C\'est le délai médian : la moitié des OF vont plus vite, l\'autre moitié plus lentement.');
        if (d.qual != null) add(d.qual >= .97 ? 'ok' : 'warn', 'ti-certificate', `${(d.qual * 100).toFixed(1).replace('.', ',')} % de pièces conformes`, 'Pièces bonnes divisées par pièces contrôlées.');
      }
    } catch (e) { console.error('[En clair] reading', view, e); }
    return R.slice(0, 3);
  }
  function readingHtml(view) {
    const R = reading(view); if (!R.length) return '';
    return `<div class="dz-read" data-view="${view}"><div class="dz-read-h"><i class="ti ti-bulb"></i>À retenir</div><div class="dz-read-g">${R.map((x, i) =>
      `<div class="dz-r ${x.t}" style="animation-delay:${i * 90}ms"><i class="ti ${x.i}"></i><div><b>${x.h}</b><span>${x.p}</span></div></div>`).join('')}</div></div>`;
  }
  window.dzReadingHtml = readingHtml;

  // ───────────────────────── Glossaire & aide ─────────────────────────
  const GLOSS = [
    ['OF (ordre de fabrication)', 'La « commande interne » donnée à l\'atelier : fabriquer X pièces d\'une référence, sur telle machine, pour telle date.'],
    ['PDP (plan directeur de production)', 'Le plan qui compare, pour chaque produit, ce qu\'on a en stock avec ce que les clients ont commandé, pour savoir quoi fabriquer et quand.'],
    ['Rupture', 'Le moment où le stock ne suffit plus pour livrer une commande. C\'est le risque numéro 1 : un client qui n\'est pas livré.'],
    ['Couverture (en mois)', 'Combien de temps le stock actuel permet de tenir, au rythme des ventes habituelles. 3 mois = on peut livrer 3 mois sans fabriquer.'],
    ['Stock de sécurité', 'Une réserve volontaire pour absorber les imprévus (pic de commande, panne, rebut).'],
    ['En-cours (WIP)', 'Tout ce qui est en cours de fabrication dans l\'atelier mais pas encore terminé. Trop d\'en-cours = argent immobilisé et délais qui s\'allongent.'],
    ['Lead time (délai)', 'Le temps total entre le lancement d\'un OF et sa fin. Plus il est court, plus l\'atelier est réactif.'],
    ['TC (temps de cycle)', 'Le temps pour fabriquer une pièce sur une machine. Il sert à calculer combien de jours de machine il faut pour un OF.'],
    ['Débit', 'Le nombre de pièces terminées par semaine : c\'est la vitesse réelle de l\'atelier.'],
    ['OTD (livré à l\'heure)', 'Pourcentage de livraisons faites dans les délais promis. 95 % = très bon.'],
    ['Goulot d\'étranglement', 'L\'étape la plus lente : tout ce qui est en amont s\'y accumule. L\'améliorer fait avancer toute la chaîne.'],
    ['ABC / XYZ', 'A, B, C classent les références par volume de ventes ; X, Y, Z par régularité de la demande. On pilote chaque classe différemment.'],
    ['Pareto', 'La règle des 80/20 : une petite partie des clients ou des références fait l\'essentiel du volume.'],
  ];
  const HELP = {
    cockpit: ['Le grand cadran donne la « santé » de l\'atelier de 0 à 100 : plus il est haut, mieux c\'est.', 'Les colonnes « Quand les ruptures tombent » montrent combien de références vont manquer, semaine par semaine.', 'Cliquez sur une référence « Les plus urgentes » pour voir sa fiche.'],
    fiab: ['« Tout bon » = part des OF à la fois conformes ET livrés à l\'heure du premier coup : c\'est l\'indicateur de fiabilité principal.', 'Le simulateur donne la date à annoncer au client : la date théorique plus la marge que l\'historique de la machine impose.', 'Courbe des délais : un point rouge = un OF anormal, à investiguer. Le classement des retards montre quelles machines en causent le plus.'],
    abc: ['A = les références qui font 80 % des ventes : à surveiller de très près. B = les 15 % suivants. C = la longue traîne (5 %).', 'X = demande régulière, Y = variable, Z = irrégulière. Plus la demande est irrégulière, plus il faut de stock de sécurité.', 'La barre de couverture compare le stock actuel (barre) à la cible (trait noir). Cliquez une case de la matrice pour filtrer.'],
    synthese: ['Chaque carte répond à une question simple. Vert = tout va bien, orange = à surveiller, rouge = il faut agir.', 'Le bouton « Voir le détail » ouvre la page qui explique le pourquoi.', 'Le bouton Imprimer produit un résumé d\'une page à envoyer ou afficher.'],
    kanban: ['Chaque colonne est une étape de fabrication, de gauche à droite.', 'Une carte = un OF. Un badge « X j en attente » signale un OF qui n\'avance plus.', 'Faites glisser une carte pour la faire passer à l\'étape suivante.'],
    forets: ['L\'entonnoir montre combien d\'OF de forets sont à chaque étape.', 'Les cartes en dessous détaillent chaque étape avec les ratios de rendement.', 'Le tableau final liste les OF un par un.'],
    list: ['Une ligne = un OF. Les lignes cerclées de rouge sont en retard.', 'Cliquez sur une ligne pour ouvrir le détail et changer d\'étape.'],
    archives: ['Les OF terminés. Servent à mesurer les délais et la qualité réellement tenus.', 'Utilisez les filtres mois et client pour isoler une période.'],
    '3m': ['Chaque carte est une référence 3M avec son objectif annuel.', 'La barre foncée = déjà livré ; la barre claire = en cours de fabrication.', '« Restant » = ce qu\'il reste à produire pour atteindre l\'objectif.'],
    gantt: ['Chaque ligne est une machine, chaque barre un OF dans le temps.', 'La ligne verticale colorée = aujourd\'hui. Une barre qui finit avant elle est en retard.', 'Faites glisser une barre pour décaler l\'OF.'],
    stats: ['Cette page analyse tout ce qui a déjà été produit (OF archivés). Les boutons en haut changent la période.', 'Chaque chiffre est comparé à la période précédente : flèche verte = amélioration.', '« Quel délai peut-on promettre ? » : 9 OF sur 10 sont finis dans ce délai, c\'est la date qu\'on peut annoncer sans risque.', 'La grille machines × mois montre qui travaille vraiment : plus c\'est foncé, plus c\'est chargé.'],
    pdp: ['Une tuile = une référence (ou un client). On y voit le stock, les commandes et la couverture.', 'La barre de couverture : pleine = tout est couvert ; rouge = il va manquer.', 'Cliquez sur une tuile pour voir semaine par semaine ce qui se passe.'],
    besoins: ['Les références qui vont manquer, de la plus urgente à la moins urgente.', 'Le radar place chaque référence dans le temps : à gauche = déjà dépassé, à droite = loin.', 'Cliquez sur une ligne pour ouvrir la fiche détaillée.'],
    conso: ['Pour chaque référence : combien de mois de ventes le stock couvre.', 'Rouge = moins d\'un mois (urgent), orange = moins de trois mois, vert = confortable.'],
    commandes: ['Les commandes ouvertes regroupées par client ou par date.', 'Le calculateur du haut estime si une quantité demandée peut être livrée avec le stock actuel.'],
    planning: ['Le tableau reprend votre fichier Excel : stock, en cours et commandes par article.', 'La pastille « Stock restant » est rouge quand il manque des pièces.'],
    pultrusion: ['Suivi des OF de pultrusion et des besoins prévisionnels.'],
  };

  function ensureShell() {
    if (document.getElementById('cl-drawer')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div class="cl-drawer" id="cl-drawer" aria-hidden="true">
        <div class="cl-drawer-h"><b><i class="ti ti-help-circle"></i> Aide</b><button onclick="clairHelp(false)" aria-label="Fermer"><i class="ti ti-x"></i></button></div>
        <div class="cl-drawer-b" id="cl-drawer-b"></div>
      </div>
      <div class="cl-tv-bar" id="cl-tv-bar"><i></i><span id="cl-tv-lab"></span>
        <div class="cl-tv-ctl"><button onclick="clairTVStep(-1)" title="Page précédente (←)" aria-label="Page précédente"><i class="ti ti-player-skip-back"></i></button>
        <button id="cl-tv-pp" onclick="clairTVPause()" title="Pause / reprise (Espace)"><i class="ti ti-player-pause"></i> Pause</button>
        <button onclick="clairTVStep(1)" title="Page suivante (→)" aria-label="Page suivante"><i class="ti ti-player-skip-forward"></i></button>
        <div class="cl-tv-dots" id="cl-tv-dots"></div>
        <select id="cl-tv-sec" onchange="clairTVSpeed(this.value)" title="Durée d'affichage de chaque page"><option value="15">15 s</option><option value="25" selected>25 s</option><option value="40">40 s</option><option value="60">60 s</option></select></div>
        <button onclick="clairTV(false)"><i class="ti ti-x"></i> Quitter (Échap)</button></div>`);
  }
  window.clairHelp = function (open) {
    ensureShell();
    const dr = document.getElementById('cl-drawer'), b = document.getElementById('cl-drawer-b');
    if (open === false) { dr.classList.remove('open'); return; }
    if (open !== true && dr.classList.contains('open')) { dr.classList.remove('open'); return; }
    const v = (typeof currentView !== 'undefined') ? currentView : 'kanban';
    const lab = { cockpit: 'le Cockpit', synthese: 'la page En clair', abc: 'les Gammes ABC', fiab: 'la Fiabilité des machines', kanban: 'le Kanban', forets: 'les Forets', list: 'la Liste', archives: 'les Archives', '3m': 'l\'Objectif 3M', gantt: 'le Gantt', stats: 'les Statistiques', pdp: 'le PDP', besoins: 'les Besoins', conso: 'la Consommation', commandes: 'les Commandes', planning: 'le Planning composite', pultrusion: 'la Pultrusion' }[v] || 'cette page';
    b.innerHTML = `<h4>Comment lire ${lab}</h4><ul>${(HELP[v] || ['Cette page n\'a pas encore de guide.']).map(x => `<li>${x}</li>`).join('')}</ul>
      <h4>Le vocabulaire en clair</h4><input id="cl-gl-q" type="search" placeholder="Chercher un mot…" oninput="clairGloss(this.value)"><div id="cl-gl">${glossHtml('')}</div>`;
    dr.classList.add('open');
  };
  function glossHtml(q) {
    q = (q || '').toLowerCase();
    const l = GLOSS.filter(g => !q || (g[0] + ' ' + g[1]).toLowerCase().includes(q));
    return l.length ? l.map(g => `<dl><dt>${g[0]}</dt><dd>${g[1]}</dd></dl>`).join('') : '<p class="cl-none">Aucun mot ne correspond.</p>';
  }
  window.clairGloss = q => { const e = document.getElementById('cl-gl'); if (e) e.innerHTML = glossHtml(q); };

  // ───────────────────────── Mode TV ─────────────────────────
  const TV_VIEWS = ['jour', 'synthese', 'cockpit', 'besoins', 'stats', 'abc', 'forets', 'pdp'];
  let TV_SEC = 25;
  let tvTimer = 0, tvIdx = 0, tvPaused = false;
  const tvN = () => TV_VIEWS.length;
  function tvArm() { clearTimeout(tvTimer); if (!tvPaused) tvTimer = setTimeout(() => { tvIdx = (tvIdx + 1) % tvN(); tvShow(); }, TV_SEC * 1000); }
  function tvBar() {
    const bar = document.querySelector('#cl-tv-bar > i'); if (!bar) return;
    bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth;
    if (!tvPaused) { bar.style.transition = `width ${TV_SEC}s linear`; bar.style.width = '100%'; } else { bar.style.width = '100%'; bar.style.opacity = '.35'; }
    if (!tvPaused) bar.style.opacity = '1';
  }
  function tvUi() {
    const pp = document.getElementById('cl-tv-pp');
    if (pp) pp.innerHTML = tvPaused ? '<i class="ti ti-player-play"></i> Reprendre' : '<i class="ti ti-player-pause"></i> Pause';
    const d = document.getElementById('cl-tv-dots');
    if (d) d.innerHTML = TV_VIEWS.map((v, k) => `<b class="${k === tvIdx ? 'on' : ''}" onclick="clairTVGo(${k})" title="Aller à cette page"></b>`).join('');
  }
  function tvShow() {
    const v = TV_VIEWS[tvIdx % tvN()];
    if (v === 'stats') window._statsTab = 'encours';
    setView(v, false);
    const lab = document.getElementById('cl-tv-lab'); if (lab) lab.textContent = (document.title || '').replace('PlanProd — ', '') + '  ·  ' + (tvIdx % tvN() + 1) + '/' + tvN() + (tvPaused ? '  ·  en pause' : '');
    tvBar(); tvUi(); tvArm();
  }
  window.clairTVStep = d => { if (!document.body.classList.contains('tv')) return; tvIdx = ((tvIdx + d) % tvN() + tvN()) % tvN(); tvShow(); };
  window.clairTVGo = k => { if (!document.body.classList.contains('tv')) return; tvIdx = k % tvN(); tvShow(); };
  window.clairTVPause = () => {
    if (!document.body.classList.contains('tv')) return;
    tvPaused = !tvPaused; tvShow();
  };
  window.clairTVSpeed = v => { TV_SEC = Math.max(5, +v || 25); tvShow(); };
  window.clairTV = function (on) {
    ensureShell();
    const active = document.body.classList.contains('tv');
    if (on === undefined) on = !active;
    if (on === active) return;
    if (on) {
      document.body.classList.add('tv'); clairHelp(false); tvIdx = 0; tvPaused = false; tvShow();
      try { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); } catch (e) {}
    } else {
      document.body.classList.remove('tv'); clearTimeout(tvTimer);
      try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    }
  };
  document.addEventListener('keydown', e => {
    if (!document.body.classList.contains('tv')) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '') && e.key !== 'Escape') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); clairTVStep(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); clairTVStep(-1); }
    else if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); clairTVPause(); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (document.body.classList.contains('tv')) clairTV(false); else clairHelp(false); } });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.body.classList.contains('tv')) clairTV(false); });

  // ───────────────────────── Page « En clair » ─────────────────────────
  const WEATHER = {
    ok: ['ti-sun', 'Beau temps', 'L\'atelier tourne bien'],
    warn: ['ti-cloud', 'Quelques nuages', 'Quelques points demandent de l\'attention'],
    crit: ['ti-cloud-storm', 'Orage en vue', 'Plusieurs sujets demandent une action rapide'],
  };
  const TONE_LAB = { ok: 'Tout va bien', warn: 'À surveiller', crit: 'Il faut agir' };

  function questions(f) {
    const Q = [], sc = f.sc;
    if (f.ok) {
      const crit14 = f.rup14.length, n42 = f.rup42.length;
      Q.push({ t: crit14 ? 'crit' : n42 ? 'warn' : 'ok', i: 'ti-truck-delivery', q: 'Va-t-on livrer nos clients à temps ?',
        a: crit14 ? `Non, pas partout : ${crit14} ${plur(crit14, 'référence va', 'références vont')} manquer d'ici 2 semaines.` : n42 ? `Pour l'instant oui, mais ${n42} ${plur(n42, 'référence risque', 'références risquent')} de manquer d'ici 6 semaines.` : 'Oui : toutes les commandes ouvertes sont couvertes pour les 6 prochaines semaines.', go: 'besoins', cta: 'Voir les ruptures à venir' });
      const pc = f.avec.length ? Math.round((f.avec.length - f.rup.length) / f.avec.length * 100) : 100;
      Q.push({ t: tone(pc, 90, 70), i: 'ti-packages', q: 'A-t-on assez de pièces en stock ?',
        a: `${f.avec.length - f.rup.length} références sur ${f.avec.length} ont de quoi honorer toutes leurs commandes ouvertes (${pc} %).`, go: 'pdp', cta: 'Voir stock par référence' });
      const e = f.echues.length;
      Q.push({ t: e === 0 ? 'ok' : e < 10 ? 'warn' : 'crit', i: 'ti-calendar-x', q: 'Y a-t-il déjà des commandes en retard ?',
        a: e ? `${e} lignes de commande ont dépassé leur date de livraison (${fmt(f.echuesQ)} pièces). À confirmer avec l'ERP si elles sont vraiment non livrées.` : 'Non : aucune commande n\'a dépassé sa date de livraison.', go: 'commandes', cta: 'Voir le carnet' });
    }
    if (sc) {
      const frozen = sc.ofs.filter(x => x.age > 30).length, sh = sc.ofs.length ? frozen / sc.ofs.length : 0;
      Q.push({ t: sh === 0 ? 'ok' : sh < .2 ? 'warn' : 'crit', i: 'ti-building-factory-2', q: 'L\'atelier avance-t-il normalement ?',
        a: frozen ? `${frozen} OF sur ${sc.ofs.length} n'ont pas changé d'étape depuis plus d'un mois : ils sont probablement bloqués.` : 'Oui : aucun OF n\'est resté immobile plus d\'un mois.', go: 'kanban', cta: 'Voir où ça bloque' });
      if (sc.otd != null) Q.push({ t: tone(sc.otd, .9, .75), i: 'ti-target-arrow', q: 'Tient-on nos délais d\'habitude ?',
        a: `${Math.round(sc.otd * 100)} % des OF terminés sont livrés dans les délais (${sc.nOui} sur ${sc.nJug}).`, go: 'archives', cta: 'Voir les archives' });
      const top = sc.clients[0];
      if (top && sc.pieces) { const sh2 = top[1].qty / sc.pieces; Q.push({ t: sh2 > .6 ? 'warn' : 'ok', i: 'ti-users', q: 'Dépend-on trop d\'un seul client ?',
        a: `${top[0]} représente ${Math.round(sh2 * 100)} % des pièces en cours de fabrication.${sh2 > .6 ? ' Une variation de sa demande se ressent immédiatement.' : ' La charge est bien répartie.'}`, go: 'stats', cta: 'Voir la répartition' }); }
    }
    return Q;
  }

  function actions(f) {
    const A = [];
    try {
      if (f.ok) {
        const r = f.rup.slice().sort((a, b) => a.joursRup - b.joursRup)[0];
        if (r) A.push({ i: 'ti-flame', h: `Sécuriser ${r.nom}`, p: r.joursRup < 0 ? `En rupture depuis ${-r.joursRup} j — il manque ${fmt(r.rup.manque)} pièces. Voir quoi lancer ou prévenir le client.` : `Rupture dans ${r.joursRup} j — il manquera ${fmt(r.rup.manque)} pièces. Lancer la fabrication maintenant.`, fn: `pdpShowDetail('${r.code}')`, cta: 'Ouvrir la fiche' });
      }
      if (f.sc) {
        const old = f.sc.ofs.slice().sort((a, b) => b.age - a.age)[0];
        if (old && old.age > 14) A.push({ i: 'ti-snowflake', h: `Débloquer ${old.o.id} (${old.o.produit})`, p: `Immobile depuis ${old.age} jours à l'étape « ${(typeof stageOf === 'function' && stageOf(old.o.stage) || {}).label || old.o.stage} ». Qui attend quoi ?`, fn: `openDetail('${old.o.id}')`, cta: 'Ouvrir l\'OF' });
        const w = f.sc.stages.filter(s => s.n).sort((a, b) => b.avg - a.avg)[0];
        if (w && w.avg > 14) A.push({ i: 'ti-hourglass', h: `Fluidifier l'étape « ${w.st.label} »`, p: `${w.n} OF et ${fmt(w.qty)} pièces y patientent en moyenne ${Math.round(w.avg)} jours : c'est le goulot de l'atelier.`, fn: `setView('kanban')`, cta: 'Voir le Kanban' });
      }
      if (f.ok && f.echues.length) A.push({ i: 'ti-refresh', h: 'Mettre à jour l\'export de commandes', p: `${f.echues.length} lignes ont une date dépassée : vérifiez qu'elles sont vraiment non livrées (import COMMANDELIST).`, fn: `setView('commandes')`, cta: 'Ouvrir Commandes' });
    } catch (e) { console.error('[En clair] actions', e); }
    return A.slice(0, 3);
  }

  window.renderSynthese = function () {
    const el = document.getElementById('view-synthese'); if (!el) return;
    const f = facts(), Q = questions(f), A = actions(f);
    if (!Q.length) { el.innerHTML = '<div class="cl-wrap"><div class="cl-empty"><i class="ti ti-database-off"></i><b>Pas encore de données</b><span>Importez les OF, le stock et les commandes pour voir la synthèse.</span></div></div>'; return; }
    const nCrit = Q.filter(q => q.t === 'crit').length, nWarn = Q.filter(q => q.t === 'warn').length;
    const g = nCrit >= 2 ? 'crit' : (nCrit || nWarn >= 2) ? 'warn' : 'ok', W = WEATHER[g];
    const dt = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const tl = `<div class="cl-lights"><span class="ok"><b>${Q.filter(q => q.t === 'ok').length}</b>vert</span><span class="warn"><b>${nWarn}</b>orange</span><span class="crit"><b>${nCrit}</b>rouge</span></div>`;
    el.innerHTML = `<div class="cl-wrap">
      <div class="cl-hero ${g}"><div class="cl-hero-ico"><i class="ti ${W[0]}"></i></div>
        <div class="cl-hero-t"><small>${dt}</small><h2>${W[1]} — ${W[2].toLowerCase()}</h2><p>Voici l'état de l'atelier et de la chaîne d'approvisionnement, expliqué simplement. Aucune connaissance technique nécessaire.</p></div>
        <div class="cl-hero-r">${f.score ? `<div class="cl-score"><b>${f.score.score}</b><span>/ 100<br>indice de santé</span></div>` : ''}${tl}<button class="cl-print" onclick="window.print()"><i class="ti ti-printer"></i>Imprimer</button></div></div>
      <h3 class="cl-h"><i class="ti ti-message-question"></i>Les questions que tout le monde se pose</h3>
      <div class="cl-q">${Q.map((q, i) => `<article class="cl-card ${q.t}" style="animation-delay:${i * 70}ms">
        <header><i class="ti ${q.i}"></i><span class="cl-badge ${q.t}">${TONE_LAB[q.t]}</span></header>
        <h4>${q.q}</h4><p>${q.a}</p><button onclick="setView('${q.go}')">${q.cta} <i class="ti ti-arrow-right"></i></button></article>`).join('')}</div>
      ${A.length ? `<h3 class="cl-h"><i class="ti ti-checklist"></i>À faire en priorité cette semaine</h3>
      <div class="cl-act">${A.map((a, i) => `<div class="cl-a"><span class="cl-n">${i + 1}</span><i class="ti ${a.i}"></i><div><b>${esc(a.h)}</b><span>${esc(a.p)}</span></div><button onclick="${a.fn}">${a.cta}</button></div>`).join('')}</div>` : ''}
      <h3 class="cl-h"><i class="ti ti-book-2"></i>Le vocabulaire en 1 minute</h3>
      <div class="cl-gl">${GLOSS.slice(0, 8).map(g => `<dl><dt>${g[0]}</dt><dd>${g[1]}</dd></dl>`).join('')}</div>
      <p class="cl-foot">Données au ${new Date().toLocaleDateString('fr')}. Les chiffres viennent des imports ERP et de l'avancement des OF ; plus ils sont à jour, plus cette page est fiable.</p>
    </div>`;
  };

  document.addEventListener('DOMContentLoaded', ensureShell);
  if (document.readyState !== 'loading') ensureShell();
})();
