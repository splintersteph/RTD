#!/usr/bin/env python3
"""
Script d'initialisation — à exécuter UNE SEULE FOIS depuis le Shell Render
pour charger les données dans PostgreSQL.
"""
import json, os, sys

DATABASE_URL = os.environ.get("DATABASE_URL", "")
if not DATABASE_URL:
    print("ERREUR : variable DATABASE_URL non trouvée.")
    print("Vérifiez que vous êtes bien dans le shell du service Render.")
    sys.exit(1)

try:
    import psycopg2
    url = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    conn = psycopg2.connect(url, sslmode="require")
    print("✓ Connecté à PostgreSQL")
except Exception as e:
    print(f"ERREUR connexion : {e}")
    sys.exit(1)

# Charger donnees.json
if not os.path.exists("donnees.json"):
    print("ERREUR : donnees.json introuvable")
    sys.exit(1)

with open("donnees.json", encoding="utf-8") as f:
    data = json.load(f)

print(f"  OF      : {len(data.get('ofs', []))}")
print(f"  Archives: {len(data.get('archives', []))}")
print(f"  Catalogue: {len(data.get('catalogue', []))}")

try:
    cur = conn.cursor()
    # Créer la table si besoin
    cur.execute("""
        CREATE TABLE IF NOT EXISTS planprod (
            id TEXT PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    # Insérer ou remplacer
    cur.execute("""
        INSERT INTO planprod (id, data, updated_at)
        VALUES ('main', %s, NOW())
        ON CONFLICT (id) DO UPDATE
        SET data = EXCLUDED.data, updated_at = NOW()
    """, (json.dumps(data, ensure_ascii=False),))
    conn.commit()
    cur.close()
    conn.close()
    print("✓ Données chargées avec succès dans PostgreSQL !")
    print("  Rechargez la page de l'application.")
except Exception as e:
    print(f"ERREUR insertion : {e}")
    sys.exit(1)
