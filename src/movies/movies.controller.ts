import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  ParseIntPipe,
  Query
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import { CreateMovieDto, UpdateMovieDto, FilterMoviesDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ResourceOwnershipGuard, CheckResourceOwnership } from '../auth/guards/resource-ownership.guard';
import { Roles, RequirePermissions, Role, Permission } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface User {
  id: number;
  email: string;
  role: string;
}

@ApiTags('🎬 Movies')
@ApiBearerAuth('JWT-auth')
@Controller('movies')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @ApiOperation({ 
    summary: '🎬 Ajouter un nouveau film à ma watchlist',
    description: 'Créer un nouveau film dans la watchlist personnelle de l\'utilisateur connecté.'
  })
  @ApiCreatedResponse({ 
    description: 'Film ajouté avec succès à la watchlist.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        title: { type: 'string', example: 'The Dark Knight' },
        year: { type: 'number', example: 2008 },
        genre: { type: 'string', example: 'Action, Crime, Drama' },
        director: { type: 'string', example: 'Christopher Nolan' },
        rating: { type: 'number', example: 9.5 },
        watched: { type: 'boolean', example: false },
        watchedAt: { type: 'string', nullable: true, example: null },
        notes: { type: 'string', nullable: true, example: null },
        userId: { type: 'number', example: 1 },
        createdAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
        updatedAt: { type: 'string', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Données invalides ou film déjà existant pour cet utilisateur' 
  })
  @RequirePermissions(Permission.WRITE_OWN_MOVIES)
  create(@Body() createMovieDto: CreateMovieDto, @CurrentUser() user: User) {
    return this.moviesService.create(createMovieDto, user.id);
  }

  @Get()
  @ApiOperation({ 
    summary: '📋 Lister mes films avec filtrage et pagination',
    description: 'Récupérer la liste des films de l\'utilisateur avec possibilité de filtrage, recherche et pagination.'
  })
  @ApiOkResponse({ 
    description: 'Liste des films avec métadonnées de pagination.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: 'The Dark Knight' },
              year: { type: 'number', example: 2008 },
              genre: { type: 'string', example: 'Action, Crime, Drama' },
              director: { type: 'string', example: 'Christopher Nolan' },
              rating: { type: 'number', example: 9.5 },
              watched: { type: 'boolean', example: true },
              watchedAt: { type: 'string', example: '2024-01-15T20:30:00Z' },
              notes: { type: 'string', example: 'Excellent film!' },
              createdAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
              updatedAt: { type: 'string', example: '2024-01-15T10:30:00Z' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalCount: { type: 'number', example: 25 },
            totalPages: { type: 'number', example: 3 },
            hasNextPage: { type: 'boolean', example: true },
            hasPreviousPage: { type: 'boolean', example: false }
          }
        },
        filters: {
          type: 'object',
          properties: {
            search: { type: 'string', nullable: true, example: 'batman' },
            genre: { type: 'string', nullable: true, example: 'action' },
            year: { type: 'number', nullable: true, example: 2008 },
            director: { type: 'string', nullable: true, example: 'nolan' },
            watched: { type: 'boolean', nullable: true, example: true },
            minRating: { type: 'number', nullable: true, example: 7 },
            maxRating: { type: 'number', nullable: true, example: 10 },
            sortBy: { type: 'string', example: 'createdAt' },
            sortOrder: { type: 'string', example: 'desc' }
          }
        }
      }
    }
  })
  @RequirePermissions(Permission.READ_OWN_MOVIES)
  findAll(@Query() filters: FilterMoviesDto, @CurrentUser() user: User) {
    return this.moviesService.findAllByUser(user.id, filters);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: '📊 Statistiques de ma watchlist',
    description: 'Obtenir des statistiques personnelles sur mes films.'
  })
  @ApiOkResponse({ 
    description: 'Statistiques de la watchlist.',
    schema: {
      type: 'object',
      properties: {
        totalMovies: { type: 'number', example: 25 },
        watchedMovies: { type: 'number', example: 18 },
        unwatchedMovies: { type: 'number', example: 7 },
        avgRating: { type: 'number', example: 7.8 }
      }
    }
  })
  @RequirePermissions(Permission.READ_OWN_MOVIES)
  getStats(@CurrentUser() user: User) {
    return this.moviesService.getStats(user.id);
  }

  @Get('genres')
  @ApiOperation({ 
    summary: '🎭 Liste de mes genres',
    description: 'Obtenir la liste unique des genres présents dans ma watchlist.'
  })
  @ApiOkResponse({ 
    description: 'Liste des genres uniques.',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['Action', 'Drama', 'Sci-Fi', 'Thriller']
    }
  })
  @RequirePermissions(Permission.READ_OWN_MOVIES)
  getGenres(@CurrentUser() user: User) {
    return this.moviesService.getGenres(user.id);
  }

  @Get('directors')
  @ApiOperation({ 
    summary: '🎬 Liste de mes réalisateurs',
    description: 'Obtenir la liste unique des réalisateurs présents dans ma watchlist.'
  })
  @ApiOkResponse({ 
    description: 'Liste des réalisateurs uniques.',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['Christopher Nolan', 'Denis Villeneuve', 'Quentin Tarantino']
    }
  })
  @RequirePermissions(Permission.READ_OWN_MOVIES)
  getDirectors(@CurrentUser() user: User) {
    return this.moviesService.getDirectors(user.id);
  }

  @Get('search')
  @ApiOperation({ 
    summary: '🔍 Recherche rapide dans mes films',
    description: 'Recherche multi-champs dans le titre, réalisateur, genre et notes des films.'
  })
  @ApiQuery({
    name: 'q',
    description: 'Terme de recherche',
    required: true,
    example: 'batman nolan'
  })
  @ApiOkResponse({ 
    description: 'Résultats de recherche (maximum 20 films).',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          title: { type: 'string', example: 'The Dark Knight' },
          year: { type: 'number', example: 2008 },
          genre: { type: 'string', example: 'Action, Crime, Drama' },
          director: { type: 'string', example: 'Christopher Nolan' },
          rating: { type: 'number', example: 9.5 },
          watched: { type: 'boolean', example: true }
        }
      }
    }
  })
  @RequirePermissions(Permission.READ_OWN_MOVIES)
  searchMovies(@Query('q') query: string, @CurrentUser() user: User) {
    return this.moviesService.searchMovies(user.id, query);
  }

  @Get('admin/all')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.READ_ALL_MOVIES)
  findAllForAdmin() {
    return this.moviesService.findAllForAdmin();
  }

  @Get(':id')
  @UseGuards(ResourceOwnershipGuard)
  @CheckResourceOwnership({ resourceType: 'movie' })
  @RequirePermissions(Permission.READ_OWN_MOVIES)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    const isAdmin = user.role === Role.ADMIN;
    return this.moviesService.findOne(id, user.id, isAdmin);
  }

  @Patch(':id')
  @UseGuards(ResourceOwnershipGuard)
  @CheckResourceOwnership({ resourceType: 'movie' })
  @RequirePermissions(Permission.WRITE_OWN_MOVIES)
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateMovieDto: UpdateMovieDto,
    @CurrentUser() user: User
  ) {
    const isAdmin = user.role === Role.ADMIN;
    return this.moviesService.update(id, updateMovieDto, user.id, isAdmin);
  }

  @Delete(':id')
  @UseGuards(ResourceOwnershipGuard)
  @CheckResourceOwnership({ resourceType: 'movie' })
  @RequirePermissions(Permission.DELETE_OWN_MOVIES)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    const isAdmin = user.role === Role.ADMIN;
    return this.moviesService.remove(id, user.id, isAdmin);
  }

  // 🛡️ ENDPOINT ADMIN - Suppression forcée (ADMIN uniquement)
  @Delete('admin/:id/force')
  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.DELETE_ANY_MOVIE)
  forceRemove(@Param('id', ParseIntPipe) id: number, @CurrentUser() admin: User) {
    return this.moviesService.remove(id, admin.id, true);
  }
} 