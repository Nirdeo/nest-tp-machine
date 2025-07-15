import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';

// Métadonnées pour le décorateur
export const RESOURCE_OWNERSHIP_KEY = 'resourceOwnership';

export interface ResourceOwnershipConfig {
  resourceType: 'movie' | 'user'; // Types de ressources supportées
  paramName?: string; // Nom du paramètre dans l'URL (par défaut 'id')
  allowAdmin?: boolean; // Les admins peuvent-ils accéder à toutes les ressources (par défaut true)
}

// Décorateur pour configurer la vérification de propriété
export const CheckResourceOwnership = (config: ResourceOwnershipConfig) =>
  (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(RESOURCE_OWNERSHIP_KEY, config, descriptor.value);
  };

@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.get<ResourceOwnershipConfig>(
      RESOURCE_OWNERSHIP_KEY,
      context.getHandler(),
    );

    if (!config) {
      return true; // Pas de vérification configurée
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const paramName = config.paramName || 'id';
    const resourceId = parseInt(request.params[paramName]);

    if (!resourceId || isNaN(resourceId)) {
      throw new NotFoundException('ID de ressource invalide');
    }

    // Les admins peuvent accéder à tout (sauf si explicitement désactivé)
    if (config.allowAdmin !== false && user.role === 'ADMIN') {
      return true;
    }

    // Vérifier la propriété selon le type de ressource
    const isOwner = await this.checkOwnership(
      config.resourceType,
      resourceId,
      user.id,
    );

    if (!isOwner) {
      throw new ForbiddenException(
        `Vous ne pouvez pas accéder à cette ressource ${config.resourceType}`,
      );
    }

    return true;
  }

  private async checkOwnership(
    resourceType: string,
    resourceId: number,
    userId: number,
  ): Promise<boolean> {
    switch (resourceType) {
      case 'movie':
        const movie = await this.prisma.movie.findUnique({
          where: { id: resourceId },
          select: { userId: true },
        });
        return movie?.userId === userId;

      case 'user':
        // Pour les ressources utilisateur, seul l'utilisateur lui-même peut y accéder
        return resourceId === userId;

      default:
        throw new Error(`Type de ressource non supporté: ${resourceType}`);
    }
  }
} 