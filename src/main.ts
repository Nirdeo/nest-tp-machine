import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Validation globale
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Supprime les propriétés non décorées
    forbidNonWhitelisted: true, // Lève une erreur si des propriétés non autorisées sont présentes
    transform: true, // Transforme automatiquement les types
  }));

  // Configuration CORS pour permettre les requêtes depuis le frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Configuration Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('🎬 Watchlist API')
    .setDescription(`
      API de gestion de watchlist de films avec authentification 2FA et gestion des rôles.
      
      ## 🔐 Authentification
      Cette API utilise l'authentification JWT avec validation par email (2FA).
      
      ### 📝 Étapes d'inscription et connexion :
      1. **Inscription** : \`POST /auth/register\` - Créer un compte
      2. **Vérification email** : \`POST /auth/verify-email\` - Valider l'email avec le code reçu
      3. **Connexion** : \`POST /auth/login\` - Initier la connexion
      4. **Validation 2FA** : \`POST /auth/verify-login\` - Valider avec le code 2FA reçu par email
      5. **Utilisation** : Utiliser le token JWT retourné dans l'en-tête Authorization
      
      ## 🎯 Rôles et Permissions
      - **USER** : Gestion de ses propres films uniquement
      - **ADMIN** : Accès complet aux données de tous les utilisateurs + administration
      
      ## 🔍 Filtrage et Recherche
      L'endpoint \`GET /movies\` supporte de nombreux paramètres de filtrage et pagination.
    `)
    .setVersion('1.0')
    .setContact(
      'Équipe Développement',
      'https://github.com/votre-repo',
      'dev@watchlist.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Token JWT obtenu après connexion et validation 2FA',
        in: 'header',
      },
      'JWT-auth', // Nom de référence pour les décorateurs
    )
    .addTag('🔓 Public', 'Endpoints publics (aucune authentification requise)')
    .addTag('🔐 Authentication', 'Gestion de l\'authentification et inscription')
    .addTag('🎬 Movies', 'Gestion des films (utilisateur connecté)')
    .addTag('👨‍💼 Admin', 'Administration (ADMIN uniquement)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Garde le token entre les rechargements
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: '🎬 Watchlist API Docs',
    customfavIcon: '🎬',
  });

  await app.listen(process.env.PORT ?? 3000);
  const port = process.env.PORT ?? 3000;
  console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
  console.log(`📚 Documentation Swagger disponible sur http://localhost:${port}/api-docs`);
}
bootstrap();
