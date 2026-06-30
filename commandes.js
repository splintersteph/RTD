// ═══════════════════════════════════════════════════════════
// commandes.js — Onglet Commandes (groupées par client)
// Dépend de : pcData, PDP_CORRESPONDANCES, nomenclatures, showToast (définis ailleurs)
// ═══════════════════════════════════════════════════════════

let cdeSelectedClient = null;
let cdeSearchFilter = '';
let _cdeSearchTimer = null;

// Résout une référence WIP vers son code FG final via la nomenclature
function cdeResolveToFG(ref) {
  if (typeof nomenclatures === 'undefined') return ref;
  const nom = nomenclatures.find(n => n.etapes && n.etapes.some(e => e.codart === ref));
  if (!nom) return ref;
  const fgEtape = nom.etapes.find(e => e.ratio === null);
  return fgEtape ? fgEtape.codart : ref;
}

// Toutes les commandes ouvertes (LIGNE_CDE_='N') pour un code FG donné
function cdeGetForRef(fgCode) {
  return (pcData.commandes||[])
    .filter(r => String(r.REF_RTD||'').trim() === fgCode && String(r.LIGNE_CDE_||'').trim() === 'N')
    .map(r => ({
      numCmd:  String(r.NUM_COM||''),
      client:  String(r.LIBFOU||r.CODCLI||''),
      ref:     fgCode,
      qteCde:  Number(r.QTE_CDE)||0,
      qteLiv:  Number(r.QTE_LIVREE)||0,
      qteRest: (Number(r.QTE_CDE)||0) - (Number(r.QTE_LIVREE)||0),
      datDem:  cdeToISODate(r.DATDEM),
      datDel:  cdeToISODate(r.DATDEL),
    }))
    .filter(r => r.qteRest > 0);
}

// Convertit une valeur date (string ISO, objet Date, ou format FR) en "YYYY-MM-DD"
function cdeToISODate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getFullYear(), m = String(val.getMonth()+1).padStart(2,'0'), d = String(val.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+d;
  }
  const s = String(val).trim();
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[1]+'-'+isoMatch[2]+'-'+isoMatch[3];
  const frMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (frMatch) return frMatch[3]+'-'+frMatch[2].padStart(2,'0')+'-'+frMatch[1].padStart(2,'0');
  return null;
}

function cdeFmtDate(iso) {
  if (!iso) return '\u2014';
  const [y,m,d] = iso.split('-');
  return d+'/'+m+'/'+y.slice(2);
}

// ── Clic délégué
document.addEventListener('click', function(e) {
  const action = e.target.closest('[data-cde-action]');
  if (action) {
    e.stopPropagation();
    const act = action.getAttribute('data-cde-action');
    const arg = action.getAttribute('data-cde-arg');
    if (act === 'select-client') { cdeSelectedClient = arg || null; cdeSearchFilter=''; renderCommandesPage(); }
    return;
  }
});

function cdeSearch(val) {
  cdeSearchFilter = val;
  clearTimeout(_cdeSearchTimer);
  _cdeSearchTimer = setTimeout(() => {
    renderCommandesPage();
    const inp = document.getElementById('cde-search-input');
    if (inp) { inp.focus(); inp.value = val; }
  }, 200);
}

// ── Rendu principal
function renderCommandesPage() {
  const el = document.getElementById('view-commandes');
  if (!el) return;

  const hasCommandes = (pcData.commandes||[]).length > 0;

  // Regrouper PDP_CORRESPONDANCES par client (comme dans le PDP)
  const byClient = {};
  if (typeof PDP_CORRESPONDANCES !== 'undefined') {
    PDP_CORRESPONDANCES.forEach(c => {
      const key = c.client;
      byClient[key] = byClient[key] || [];
      byClient[key].push(c);
    });
  }
  const clients = Object.keys(byClient).sort();

  // Pour chaque client, calculer le total de commandes ouvertes et le nombre
  function clientStats(cl) {
    let totalQte = 0, totalCmds = 0, refsAvecCdes = 0;
    byClient[cl].forEach(r => {
      const fg = cdeResolveToFG(r.codart_wip);
      const cmds = cdeGetForRef(fg);
      if (cmds.length) refsAvecCdes++;
      totalCmds += cmds.length;
      totalQte += cmds.reduce((s,c) => s+c.qteRest, 0);
    });
    return { totalQte, totalCmds, refsAvecCdes };
  }

  const COL_DEFAULT = {bg:'var(--bg)',dot:'var(--accent)',text:'var(--accent)'};
  const CLIENT_COLORS = (typeof PDP_CLIENT_COLORS !== 'undefined') ? PDP_CLIENT_COLORS : {};

  let mainContent = '';

  if (!cdeSelectedClient) {
    // ── Vue d'ensemble : une carte par client
    mainContent += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">';
    clients.forEach(cl => {
      const col = CLIENT_COLORS[cl] || COL_DEFAULT;
      const stats = clientStats(cl);
      mainContent +=
        '<div data-cde-action="select-client" data-cde-arg="'+cl+'" style="background:var(--surface);border:1.5px solid var(--border);border-top:3px solid '+col.dot+';border-radius:var(--radius);padding:14px;cursor:pointer;transition:all .15s"'
        +' onmouseenter="this.style.background=\''+col.bg+'\'" onmouseleave="this.style.background=\'var(--surface)\'">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
        +'<span style="font-size:14px;font-weight:700;color:'+col.text+';flex:1">'+cl+'</span>'
        +(stats.totalCmds>0?'<span style="font-size:10px;font-weight:700;background:'+col.dot+';color:#fff;padding:2px 8px;border-radius:20px">'+stats.totalCmds+'</span>':'')
        +'</div>'
        +'<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted)">'
        +'<span>'+stats.refsAvecCdes+' réf. concernées</span>'
        +'<span style="font-weight:700;color:'+(stats.totalQte>0?'#A32D2D':'var(--text-faint)')+'">'+stats.totalQte.toLocaleString('fr')+' pièces</span>'
        +'</div></div>';
    });
    mainContent += '</div>';

    if (!hasCommandes) {
      mainContent += '<div style="margin-top:14px;padding:12px 16px;background:var(--bg);border:1px dashed var(--border-med);border-radius:var(--radius);font-size:12px;color:var(--text-faint);text-align:center">'
        +'<i class="ti ti-upload" style="font-size:20px;display:block;margin-bottom:6px"></i>'
        +'Importez vos commandes depuis l\'onglet Stock pour voir le détail ici</div>';
    }

  } else {
    // ── Vue client sélectionné : toutes ses commandes, groupées par référence
    const col = CLIENT_COLORS[cdeSelectedClient] || COL_DEFAULT;
    const search = cdeSearchFilter.toLowerCase();

    const refsForClient = byClient[cdeSelectedClient] || [];
    const rows = [];
    refsForClient.forEach(r => {
      const fg = cdeResolveToFG(r.codart_wip);
      const cmds = cdeGetForRef(fg);
      cmds.forEach(c => rows.push(Object.assign({}, c, {
        libelle: r.libelle_fg,
        codart_wip: r.codart_wip,
      })));
    });

    rows.sort((a,b) => (a.datDel||'9999').localeCompare(b.datDel||'9999'));

    const filteredRows = rows.filter(r =>
      !search || r.libelle.toLowerCase().includes(search) || r.numCmd.toLowerCase().includes(search) || r.client.toLowerCase().includes(search)
    );

    const totalQte = filteredRows.reduce((s,r) => s+r.qteRest, 0);

    mainContent += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">'
      + '<div style="background:'+col.bg+';border:1px solid '+col.dot+'33;border-radius:var(--radius);padding:12px 16px;flex:1;min-width:100px">'
      + '<div style="font-size:10px;color:'+col.text+';font-weight:600;text-transform:uppercase">Commandes</div>'
      + '<div style="font-size:22px;font-weight:700;color:'+col.text+'">'+filteredRows.length+'</div></div>'
      + '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;flex:1;min-width:100px">'
      + '<div style="font-size:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase">Total restant</div>'
      + '<div style="font-size:22px;font-weight:700;color:#A32D2D">'+totalQte.toLocaleString('fr')+'</div></div>'
      + '</div>';

    if (filteredRows.length) {
      mainContent += '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">'
        + '<div style="overflow-x:auto"><table class="cat-table" style="min-width:700px">'
        + '<thead><tr><th>N° Cde</th><th>Référence</th><th>Client final</th>'
        + '<th style="text-align:right">Cdé</th><th style="text-align:right">Livré</th>'
        + '<th style="text-align:right">Restant</th><th>Livraison</th></tr></thead><tbody>';
      filteredRows.forEach(r => {
        mainContent += '<tr>'
          + '<td style="font-size:11px;font-weight:600;font-family:monospace;color:var(--accent)">'+r.numCmd+'</td>'
          + '<td style="font-size:12px">'+r.libelle+'<div style="font-size:9px;color:var(--text-faint);font-family:monospace">'+r.codart_wip+'</div></td>'
          + '<td style="font-size:12px">'+r.client+'</td>'
          + '<td style="text-align:right;font-size:12px">'+r.qteCde.toLocaleString('fr')+'</td>'
          + '<td style="text-align:right;font-size:12px;color:var(--text-muted)">'+r.qteLiv.toLocaleString('fr')+'</td>'
          + '<td style="text-align:right"><span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:#FAEEDA;color:#633806">'+r.qteRest.toLocaleString('fr')+'</span></td>'
          + '<td style="font-size:11px;color:var(--text-muted)">'+cdeFmtDate(r.datDel)+'</td>'
          + '</tr>';
      });
      mainContent += '</tbody></table></div></div>';
    } else {
      mainContent += '<div style="text-align:center;padding:40px;color:var(--text-faint)"><i class="ti ti-circle-check" style="font-size:28px;display:block;margin-bottom:8px;color:#27500A"></i>Aucune commande ouverte</div>';
    }
  }

  el.innerHTML =
    '<div style="flex:1;overflow:hidden;display:flex;flex-direction:column">'
    + '<div style="padding:14px 20px;border-bottom:1px solid var(--border);background:var(--surface)">'
    + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">'
    + '<h2 style="font-size:17px;font-weight:600"><i class="ti ti-shopping-cart" style="color:var(--accent);margin-right:8px;vertical-align:-3px"></i>Commandes</h2>'
    + (cdeSelectedClient ? '<button class="btn" data-cde-action="select-client" data-cde-arg="" style="font-size:11px;padding:4px 10px"><i class="ti ti-arrow-left"></i> Tous les clients</button>' : '')
    + '</div>'
    + (cdeSelectedClient
        ? '<input id="cde-search-input" placeholder="Filtrer (référence, n° commande, client)…" value="'+cdeSearchFilter+'" oninput="cdeSearch(this.value)" style="padding:6px 10px;border:1px solid var(--border-med);border-radius:var(--radius);background:var(--bg);color:var(--text);font-size:12px;font-family:var(--font);outline:none;width:280px">'
        : '<span style="font-size:11px;color:var(--text-faint)">Cliquez sur un client pour voir le détail de ses commandes</span>')
    + '</div>'
    + '<div style="flex:1;overflow-y:auto;padding:16px 20px">' + mainContent + '</div>'
    + '</div>';
}
