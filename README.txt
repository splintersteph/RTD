==================================================
  PlanProd — Déploiement Render
==================================================

FICHIERS À UPLOADER SUR GITHUB
--------------------------------
  index.html       → L'application
  serveur.py       → Le serveur Python
  donnees.json     → Données initiales (OF + archives 2026)
  requirements.txt → Dépendances Python
  render.yaml      → Configuration Render (optionnel)

ÉTAPES RENDER
--------------
1. Sur render.com → "New +" → "Web Service"
2. Connecter ton dépôt GitHub "planprod"
3. Render détecte Python automatiquement. Vérifier :
     Build Command  : pip install -r requirements.txt
     Start Command  : python serveur.py
4. Cliquer "Advanced" → "Add Environment Variable"
     Rien à ajouter pour l'instant (Render gère PORT automatiquement)
5. Cliquer "Create Web Service"

AJOUTER LA BASE DE DONNÉES
----------------------------
1. Sur render.com → "New +" → "PostgreSQL"
     Name : planprod-db
     Plan : Free
2. Une fois créée, aller dans le Web Service → "Environment"
3. Ajouter la variable :
     DATABASE_URL = [coller l'Internal Database URL depuis la DB Render]
4. Le serveur chargera automatiquement les données de donnees.json
   lors du premier démarrage.

ACCÈS
------
L'URL de ton appli sera du type :
  https://planprod.onrender.com
(disponible dans le dashboard Render)

NOTE : Sur le plan gratuit Render, le service "dort" après
15 minutes d'inactivité et met ~30s à redémarrer au premier accès.
Pour éviter ça, il existe des services de "ping" gratuits comme
uptimerobot.com qui maintiennent le service actif.

==================================================
