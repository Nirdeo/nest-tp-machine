import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/decorators';

@ApiTags('🔓 Public')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({ 
    summary: '👋 Message de bienvenue',
    description: 'Endpoint racine avec message de bienvenue de l\'API.'
  })
  @ApiOkResponse({ 
    description: 'Message de bienvenue.',
    schema: {
      type: 'string',
      example: 'Hello World!'
    }
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api')
  @Public()
  @ApiOperation({ 
    summary: '📚 Redirection vers la documentation API',
    description: 'Informations sur l\'API et lien vers la documentation Swagger.'
  })
  @ApiOkResponse({ 
    description: 'Informations sur l\'API.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Bienvenue sur l\'API Watchlist' },
        version: { type: 'string', example: '1.0.0' },
        documentation: { type: 'string', example: '/api-docs' },
        swagger: { type: 'string', example: 'https://localhost:3000/api-docs' }
      }
    }
  })
  getApiInfo() {
    return {
      message: 'Bienvenue sur l\'API Watchlist 🎬',
      version: '1.0.0',
      description: 'API de gestion de watchlist de films avec authentification 2FA',
      documentation: '/api-docs',
      swagger: `${process.env.BASE_URL || 'http://localhost:3000'}/api-docs`,
      endpoints: {
        public: ['/public/health', '/public/stats', '/public/info'],
        auth: ['/auth/register', '/auth/login', '/auth/verify-login'],
        movies: ['/movies', '/movies/stats', '/movies/search'],
        admin: ['/admin/users', '/admin/analytics']
      }
    };
  }

}
