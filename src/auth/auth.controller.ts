import { Body, Controller, Post, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
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
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, VerifyEmailDto, VerifyLoginDto } from './dto';
import { Public } from './decorators';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Role, ROLE_PERMISSIONS } from './decorators/roles.decorator';

interface User {
  id: number;
  email: string;
  role: Role;
}

@ApiTags('🔐 Authentication')
@Controller('auth')
@Public()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ 
    summary: '📝 Inscription d\'un nouvel utilisateur',
    description: 'Créer un compte utilisateur. Un email de vérification sera envoyé avec un code à 6 chiffres.'
  })
  @ApiCreatedResponse({ 
    description: 'Utilisateur créé avec succès. Vérification d\'email requise.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Utilisateur créé. Vérifiez votre email.' },
        userId: { type: 'number', example: 1 }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Données invalides ou email déjà utilisé',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Cet email est déjà utilisé' },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 }
      }
    }
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-email')
  @ApiOperation({ 
    summary: '✅ Vérification d\'email après inscription',
    description: 'Valider l\'adresse email avec le code à 6 chiffres reçu par email.'
  })
  @ApiOkResponse({ 
    description: 'Email vérifié avec succès. L\'utilisateur peut maintenant se connecter.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Email vérifié avec succès' },
        verified: { type: 'boolean', example: true }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Code invalide, expiré ou email déjà vérifié',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Code de vérification invalide ou expiré' },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 }
      }
    }
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '🚪 Connexion (étape 1/2 du 2FA)',
    description: 'Initier la connexion. Un code de validation 2FA sera envoyé par email.'
  })
  @ApiOkResponse({ 
    description: 'Code 2FA envoyé. Procéder à l\'étape de vérification.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Code de connexion envoyé par email' },
        loginCodeSent: { type: 'boolean', example: true }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Identifiants invalides ou email non vérifié',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Email ou mot de passe incorrect' },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 }
      }
    }
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '🔑 Validation 2FA (étape 2/2)',
    description: 'Valider le code 2FA pour obtenir le token JWT d\'authentification.'
  })
  @ApiOkResponse({ 
    description: 'Connexion réussie. Token JWT retourné.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Connexion réussie' },
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            role: { type: 'string', example: 'USER' }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Code 2FA invalide ou expiré',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Code de connexion invalide ou expiré' },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 }
      }
    }
  })
  async verifyLogin(@Body() verifyLoginDto: VerifyLoginDto) {
    return this.authService.verifyLogin(verifyLoginDto);
  }

  @Post('create-admin')
  @ApiOperation({ 
    summary: '👨‍💼 Création du premier administrateur',
    description: 'Créer le premier compte administrateur du système. Disponible uniquement si aucun admin n\'existe.'
  })
  @ApiCreatedResponse({ 
    description: 'Premier administrateur créé avec succès.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Premier administrateur créé avec succès' },
        adminId: { type: 'number', example: 1 }
      }
    }
  })
  @ApiForbiddenResponse({ 
    description: 'Un administrateur existe déjà',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Un administrateur existe déjà' },
        error: { type: 'string', example: 'Forbidden' },
        statusCode: { type: 'number', example: 403 }
      }
    }
  })
  async createAdmin(@Body() registerDto: RegisterDto) {
    return this.authService.createAdmin(registerDto);
  }

  // 🔓 ENDPOINT PRIVÉ - Mes informations et permissions
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: '👤 Récupérer mon profil et permissions',
    description: 'Obtenir les informations du compte connecté et ses permissions détaillées.'
  })
  @ApiOkResponse({ 
    description: 'Informations du profil utilisateur.',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            role: { type: 'string', example: 'USER' }
          }
        },
        permissions: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['READ_OWN_MOVIES', 'WRITE_OWN_MOVIES', 'DELETE_OWN_MOVIES']
        },
        roleDescription: { type: 'string', example: 'Utilisateur standard - Gestion de ses propres films' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'Token JWT manquant ou invalide',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Token invalide' },
        error: { type: 'string', example: 'Unauthorized' },
        statusCode: { type: 'number', example: 401 }
      }
    }
  })
  async getMyProfile(@CurrentUser() user: User) {
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      permissions: userPermissions,
      roleDescription: this.getRoleDescription(user.role),
      timestamp: new Date().toISOString()
    };
  }

  private getRoleDescription(role: Role): string {
    const descriptions = {
      [Role.USER]: 'Utilisateur standard - Gestion de ses propres films',
      [Role.ADMIN]: 'Administrateur - Gestion complète des utilisateurs et du système'
    };
    return descriptions[role] || 'Rôle inconnu';
  }
} 