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
- L’accueil participant affiche uniquement les sessions ouvertes. Le QR code de
  chaque session ouvre `/formations/[slug]`, puis le parcours évaluation → compte
  participant → attestation. Fermer une session la retire de l’accueil et bloque
  les nouvelles évaluations ; les comptes existants gardent l’accès aux attestations
  actives via leur lien.
- La création d’un nouveau compte d’attestation exige une évaluation enregistrée
  sur le même navigateur (confirmation serveur conservée 30 jours). L’accès aux
  comptes existants reste possible depuis un autre appareil.
- Espace admin : <http://localhost:3000/admin>  — mot de passe par défaut : **`box-admin`**
- Évaluation de démo : <http://localhost:3000/eval/demo-tic>

## Configuration (`.env`)

En production, `ADMIN_PASSWORD` est obligatoire (12 caractères minimum, différent
de `box-admin`) et `AUTH_SECRET` doit être unique, avec au moins 32 caractères.
Une configuration absente ou utilisant les valeurs par défaut bloque les accès.

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | Connexion à la base (SQLite en local) |
| `ADMIN_PASSWORD` | Mot de passe de l'espace admin — **à changer** |
| `AUTH_SECRET` | Clé secrète pour signer le cookie de session — **à changer** |
| `NEXT_PUBLIC_BASE_URL` | URL publique utilisée pour générer les liens/QR (laisser vide en local) |

## Attestations

L’administrateur peut importer un PDF valide de 3 Mo maximum et placer le nom du
participant sur la première page. Les nouveaux comptes utilisent un mot de passe
d’au moins 8 caractères, protégé par scrypt. Les anciens comptes sont migrés à leur
prochaine connexion, à condition de conserver leur `AUTH_SECRET` initial.

Le téléchargement reste unique. En cas de réception interrompue, l’administrateur
peut cliquer sur **Réautoriser le téléchargement** dans la liste des participants.
Une attestation désactivée n’est plus accessible, y compris avec une session ouverte.

Vérification : `npm test`, `npm run lint`, `npm run build`.

Appliquer les migrations avec `npx prisma migrate deploy`, puis régénérer le
client avec `npx prisma generate`. Une contrainte unique protège les réponses
contre les doubles envois d’un même appareil. Si une base ancienne contient déjà
des doublons, la migration échoue sans supprimer de réponses.

## Les 8 critères évalués

- *Organisme formateur* : Méthode pédagogique · Contenu du programme · Compétence du formateur · Qualité d'animation
- *Action de formation* : Durée · Application professionnelle · Atteinte des objectifs · Support pédagogique

Échelle : **1 = Faible · 2 = Moyen · 3 = Assez bien · 4 = Bien · 5 = Très bien**

## Mise en ligne (cloud)

La production utilise **PostgreSQL hébergé chez Supabase**. SQLite reste disponible
en local. Prisma choisit le schéma selon le préfixe de `DATABASE_URL`, et le build
régénère automatiquement le client correspondant.

1. Créer le projet Supabase. Copier la connexion Transaction pooler (port 6543)
   dans `DATABASE_URL`, et Session pooler (5432) dans `DIRECT_URL` pour les migrations.
   Utiliser les valeurs affichées dans Connect, avec une connexion SSL.
2. Configurer ces variables dans Vercel, avec `ADMIN_PASSWORD` (12 caractères
   minimum), `AUTH_SECRET` (32 caractères minimum) et `NEXT_PUBLIC_BASE_URL` (URL HTTPS).
3. Appliquer `npm run db:deploy` sur la base PostgreSQL avant de déployer.
   Les migrations ne transfèrent pas les données SQLite : un transfert séparé est
   nécessaire si les formations et comptes existants doivent être conservés.
4. Importer le dépôt dans Vercel (Next.js, commande `npm run build`). Vérifier les
   parcours complets, puis imprimer les QR codes avec l’URL de production.

Ne jamais exposer les mots de passe de base de données dans une variable
`NEXT_PUBLIC_*`. Les PDF sont limités à 3 Mo pour rester sous les limites de
requête et de réponse des fonctions Vercel.

## Stack technique

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Prisma 7 · Recharts · qrcode.react
