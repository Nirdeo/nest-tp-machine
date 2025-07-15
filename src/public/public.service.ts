import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }

  async getPublicStats() {
    try {
      const totalUsers = await this.prisma.user.count();
      const totalMovies = await this.prisma.movie.count();
      const verifiedUsers = await this.prisma.user.count({
        where: { emailVerified: true },
      });

      // Statistiques anonymisées
      const topGenres = await this.prisma.movie.groupBy({
        by: ['genre'],
        where: {
          genre: { not: null },
        },
        _count: {
          genre: true,
        },
        orderBy: {
          _count: {
            genre: 'desc',
          },
        },
        take: 5,
      });

      return {
        totalUsers,
        verifiedUsers,
        totalMovies,
        topGenres: topGenres.map(g => ({
          genre: g.genre,
          count: g._count.genre,
        })),
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: 'Impossible de récupérer les statistiques',
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  getAppInfo() {
    return {
      name: 'Watchlist API',
      description: 'API pour la gestion de votre liste de films personnelle',
      version: '1.0.0',
      author: 'Votre équipe',
      features: [
        'Inscription avec validation par email',
        'Authentification 2FA par email',
        'Gestion personnalisée des films',
        'Système de rôles (User/Admin)',
        'Statistiques et analytics',
      ],
      endpoints: {
        public: [
          'GET /public/health - État de santé de l\'API',
          'GET /public/stats - Statistiques publiques',
          'GET /public/info - Informations sur l\'application',
        ],
        auth: [
          'POST /auth/register - Inscription',
          'POST /auth/verify-email - Vérification d\'email',
          'POST /auth/login - Connexion (2FA)',
          'POST /auth/verify-login - Validation du code 2FA',
        ],
        movies: [
          'GET /movies - Mes films (privé)',
          'POST /movies - Ajouter un film (privé)',
          'GET /movies/stats - Mes statistiques (privé)',
          'GET /movies/admin/all - Tous les films (admin)',
        ],
      },
    };
  }
} 