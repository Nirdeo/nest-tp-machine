# 🚀 API Endpoints - Watchlist (Système Simplifié)

## 📋 Architecture des Accès

### 🔓 **Endpoints PUBLICS** (Aucune authentification requise)

#### Base & Documentation
- `GET /` - Message de bienvenue
- `GET /api` - Informations sur l'API
- `GET /public/health` - État de santé du serveur
- `GET /public/stats` - Statistiques publiques anonymisées
- `GET /public/info` - Documentation complète de l'API

#### Authentification
- `POST /auth/register` - Inscription d'un nouvel utilisateur
- `POST /auth/verify-email` - Vérification d'email après inscription
- `POST /auth/login` - Connexion (étape 1 du 2FA)
- `POST /auth/verify-login` - Validation du code 2FA (étape 2)
- `POST /auth/create-admin` - Création du premier administrateur

---

### 🔒 **Endpoints PRIVÉS** (JWT requis)

#### 👤 **USER - Gestion Personnelle** 
- `GET /movies` - Liste de mes films (avec filtrage et pagination)
- `POST /movies` - Ajouter un nouveau film
- `GET /movies/stats` - Mes statistiques personnelles
- `GET /movies/genres` - Liste de mes genres uniques
- `GET /movies/directors` - Liste de mes réalisateurs uniques
- `GET /movies/search?q=terme` - Recherche avancée dans mes films
- `GET /movies/:id` - Détails d'un film spécifique
- `PATCH /movies/:id` - Modifier un de mes films
- `DELETE /movies/:id` - Supprimer un de mes films
- `GET /auth/me` - Mes informations et permissions

#### 👨‍💼 **ADMIN - Administration Complète** (+ tout ce que USER peut faire)
- `GET /movies/admin/all` - Liste de tous les films de tous les utilisateurs
- `DELETE /movies/admin/:id/force` - Suppression forcée de n'importe quel film
- `GET /admin/users` - Liste de tous les utilisateurs
- `PATCH /admin/users/:id/role` - Changer le rôle d'un utilisateur
- `DELETE /admin/users/:id` - Supprimer un utilisateur
- `POST /admin/create-admin` - Créer un nouvel administrateur
- `GET /admin/analytics` - Statistiques globales du système
- `GET /admin/demo/*` - Endpoints de démonstration des permissions

---

## 🔐 Système d'Authentification

### 📝 **Inscription (2 étapes)**
```bash
# 1. Inscription
POST /auth/register
{
  "email": "user@example.com",
  "password": "motdepasse123"
}

# 2. Vérification email (code reçu par email)
POST /auth/verify-email
{
  "email": "user@example.com",
  "code": "123456"
}
```

### 🔓 **Connexion 2FA (2 étapes)**
```bash
# 1. Connexion initiale
POST /auth/login
{
  "email": "user@example.com",
  "password": "motdepasse123"
}

# 2. Validation 2FA (code reçu par email)
POST /auth/verify-login
{
  "email": "user@example.com",
  "code": "654321"
}
# Retourne: { "accessToken": "jwt_token", "user": {...} }
```

### 🛡️ **Utilisation des Endpoints Privés**
```bash
# Toutes les requêtes vers les endpoints privés nécessitent:
Authorization: Bearer <jwt_token>
```

---

## 👥 Système de Rôles Simplifié

### 👤 **USER** (Utilisateur Standard)
- ✅ Accès à ses propres films uniquement
- ✅ CRUD complet sur ses films personnels  
- ✅ Statistiques personnelles
- ❌ Aucun accès aux données des autres utilisateurs
- ❌ Aucun accès à l'administration

### 👨‍💼 **ADMIN** (Administrateur)
- ✅ Tous les droits utilisateur
- ✅ Accès aux films de tous les utilisateurs
- ✅ Gestion complète des utilisateurs (création, modification, suppression)
- ✅ Analytics et statistiques globales
- ✅ Administration complète de la plateforme

---

## 📊 Exemples de Réponses

### Profil Utilisateur (GET /auth/me)
```json
{
  "user": {
    "id": 2,
    "email": "user@example.com",
    "role": "USER"
  },
  "permissions": [
    "READ_OWN_MOVIES",
    "WRITE_OWN_MOVIES",
    "DELETE_OWN_MOVIES"
  ],
  "roleDescription": "Utilisateur standard - Gestion de ses propres films"
}
```

### Analytics Admin (GET /admin/analytics)
```json
{
  "summary": {
    "totalUsers": 150,
    "verifiedUsers": 142,
    "totalMovies": 1250,
    "unverifiedUsers": 8
  },
  "usersByRole": [
    { "role": "USER", "count": 148 },
    { "role": "ADMIN", "count": 2 }
  ],
  "topGenres": [
    { "genre": "Action", "count": 320 },
    { "genre": "Comédie", "count": 280 }
  ]
}
```

---

## 🚦 Codes de Statut et Erreurs

### Codes de Statut
- `200` - Succès
- `201` - Créé avec succès
- `400` - Erreur de validation
- `401` - Non authentifié
- `403` - Accès refusé (rôle insuffisant)
- `404` - Ressource non trouvée
- `409` - Conflit (email déjà utilisé)

### Messages d'Erreur Types
```json
// Accès refusé par rôle
{
  "statusCode": 403,
  "message": "Accès refusé. Rôle requis: ADMIN. Votre rôle: USER"
}

// Accès refusé par permission
{
  "statusCode": 403,
  "message": "Permissions insuffisantes. Votre rôle (USER) ne permet pas d'accéder à cette ressource."
}
```

---

## 🔍 Filtrage et Recherche Avancés

### 📋 **Paramètres de Filtrage (GET /movies)**

Tous les paramètres suivants peuvent être combinés pour affiner la recherche :

#### Pagination
- `page` - Numéro de page (défaut: 1)
- `limit` - Nombre d'éléments par page (défaut: 10)

#### Filtres de Contenu
- `search` - Recherche dans le titre (insensible à la casse)
- `genre` - Filtrer par genre (recherche partielle)
- `year` - Filtrer par année exacte
- `director` - Filtrer par réalisateur (recherche partielle)
- `watched` - Filtrer par statut de visionnage (true/false)
- `minRating` - Note minimale (0-10)
- `maxRating` - Note maximale (0-10)

#### Tri
- `sortBy` - Champ de tri : `title`, `year`, `rating`, `createdAt`, `watchedAt` (défaut: `createdAt`)
- `sortOrder` - Ordre de tri : `asc`, `desc` (défaut: `desc`)

### 📝 **Exemples d'Utilisation**

```bash
# Paginer mes films (page 2, 5 films par page)
GET /movies?page=2&limit=5

# Rechercher "batman" dans les titres
GET /movies?search=batman

# Films d'action non regardés, triés par année
GET /movies?genre=action&watched=false&sortBy=year&sortOrder=desc

# Films bien notés de Christopher Nolan
GET /movies?director=nolan&minRating=8

# Recherche combinée complexe
GET /movies?search=dark&genre=thriller&year=2008&minRating=7&sortBy=rating&sortOrder=desc

# Recherche rapide multi-champs
GET /movies/search?q=batman

# Obtenir tous les genres de mes films
GET /movies/genres

# Obtenir tous les réalisateurs de mes films  
GET /movies/directors
```

### 📊 **Format de Réponse avec Pagination**

```json
{
  "data": [...], // Liste des films
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "filters": {
    "search": "batman",
    "genre": null,
    "year": null,
    "director": null,
    "watched": null,
    "minRating": null,
    "maxRating": null,
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

## 🧪 Tests Rapides

### Santé de l'API
```bash
curl http://localhost:3000/public/health
```

### Créer le premier admin
```bash
curl -X POST http://localhost:3000/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Tester une restriction (USER → ADMIN)
```bash
# USER tente d'accéder aux analytics (devrait échouer)
curl -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:3000/admin/analytics
# Réponse: 403 Forbidden
```

### Changer le rôle d'un utilisateur (ADMIN)
```bash
curl -X PATCH http://localhost:3000/admin/users/2/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"ADMIN"}'
```

---

## 📝 Résumé de l'Architecture

### 🔓 **Accès Libre** (9 endpoints)
- Documentation et santé
- Authentification complète (inscription + 2FA)

### 👤 **USER Uniquement** (10 endpoints)  
- Gestion personnelle des films avec filtrage avancé
- Recherche et navigation des données
- Profil et permissions

### 👨‍💼 **ADMIN Uniquement** (+8 endpoints)
- Administration des utilisateurs
- Analytics globales  
- Suppression forcée
- Gestion des rôles

**Total : 24 endpoints avec protection granulaire ! 🛡️** 