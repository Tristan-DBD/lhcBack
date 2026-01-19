# AppCoach - API de Coaching Sportif

## 📋 Description

AppCoach est une API RESTful complète pour la gestion de coaching sportif, permettant aux coachs de créer des cours collectifs et aux athlètes de s'y inscrire.

## 🏗️ Architecture Technique

### Stack Principal
- **Node.js** + **Express.js** - Framework serveur performant
- **TypeScript** - Typage statique pour une meilleure maintenabilité
- **Prisma** + **PostgreSQL** - ORM moderne et base de données relationnelle
- **JWT** - Authentification sécurisée par tokens
- **Zod** - Validation robuste des données d'entrée
- **Supabase** - Services de base de données et authentification

### Outils de Développement
- **Swagger** - Documentation API interactive
- **Jest** - Tests unitaires et d'intégration
- **ESLint** + **Prettier** - Qualité de code et formatage
- **Docker** - Conteneurisation pour le déploiement
- **Nodemon** - Développement en hot-reload

## 🚀 Fonctionnalités Actuelles

### Gestion des Utilisateurs
- **Authentification sécurisée** avec JWT et bcrypt
- **Rôles multiples** : Coach, Athlète Pro, Athlète Co, Athlète Full, Admin
- **Profils complets** avec informations sportives (poids, stats)
- **Gestion des photos de profil** avec upload d'images
- **Programmes sportifs** uploadables pour les athlètes

### Système de Cours
- **Création de cours** par les coachs (titre, description, durée, participants max)
- **Inscription des athlètes** aux cours disponibles
- **Gestion des dates** et plannings
- **Limitation des participants** avec validation automatique

### Statistiques Sportives
- **Suivi des performances** : Squat, Bench Press, Deadlift
- **Historique** des progression par athlète
- **Statistiques personnalisées** par utilisateur

### Infrastructure & Qualité
- **API RESTful** complète avec Express.js
- **Documentation Swagger** interactive et auto-générée
- **Tests automatisés** avec Jest (unitaires et d'intégration)
- **Conteneurisation Docker** pour le déploiement
- **Code qualité** avec ESLint et Prettier
- **Rate limiting** intégré pour la protection contre les abus

## 🎯 À Venir - Prochaines Développements

### Système de Notification par Email
- **Emails de confirmation** d'inscription aux cours
- **Notifications automatiques** pour les nouveaux cours disponibles

### Améliorations Prévues
- **Suivi de paiement** pour les coachs (validation manuelle des paiements reçus)
- **Protection anti-brute-force** avancée sur l'authentification

## 📁 Structure du Projet

```
src/
├── config/           # Configurations (environnement, etc.)
├── constants/        # Constantes et configurations
├── doc/              # Documentation Swagger et loaders
├── interface/        # Définitions TypeScript (User, Course)
├── middleware/       # Middlewares (auth, authorize, handler)
├── routes/           # Routes API (users, courses, stats, auth)
├── schemas/          # Schémas de validation Zod
├── service/          # Logique métier
├── db-config.ts      # Configuration base de données Prisma
└── index.ts          # Point d'entrée serveur

test/                 # Tests unitaires et d'intégration
├── 1-user.test.ts    # Tests utilisateurs
├── 2-stats.test.ts   # Tests statistiques
├── 3-course.test.ts  # Tests cours
├── 4-register.test.ts # Tests d'inscription
└── resetDb.ts        # Utilitaire de réinitialisation BDD

prisma/
├── schema.prisma     # Schéma de base de données
└── migrations/       # Migrations Prisma

public/
├── profileImage/     # Images de profil 
└── prog/            # Programmes sportifs uploadés
```

## 🔧 Installation & Démarrage

### Prérequis
- Node.js 18+
- **Docker** (obligatoire pour la base de données PostgreSQL) 

### Installation locale
```bash
# Cloner le projet
git clone <repository-url>
cd lhcBack

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# Démarrer Docker et la base de données
# (Utiliser votre configuration Docker existante)

# Générer le client Prisma
npx prisma generate

# Lancer les migrations en développement
npm run migrate:dev

# Démarrer le serveur de développement
npm run dev
```

## 📚 Documentation API

Une fois le serveur démarré, accédez à :
- **Swagger UI** : `http://localhost:PORT/doc`
- **API Base** : `http://localhost:PORT/api`

*(Remplacez PORT par la valeur définie dans votre fichier .env)*

## 🧪 Tests

```bash
# Lancer tous les tests
npm run test

# Lancer les tests avec couverture
npm run test:coverage

# Lancer les tests en environnement de production
npm run test:prod
```

## 🔐 Sécurité

- **Hashage des mots de passe** avec bcrypt
- **Tokens JWT** avec expiration
- **Validation des entrées** avec Zod
- **Protection contre les injections** via Prisma ORM
- **Rate limiting** intégré pour prévenir les abus

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
- **Connexions PostgreSQL optimisées** avec Prisma et Supabase
- **Middleware de parsing JSON** 
- **Structure modulaire** pour le chargement rapide

## 📊 Modèle de Données

### Entités Principales
- **User** : Utilisateurs avec rôles (Coach/Athlète Prog/Athlète Co/Athlète Full/Admin)
  - Informations personnelles : nom, prénom, âge, poids, téléphone
  - Photo de profil et programme sportif uploadable
  - Authentification par email/mot de passe
  
- **Courses** : Sessions de coaching créées par les coachs
  - Titre, description, date de début, durée
  - Nombre maximum de participants
  - Relations avec coach et inscriptions
  
- **Registration** : Inscriptions des athlètes aux cours
  - Unique par utilisateur/cours pour éviter les doublons
  - Date d'inscription automatique
  
- **Stats** : Performances sportives des athlètes
  - Suivi des 3 mouvements principaux : Squat, Bench, Deadlift

## 🚀 Déploiement

Le projet est prêt pour le déploiement avec :
- **Configuration Docker** complète
- **Variables d'environnement** gérées
- **Scripts de build** automatisés
- **Support multi-environnements** (dev, prod, test)