import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMovieDto, UpdateMovieDto, FilterMoviesDto } from './dto';

@Injectable()
export class MoviesService {
  constructor(private prisma: PrismaService) {}

  async create(createMovieDto: CreateMovieDto, userId: number) {
    const { watchedAt, ...movieData } = createMovieDto;
    
    return this.prisma.movie.create({
      data: {
        ...movieData,
        watchedAt: watchedAt ? new Date(watchedAt) : null,
        userId,
      },
    });
  }

  async findAllByUser(userId: number, filters?: FilterMoviesDto) {
    const {
      page = 1,
      limit = 10,
      search,
      genre,
      year,
      director,
      watched,
      minRating,
      maxRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters || {};

    // Construction des conditions de filtrage
    const where: any = { userId };

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (genre) {
      where.genre = {
        contains: genre,
        mode: 'insensitive',
      };
    }

    if (year) {
      where.year = year;
    }

    if (director) {
      where.director = {
        contains: director,
        mode: 'insensitive',
      };
    }

    if (watched !== undefined) {
      where.watched = watched;
    }

    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {};
      if (minRating !== undefined) {
        where.rating.gte = minRating;
      }
      if (maxRating !== undefined) {
        where.rating.lte = maxRating;
      }
    }

    // Calcul des paramètres de pagination
    const skip = (page - 1) * limit;

    // Exécution des requêtes en parallèle
    const [movies, totalCount] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.movie.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: movies,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        search,
        genre,
        year,
        director,
        watched,
        minRating,
        maxRating,
        sortBy,
        sortOrder,
      },
    };
  }

  async findAllForAdmin() {
    return this.prisma.movie.findMany({
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number, isAdmin = false) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    if (!movie) {
      throw new NotFoundException('Film non trouvé');
    }

    // Vérifier les droits d'accès
    if (!isAdmin && movie.userId !== userId) {
      throw new ForbiddenException('Vous ne pouvez pas accéder à ce film');
    }

    return movie;
  }

  async update(id: number, updateMovieDto: UpdateMovieDto, userId: number, isAdmin = false) {
    const movie = await this.findOne(id, userId, isAdmin);
    
    // Seul le propriétaire peut modifier son film (sauf admin)
    if (!isAdmin && movie.userId !== userId) {
      throw new ForbiddenException('Vous ne pouvez pas modifier ce film');
    }

    const { watchedAt, ...movieData } = updateMovieDto;

    return this.prisma.movie.update({
      where: { id },
      data: {
        ...movieData,
        watchedAt: watchedAt ? new Date(watchedAt) : undefined,
      },
    });
  }

  async remove(id: number, userId: number, isAdmin = false) {
    const movie = await this.findOne(id, userId, isAdmin);
    
    // Seul le propriétaire peut supprimer son film (sauf admin)
    if (!isAdmin && movie.userId !== userId) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer ce film');
    }

    return this.prisma.movie.delete({
      where: { id },
    });
  }

  async getStats(userId: number) {
    const totalMovies = await this.prisma.movie.count({
      where: { userId },
    });

    const watchedMovies = await this.prisma.movie.count({
      where: { userId, watched: true },
    });

    const avgRating = await this.prisma.movie.aggregate({
      where: { userId, rating: { not: null } },
      _avg: { rating: true },
    });

    return {
      totalMovies,
      watchedMovies,
      unwatchedMovies: totalMovies - watchedMovies,
      avgRating: avgRating._avg.rating || 0,
    };
  }

  async getGenres(userId: number) {
    const genres = await this.prisma.movie.findMany({
      where: { 
        userId,
        genre: { not: null }
      },
      select: { genre: true },
      distinct: ['genre'],
    });

    return genres
      .map(movie => movie.genre)
      .filter(genre => genre && genre.trim())
      .sort();
  }

  async getDirectors(userId: number) {
    const directors = await this.prisma.movie.findMany({
      where: { 
        userId,
        director: { not: null }
      },
      select: { director: true },
      distinct: ['director'],
    });

    return directors
      .map(movie => movie.director)
      .filter(director => director && director.trim())
      .sort();
  }

  async searchMovies(userId: number, query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    return this.prisma.movie.findMany({
      where: {
        userId,
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            director: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            genre: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            notes: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limiter les résultats de recherche
    });
  }
} 