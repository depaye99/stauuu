# Gestion Stage

**Gestion Stage** est une application web moderne de gestion des stages, développée avec Next.js, TypeScript, Supabase et TailwindCSS. Elle permet la gestion centralisée des stagiaires, tuteurs, RH, demandes, documents, évaluations et reporting, avec une interface multirôle (admin, RH, tuteur, stagiaire).

## Fonctionnalités principales

- **Authentification sécurisée** (Supabase)
- **Gestion des utilisateurs** (admin, RH, tuteur, stagiaire)
- **Gestion des stagiaires** (création, suivi, affectation tuteur)
- **Gestion des demandes** (création, suivi, validation)
- **Gestion des documents** (dépôt, validation)
- **Évaluations et reporting** (statistiques, rapports)
- **Notifications**
- **Interface multilingue** (français/anglais)
- **Thème clair/sombre**

## Stack technique

- **Framework** : Next.js (App Router)
- **Langage** : TypeScript
- **Base de données & Auth** : Supabase
- **UI** : TailwindCSS, Radix UI, Lucide Icons
- **State management** : Zustand
- **Déploiement** : Vercel

## Structure du projet

- `app/` : Pages et routes principales (admin, rh, tuteur, stagiaire, auth, api)
- `components/` : Composants UI réutilisables (boutons, cartes, header, sélecteurs)
- `lib/` : Fonctions utilitaires, hooks, gestion du store Zustand, services Supabase
- `public/` : Images et assets statiques
- `scripts/` : Scripts SQL pour la base de données
- `styles/` : Fichiers CSS globaux

## Installation & Lancement

```bash
# Installer les dépendances
pnpm install

# Lancer le serveur de développement
pnpm dev
```

Configurer les variables d’environnement Supabase dans un fichier `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Scripts utiles

- `pnpm build` : Build de production
- `pnpm start` : Lancer en mode production
- `pnpm lint` : Linter le code

## Déploiement

Déployé automatiquement sur [Vercel](https://vercel.com/).

## Contribution

1. Fork le repo
2. Crée une branche (`git checkout -b feature/ma-feature`)
3. Commit tes modifications
4. Push et ouvre une Pull Request
