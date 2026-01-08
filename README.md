# AppCoach - API de Coaching Sportif

## 📋 Description

AppCoach est une API RESTful complète pour la gestion de coaching sportif, permettant aux coachs de créer des cours et aux athlètes de s'y inscrire. Ce projet démontre mes compétences en développement back-end avec une architecture moderne et sécurisée.

## 🏗️ Architecture Technique

### Stack Principal
- **Node.js** + **Express.js** - Framework serveur performant
- **TypeScript** - Typage statique pour une meilleure maintenabilité
- **Prisma** + **PostgreSQL** - ORM moderne et base de données relationnelle
- **JWT** - Authentification sécurisée par tokens
- **Zod** - Validation robuste des données d'entrée

### Outils de Développement
- **Swagger** - Documentation API interactive
- **Jest** - Tests unitaires et d'intégration
- **ESLint** + **Prettier** - Qualité de code et formatage
- **Docker** - Conteneurisation pour le déploiement
- **Nodemon** - Développement en hot-reload

## 🚀 Fonctionnalités

### Gestion des Utilisateurs
- **Authentification sécurisée** avec JWT et bcrypt
- **Rôles multiples** : Coach, Athlète Pro, Athlète Co
- **Profils complets** avec informations sportives (poids, stats)

### Système de Cours
- **Création de cours** par les coachs (titre, description, durée, participants max)
- **Inscription des athlètes** aux cours disponibles
- **Gestion des dates** et plannings

### Statistiques Sportives
- **Suivi des performances** : Squat, Bench Press, Deadlift
- **Historique** des progression par athlète

## 📁 Structure du Projet

```
src/
├── constants/         # Constantes de l'application
├── doc/              # Documentation Swagger
├── interface/        # Définitions TypeScript
├── middleware/       # Middlewares (auth, validation)
├── routes/           # Routes API (users, courses, stats, auth)
├── schemas/          # Schémas de validation Zod
├── service/          # Logique métier
├── db-config.ts      # Configuration base de données
└── index.ts          # Point d'entrée serveur
```

## 🔧 Installation & Démarrage

### Prérequis
- Node.js 18+
- PostgreSQL
- Docker (optionnel)

### Installation locale
```bash
# Cloner le projet
git clone <repository-url>
cd back

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# Générer le client Prisma
npx prisma generate

# Lancer les migrations
npx prisma migrate dev

# Démarrer le serveur de développement
npm start
```

### Avec Docker
```bash
# Construire et lancer les conteneurs
npm run docker
```

## 📚 Documentation API

Une fois le serveur démarré, accédez à :
- **Swagger UI** : `http://localhost:4000/doc`
- **API Base** : `http://localhost:4000/api`

## 🧪 Tests

```bash
# Lancer tous les tests
npm run jest:test

# Tests en mode watch
npm test
```

## 🔐 Sécurité

- **Hashage des mots de passe** avec bcrypt
- **Tokens JWT** avec expiration
- **Validation des entrées** avec Zod
- **Protection contre les injections** via Prisma ORM

## 🎯 Points Techniques Valorisés

### Architecture Scalable
- **Séparation des responsabilités** (routes, services, schémas)
- **Injection de dépendances** pour la testabilité
- **Middleware Express** pour la logique transversale

### Bonnes Pratiques
- **TypeScript strict** pour la sécurité du typage
- **Validation exhaustive** des données d'entrée
- **Tests unitaires** pour la non-régression
- **Documentation auto-générée** avec Swagger

### Performance
- **Connexions PostgreSQL optimisées** avec Prisma
- **Middleware de parsing JSON** efficace
- **Structure modulaire** pour le chargement rapide

## 📊 Modèle de Données

### Entités Principales
- **User** : Utilisateurs avec rôles (Coach/Athlète)
- **Courses** : Sessions de coaching
- **Registration** : Inscriptions aux cours
- **Stats** : Performances sportives

## 🚀 Déploiement

Le projet est prêt pour le déploiement avec :
- **Configuration Docker** complète
- **Variables d'environnement** gérées
- **Scripts de build** automatisés

## 💡 Ce que ce projet démontre

Mes compétences en :
- **Architecture back-end moderne** et scalable
- **Sécurité des applications** web
- **Gestion de base de données** relationnelle
- **Tests automatisés** et qualité de code
- **Documentation technique** claire
- **Déploiement conteneurisé**

