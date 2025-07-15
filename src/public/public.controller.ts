import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { Public } from '../auth/decorators';

@ApiTags('🔓 Public')
@Controller('public')
@Public()
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('health')
  @ApiOperation({ 
    summary: '💚 État de santé du serveur',
    description: 'Vérifier que l\'API est opérationnelle.'
  })
  @ApiOkResponse({ 
    description: 'Serveur opérationnel.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
        uptime: { type: 'number', example: 12345 }
      }
    }
  })
  getHealth() {
    return this.publicService.getHealth();
  }

  @Get('stats')
  @ApiOperation({ 
    summary: '📊 Statistiques publiques anonymisées',
    description: 'Obtenir des statistiques générales de l\'application (sans données personnelles).'
  })
  @ApiOkResponse({ 
    description: 'Statistiques publiques.',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number', example: 150 },
        totalMovies: { type: 'number', example: 2347 },
        topGenres: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['Action', 'Drama', 'Comedy']
        }
      }
    }
  })
  getPublicStats() {
    return this.publicService.getPublicStats();
  }

  @Get('info')
  @ApiOperation({ 
    summary: '📖 Informations sur l\'API',
    description: 'Documentation et informations générales sur l\'API Watchlist.'
  })
  @ApiOkResponse({ 
    description: 'Informations de l\'API.',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Watchlist API' },
        version: { type: 'string', example: '1.0.0' },
        description: { type: 'string', example: 'API de gestion de watchlist de films' },
        documentation: { type: 'string', example: '/api-docs' }
      }
    }
  })
  getAppInfo() {
    return this.publicService.getAppInfo();
  }
} 