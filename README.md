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

Le bouton de téléchargement reste unique et ouvre directement la réponse PDF
native, sans URL blob temporaire. Le lien **Ouvrir mon PDF et l’enregistrer**
reste disponible après la première demande. Sur iPhone, ouvrir ce PDF dans
Safari, puis Partager → Enregistrer dans Fichiers ; le document se retrouve à
l’emplacement choisi dans l’app Fichiers. Une demande serveur ne prouve pas que
le navigateur a effectivement enregistré le fichier sur l’appareil.

Dans la liste des participants, **Télécharger le PDF** permet à l’administrateur
de récupérer chaque attestation personnalisée, même déjà téléchargée ou
désactivée pour le public. Cette copie est protégée par la session admin et ne
consomme pas le droit du participant. Aucun lien public de récupération n’est créé.

En cas de réception interrompue, l’administrateur
peut cliquer sur **Réautoriser le téléchargement** dans la liste des participants.
Une attestation désactivée n’est plus accessible, y compris avec une session ouverte.

Vérification : `npm test`, `npm run lint`, `npm run build`.
Avec le serveur local démarré, `node tests/attestation-download.integration.mjs`
vérifie les autorisations, les copies admin et l’ouverture inline après téléchargement.
Un test physique sur iPhone reste nécessaire pour confirmer le comportement Safari.

Appliquer les migrations avec `npx prisma migrate deploy`, puis régénérer le
client avec `npx prisma generate`. Une contrainte unique protège les réponses
contre les doubles envois d’un même appareil. Si une base ancienne contient déjà
des doublons, la migration échoue sans supprimer de réponses.

## Questionnaire événement Odoo

Le formulaire `/eval/[slug]` reprend la fiche événement : profil du participant,
cinq questions d’évaluation Oui/Non présentées une par une, puis un bloc des
problématiques avec choix multiples et précisions si Oui. Viennent ensuite le
projet de modernisation financière (avec description si Oui), la rencontre
personnalisée et sa période souhaitée, puis le commentaire final facultatif.
Le bouton Précédent conserve les choix. Le format versionné v2 conserve la
lecture des anciennes réponses v1 sans migration supplémentaire.

Les profils et réponses sont visibles uniquement dans l’admin et l’export CSV.
Les anciennes évaluations sur 5 restent conservées et leurs moyennes excluent les
nouveaux questionnaires. L’évaluation reste requise avant la création du compte
d’attestation, et une seule réponse est conservée par appareil et formation.

Avant de déployer : appliquer `20261015010000_event_survey` sur Supabase avec
`npm run db:deploy`. Cette migration ajoute un champ texte nullable `surveyData`
à `Response`, sans supprimer ou réinterpréter les réponses existantes.

## Anciennes évaluations sur 5

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

## Quiz QCM en direct

Depuis `/admin/quizzes` (lien **Quiz live** dans l’en-tête admin), créer un quiz
indépendant ou l’associer à une formation. Chaque question comporte 2 à 6 choix,
avec une ou plusieurs bonnes réponses. Le brouillon reste modifiable jusqu’à
l’ouverture des inscriptions ; ensuite les questions sont figées.

1. Ouvrir les inscriptions, partager le lien `/quiz/[slug]` ou imprimer le QR code.
2. Chaque participant saisit son nom et prénom sur son propre navigateur.
3. Une fois tous les inscrits présents, donner le départ : un compte à rebours de
   8 secondes prépare le lancement commun. Les inscriptions se ferment.
4. Projeter la page admin : le classement des copies validées s’actualise toutes
   les 3 secondes. Le participant reçoit les changements toutes les 4 secondes.
5. À l’échéance (ou à la clôture manuelle), afficher le gagnant et les confettis.
   Les ex æquo parfaits sont célébrés ensemble. Le corrigé est alors disponible.

Le score exact prime sur le temps serveur depuis le départ commun. Cocher tous
les choix ne donne aucun bonus. Une copie validée est définitive. Les réponses
sont sauvegardées automatiquement après un changement ; les copies sauvegardées
sans validation sont comptées à la clôture avec la durée maximale. Une panne
réseau avant réception de la sauvegarde peut perdre les derniers choix. Le temps
inclut la latence réseau ; ce quiz n’est pas un dispositif d’examen surveillé.

Les tentatives sont reconnues par un jeton aléatoire dans un cookie HttpOnly,
dont seul le hash est stocké. Le nom n’est pas une identité vérifiée : utiliser
un autre navigateur permet de s’inscrire de nouveau. Les bonnes réponses et les
scores individuels ne sont jamais envoyés aux participants avant la clôture.
Le classement nominatif final est accessible via le lien du quiz, ce qui est
annoncé au moment de l’inscription.

La synchronisation utilise des requêtes HTTP périodiques, sans clé Supabase
publique ni abonnement Realtime. Deux tables, `Quiz` et `QuizPlayer`, sont ajoutées
par `20261014020000_quiz`, avec RLS activée sur PostgreSQL. **Appliquer
`npm run db:deploy` à Supabase avant de publier ce code sur Vercel.** Aucune
formation ou réponse existante n’est supprimée par cette migration.

Vérifications : `npm test`, `npm run lint`, `npm run build`. Avec un serveur local
sur `127.0.0.1:3000` et `DATABASE_URL=file:...`, lancer
`node tests/quiz-flow.integration.mjs` pour vérifier le parcours HTTP et 100 copies
simulées par vagues de 20. Ce test nettoie uniquement ses propres données.
Il ne remplace pas un test de 100 connexions sur Vercel/Supabase et le Wi-Fi réel.

## Stack technique

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Prisma 7 · Recharts · qrcode.react
