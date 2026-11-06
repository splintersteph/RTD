/* PlanProd — session, profils et administration des comptes (côté page).
   ATTENTION : ce fichier n'est qu'une aide d'affichage. Les droits sont appliqués par le serveur. */
(function(){
'use strict';
// 1) Toute requête vers le serveur porte l'en-tête anti-CSRF ; une session expirée renvoie à la connexion.
var _f=window.fetch.bind(window);
window.fetch=function(u,o){
  o=o||{}; var url=String(u&&u.url||u), same=url.charAt(0)==='/'||url.indexOf(location.origin)===0;
  if(same){ o.credentials='same-origin'; o.headers=Object.assign({},o.headers||{}, {'X-PlanProd':'1'}); }
  return _f(u,o).then(function(r){ if(same&&r.status===401&&url.indexOf('/api/login')<0) location.replace(LOGIN_URL); return r; });
};
var LOGIN_URL=window.DEMO?location.href:'/login.html';
window.PP_USER=null;
// Export CSV : une cellule commençant par = + - @ serait exécutée comme formule par Excel → on la neutralise.
window.csvSafe=function(v){ if(typeof v==='string' && /^[=+\-@\t\r]/.test(v)) return "'"+v; return v; };
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
var $=function(s,r){return (r||document).querySelector(s);};
var css=document.createElement('style');
css.textContent=[
'.pp-chip{display:flex;align-items:center;gap:8px;padding:5px 10px 5px 6px;border-radius:999px;background:rgba(11,127,121,.1);color:#0B7F79;font-weight:600;font-size:13px;cursor:pointer;border:1px solid rgba(11,127,121,.25);margin-left:8px}',
'.pp-chip i{font-size:18px}.pp-chip small{font-weight:600;opacity:.75;font-size:11px;text-transform:uppercase;letter-spacing:.04em}',
'.pp-menu{position:fixed;z-index:99999;min-width:230px;background:#fff;border:1px solid #e1dccf;border-radius:12px;box-shadow:0 18px 40px -12px rgba(0,0,0,.28);padding:6px}',
'.pp-menu button{display:flex;width:100%;gap:10px;align-items:center;padding:9px 12px;border:0;background:none;border-radius:8px;font:inherit;font-size:13.5px;cursor:pointer;text-align:left;color:#1c2b2a}',
'.pp-menu button:hover{background:#f1efe8}',
'.pp-ov{position:fixed;inset:0;z-index:99998;background:rgba(15,25,24,.45);display:grid;place-items:center;padding:16px}',
'.pp-mod{background:#fff;border-radius:16px;width:min(760px,96vw);max-height:90vh;overflow:auto;padding:22px 24px;box-shadow:0 30px 70px -20px rgba(0,0,0,.5)}',
'.pp-mod h2{margin:0 0 4px;font-family:Sora,sans-serif;font-size:19px}.pp-mod p.s{margin:0 0 14px;color:#5d6b69;font-size:13px}',
'.pp-mod table{width:100%;border-collapse:collapse;font-size:13px}.pp-mod th{text-align:left;color:#5d6b69;font-size:11.5px;text-transform:uppercase;padding:6px 8px;border-bottom:1px solid #e6e1d6}',
'.pp-mod td{padding:8px;border-bottom:1px solid #f0ede4;vertical-align:middle}',
'.pp-mod input,.pp-mod select{padding:8px 10px;border:1px solid #d5d0c4;border-radius:8px;font:inherit;font-size:13px}',
'.pp-b{padding:7px 12px;border-radius:8px;border:1px solid #d5d0c4;background:#fff;font:inherit;font-size:12.5px;cursor:pointer;margin-right:4px}.pp-b:hover{background:#f1efe8}',
'.pp-b.p{background:#0B7F79;color:#fff;border-color:#0B7F79}.pp-b.d{color:#a12a1f}',
'.pp-tag{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11.5px;font-weight:700}.pp-tag.a{background:#e0f2f0;color:#0B7F79}.pp-tag.l{background:#eef0f6;color:#4b5a86}.pp-tag.x{background:#fdecea;color:#a12a1f}.pp-tag.k{background:#fff3d6;color:#8a5a00}.pp-tag.w{background:#fff3d6;color:#8a5a00}.pp-dot{display:inline-block;min-width:18px;padding:0 5px;margin-left:6px;border-radius:999px;background:#d4880a;color:#fff;font-size:11px;text-align:center}',
'.pp-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:14px 0 4px}',
'.pp-msg{margin:10px 0 0;font-size:13px}.pp-msg.e{color:#a12a1f}.pp-msg.o{color:#0B7F79}',
'.pp-ro-banner{background:#eef0f6;color:#34437a;border-bottom:1px solid #d6dbec;padding:7px 16px;font-size:13px;font-weight:600;display:flex;gap:8px;align-items:center}',
'body.pp-ro .topbar-imports,body.pp-ro [data-pp-write]{display:none!important}',
'body.pp-ro input[type=file]{display:none!important}'
].join('\n');
document.head.appendChild(css);

function api(path,method,body){
  return fetch(path,{method:method||'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined})
    .then(function(r){return r.json().catch(function(){return{ok:false,error:'Réponse invalide.'}}).then(function(j){j._s=r.status;return j;});});
}
function modal(html){
  var ov=document.createElement('div'); ov.className='pp-ov'; ov.innerHTML='<div class="pp-mod" role="dialog" aria-modal="true">'+html+'</div>';
  ov.addEventListener('mousedown',function(e){if(e.target===ov)ov.remove();}); document.body.appendChild(ov);
  document.addEventListener('keydown',function k(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',k);}});
  return ov;
}

// 2) Mode lecture seule : on neutralise les actions d'écriture connues (le serveur refuse de toute façon).
var WRITERS=['openNew','openAddProduct','moveStage','saveProduct','saveParametres','saveObjectif','saveForm','saveDates','saveClient','saveArchiveForm','resetDates','renameMachine','openEditProduct','editOf','editObjectif','editDates','editArchive','deleteProduct','deleteOf','deleteMachine','deleteClient','archiverOf','addMachine'];
function lockReadOnly(){
  document.body.classList.add('pp-ro');
  var b=document.createElement('div'); b.className='pp-ro-banner';
  b.innerHTML='<i class="ti ti-eye"></i> Profil lecteur : vous pouvez tout consulter, mais rien ne peut être modifié.';
  document.body.insertBefore(b,document.body.firstChild);
  var deny=function(){ if(window.showToast) window.showToast('Profil lecteur : modification impossible'); };
  WRITERS.forEach(function(n){ if(typeof window[n]==='function') window[n]=deny; });
  window.scheduleSave=function(){};
  ['dragstart','drop'].forEach(function(ev){ document.addEventListener(ev,function(e){e.preventDefault();e.stopPropagation();},true); });
  document.addEventListener('mousedown',function(e){ if(e.target.closest&&e.target.closest('.gantt-bar,.gantt-handle,[data-gantt-id]')){e.stopPropagation();} },true);
}

// 3) Pastille utilisateur + menu
function mountChip(){
  var host=$('.topbar-right'); if(!host||!window.PP_USER) return;
  var u=window.PP_USER, c=document.createElement('div'); c.className='pp-chip'; c.title='Mon compte';
  c.innerHTML='<i class="ti ti-user-circle"></i><span>'+esc(u.name)+'</span><small>'+(u.key?'Key user':u.role==='admin'?'Admin':'Lecteur')+'</small>';
  host.appendChild(c);
  c.addEventListener('click',function(e){
    e.stopPropagation(); var old=$('.pp-menu'); if(old){old.remove();return;}
    var r=c.getBoundingClientRect(), m=document.createElement('div'); m.className='pp-menu'; m.style.top=(r.bottom+6)+'px'; m.style.right=Math.max(8,innerWidth-r.right)+'px';
    m.innerHTML='<button data-a="pwd"><i class="ti ti-key"></i> Changer mon mot de passe</button>'
      +(u.role==='admin'?'<button data-a="users"><i class="ti ti-users"></i> Utilisateurs</button><button data-a="audit"><i class="ti ti-shield-check"></i> Journal de sécurité</button>':'')
      +'<button data-a="out"><i class="ti ti-logout"></i> Se déconnecter</button>';
    document.body.appendChild(m);
    m.addEventListener('click',function(ev){var a=ev.target.closest('button'); if(!a)return; m.remove();
      ({pwd:pwdDlg,users:usersDlg,audit:auditDlg,out:logout})[a.dataset.a]();});
    setTimeout(function(){document.addEventListener('click',function k(){var x=$('.pp-menu');if(x)x.remove();document.removeEventListener('click',k);});},0);
  });
}
function logout(){ api('/api/logout','POST').then(function(){location.replace(LOGIN_URL);}); }

function pwdDlg(){
  var ov=modal('<h2>Changer mon mot de passe</h2><p class="s">12 caractères minimum. Une phrase de passe fonctionne très bien.</p>'
   +'<div class="pp-row"><input id="pp-c" type="password" placeholder="Mot de passe actuel" autocomplete="current-password"></div>'
   +'<div class="pp-row"><input id="pp-n" type="password" placeholder="Nouveau mot de passe" autocomplete="new-password"></div>'
   +'<div class="pp-row"><button class="pp-b p" id="pp-go">Enregistrer</button><button class="pp-b" id="pp-x">Annuler</button></div><div class="pp-msg" id="pp-m"></div>');
  $('#pp-x',ov).onclick=function(){ov.remove();};
  $('#pp-go',ov).onclick=function(){ api('/api/password','POST',{current:$('#pp-c',ov).value,new:$('#pp-n',ov).value}).then(function(j){
    var m=$('#pp-m',ov); m.className='pp-msg '+(j.ok?'o':'e'); m.textContent=j.ok?'Mot de passe modifié.':(j.error||'Erreur'); }); };
}

var ROLE_LBL={key:'Key user',admin:'Administrateur',lecteur:'Lecteur'}, ROLE_CLS={key:'k',admin:'a',lecteur:'l'};
var TYPE_LBL={create:'Création du compte',role:'Changement de profil',delete:'Suppression du compte',enable:'Réactivation du compte'};
function usersDlg(){
  var KEY=!!(window.PP_USER&&window.PP_USER.key);
  var ov=modal('<h2>Utilisateurs</h2><p class="s">'+(KEY?'Key user : valide les demandes de l’administrateur et gère tous les comptes. Administrateur : modifie les données. Lecteur : consulte uniquement.':'Vous pouvez demander la création, le changement de profil ou la suppression d’un compte : le key user doit la valider. Vous pouvez désactiver un compte tout de suite.')+'</p><div id="pp-dm"></div><div id="pp-ul">Chargement…</div>'
   +'<h3 style="margin:18px 0 0;font-size:14px">'+(KEY?'Ajouter un compte':'Demander un compte')+'</h3>'
   +'<div class="pp-row"><input id="pp-un" placeholder="Identifiant" maxlength="40"><input id="pp-up" type="password" placeholder="Mot de passe (12 car. min.)" autocomplete="new-password">'
   +'<select id="pp-ur"><option value="lecteur">Lecteur</option><option value="admin">Administrateur</option>'+(KEY?'<option value="key">Key user</option>':'')+'</select><button class="pp-b p" id="pp-add">'+(KEY?'Créer':'Envoyer la demande')+'</button></div>'
   +'<div class="pp-msg" id="pp-m"></div><div class="pp-row"><button class="pp-b" id="pp-x">Fermer</button></div>');
  var msg=function(t,ok){var m=$('#pp-m',ov);m.className='pp-msg '+(ok?'o':'e');m.textContent=t;};
  var draw=function(j){
    var me=j.me, list=j.users;
    var dm=j.demandes||[];
    $('#pp-dm',ov).innerHTML=dm.length?'<h3 style="margin:10px 0 6px;font-size:14px">Demandes en attente ('+dm.length+')</h3><table><tr><th>Demande</th><th>Compte</th><th>Profil</th><th>Par</th><th></th></tr>'+dm.map(function(x){
      var mine=x.demandeur===me;
      return '<tr><td>'+esc(TYPE_LBL[x.type]||x.type)+'</td><td><b>'+esc(x.name)+'</b></td><td>'+(x.role?esc(ROLE_LBL[x.role]||x.role):'—')+'</td><td>'+esc(x.demandeur)+'</td><td style="white-space:nowrap">'
       +(KEY&&!mine?'<button class="pp-b p" data-a="approve" data-i="'+esc(x.id)+'">Valider</button><button class="pp-b d" data-a="reject" data-i="'+esc(x.id)+'">Refuser</button>':'')
       +(mine?'<button class="pp-b" data-a="cancel" data-i="'+esc(x.id)+'">Annuler</button>':'')+'</td></tr>';}).join('')+'</table>':'';
    $('#pp-ul',ov).innerHTML='<table><tr><th>Compte</th><th>Profil</th><th>État</th><th></th></tr>'+list.map(function(u){
      var self=u.name===me, locked=!KEY&&u.role==='key', nxt=u.role==='lecteur'?'admin':'lecteur';
      return '<tr><td><b>'+esc(u.name)+'</b>'+(self?' <small>(vous)</small>':'')+'</td>'
       +'<td><span class="pp-tag '+ROLE_CLS[u.role]+'">'+ROLE_LBL[u.role]+'</span></td>'
       +'<td>'+(u.disabled?'<span class="pp-tag x">Désactivé</span>':'Actif')+'</td><td style="white-space:nowrap">'
       +(locked?'<small>Géré par le key user</small>':
        '<button class="pp-b" data-a="role" data-n="'+esc(u.name)+'" data-r="'+nxt+'">→ '+ROLE_LBL[nxt]+'</button>'
       +(KEY&&u.role!=='key'?'<button class="pp-b" data-a="role" data-n="'+esc(u.name)+'" data-r="key">→ Key user</button>':'')
       +(KEY?'<button class="pp-b" data-a="password" data-n="'+esc(u.name)+'">Mot de passe</button>':'')
       +'<button class="pp-b" data-a="disable" data-n="'+esc(u.name)+'" data-d="'+(u.disabled?'0':'1')+'">'+(u.disabled?(KEY?'Réactiver':'Demander la réactivation'):'Désactiver')+'</button>'
       +(self?'':'<button class="pp-b d" data-a="delete" data-n="'+esc(u.name)+'">'+(KEY?'Supprimer':'Demander la suppression')+'</button>'))+'</td></tr>';
    }).join('')+'</table>';
  };
  var load=function(){api('/api/users').then(function(j){ if(j.users) draw(j); else msg(j.error||'Erreur'); });};
  var act=function(body,okMsg){api('/api/users','POST',body).then(function(j){ if(j.ok){draw(j);msg(j.pending?'Demande envoyée au key user pour validation.':(okMsg||'Fait.'),true);} else msg(j.error||'Erreur'); });};
  $('#pp-x',ov).onclick=function(){ov.remove();};
  $('#pp-add',ov).onclick=function(){act({action:'create',name:$('#pp-un',ov).value,password:$('#pp-up',ov).value,role:$('#pp-ur',ov).value},'Compte créé.');$('#pp-up',ov).value='';};
  ov.addEventListener('click',function(e){
    var b=e.target.closest('button'); if(!b||!b.dataset.a)return; var a=b.dataset.a,n=b.dataset.n;
    if(a==='approve'||a==='cancel') act({action:a,id:b.dataset.i},a==='approve'?'Demande validée.':'Demande annulée.');
    else if(a==='reject'){ var m=prompt('Motif du refus (facultatif) :'); if(m!==null) act({action:'reject',id:b.dataset.i,motif:m},'Demande refusée.'); }
    else if(a==='role') act({action:'role',name:n,role:b.dataset.r},'Profil modifié (la personne devra se reconnecter).');
    else if(a==='disable') act({action:'disable',name:n,disabled:b.dataset.d==='1'});
    else if(a==='delete'){ if(confirm((KEY?'Supprimer':'Demander la suppression de')+' le compte « '+n+' » ?')) act({action:'delete',name:n},'Compte supprimé.'); }
    else if(a==='password'){ var p=prompt('Nouveau mot de passe pour « '+n+' » (12 caractères minimum) :'); if(p) act({action:'password',name:n,password:p},'Mot de passe modifié, sessions fermées.'); }
  });
  load();
}

function auditDlg(){
  var ov=modal('<h2>Journal de sécurité</h2><p class="s">Les 300 derniers événements : connexions, échecs, sauvegardes, changements de comptes. Fichier complet : <code>journal_audit.log</code>.</p><div id="pp-al">Chargement…</div><div class="pp-row"><button class="pp-b" id="pp-x">Fermer</button></div>');
  $('#pp-x',ov).onclick=function(){ov.remove();};
  var L={demande_creee:'Demande de compte',demande_validee:'Demande validée',demande_refusee:'Demande refusée',demande_annulee:'Demande annulée',key_user_designe:'Key user désigné',key_reinitialise:'Key user réinitialisé',login_ok:'Connexion',login_echec:'Échec de connexion',login_bloque:'Connexion bloquée (trop d’essais)',deconnexion:'Déconnexion',sauvegarde:'Sauvegarde des données',sauvegarde_refusee:'Sauvegarde refusée',ecriture_refusee:'Écriture refusée (lecteur)',acces_refuse:'Accès refusé',csrf_refuse:'Requête externe refusée',reseau_refuse:'Réseau non autorisé',mdp_change:'Mot de passe changé',mdp_echec:'Échec changement de mot de passe',demarrage:'Démarrage du serveur'};
  api('/api/audit').then(function(j){
    if(!j.events){$('#pp-al',ov).textContent=j.error||'Erreur';return;}
    $('#pp-al',ov).innerHTML='<table><tr><th>Date</th><th>Événement</th><th>Compte</th><th>Adresse</th><th>Détail</th></tr>'+j.events.map(function(e){
      var bad=/echec|refuse|bloque/.test(e.evt), det=Object.keys(e).filter(function(k){return['ts','evt','user','ip'].indexOf(k)<0;}).map(function(k){return k+': '+e[k];}).join(' · ');
      return '<tr><td style="white-space:nowrap">'+esc(String(e.ts).replace('T',' '))+'</td><td>'+(bad?'<span class="pp-tag x">':'<span>')+esc(L[e.evt]||e.evt)+'</span></td><td>'+esc(e.user)+'</td><td>'+esc(e.ip)+'</td><td>'+esc(det)+'</td></tr>';}).join('')+'</table>';
  });
}

document.addEventListener('DOMContentLoaded',function(){
  api('/api/me').then(function(j){
    if(!j.name) return;
    window.PP_USER=j; mountChip(); if(j.role!=='admin') lockReadOnly();
    if(j.key) api('/api/users').then(function(r){ var n=(r.demandes||[]).length; var c=$('.pp-chip'); if(n&&c){ var d=document.createElement('span'); d.className='pp-dot'; d.title=n+' demande(s) à valider'; d.textContent=n; c.appendChild(d); } });
  });
});
})();
