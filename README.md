# Évaluation de formation — BOX AFRICA

Application web de digitalisation de la **fiche d'évaluation à chaud** des formations.
Les participants remplissent un formulaire via un lien / QR code ; un espace
administrateur calcule automatiquement le scoring, les statistiques et les graphiques.

## Fonctionnalités

- **Côté participant** (lien public, sans compte)
  - Formulaire reproduisant la fiche papier (8 critères notés de 1 à 5, nom facultatif, commentaires)
  - Interface adaptée au mobile (idéal pour un QR code)
- **Côté administration** (protégé par mot de passe)
  - Création de **sessions** de formation (intitulé, formateur, date, lieu) → lien + QR code uniques
  - Tableau de bord par session : note moyenne (/5 et %), moyenne par critère, graphiques, répartition des notes, commentaires
  - Vue globale (toutes sessions confondues)
  - Ouverture / fermeture d'une session
  - **Export CSV** (compatible Excel)

## Démarrage en local

```bash
npm install
npx prisma migrate dev      # crée la base SQLite locale
npm run seed                # (facultatif) données de démonstration
npm run dev                 # http://localhost:3000
```

- Page d'accueil : <http://localhost:3000>
- Espace admin : <http://localhost:3000/admin>  — mot de passe par défaut : **`box-admin`**
- Évaluation de démo : <http://localhost:3000/eval/demo-tic>

## Configuration (`.env`)

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | Connexion à la base (SQLite en local) |
| `ADMIN_PASSWORD` | Mot de passe de l'espace admin — **à changer** |
| `AUTH_SECRET` | Clé secrète pour signer le cookie de session — **à changer** |
| `NEXT_PUBLIC_BASE_URL` | URL publique utilisée pour générer les liens/QR (laisser vide en local) |

## Les 8 critères évalués

- *Organisme formateur* : Méthode pédagogique · Contenu du programme · Compétence du formateur · Qualité d'animation
- *Action de formation* : Durée · Application professionnelle · Atteinte des objectifs · Support pédagogique

Échelle : **1 = Faible · 2 = Moyen · 3 = Assez bien · 4 = Bien · 5 = Très bien**

## Mise en ligne (cloud)

Pour déployer sur **Vercel** (gratuit), il faut une base **PostgreSQL** (Neon, Supabase…),
car SQLite ne persiste pas sur un hébergement serverless. Étapes prévues :

1. Créer une base Postgres gratuite (Neon / Supabase) et récupérer son `DATABASE_URL`.
2. Passer le `provider` Prisma de `sqlite` à `postgresql` et l'adaptateur sur `@prisma/adapter-pg`.
3. Définir les variables d'environnement sur Vercel (`DATABASE_URL`, `ADMIN_PASSWORD`, `AUTH_SECRET`, `NEXT_PUBLIC_BASE_URL`).
4. `git push` → déploiement automatique.

## Stack technique

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Prisma 7 · Recharts · qrcode.react
