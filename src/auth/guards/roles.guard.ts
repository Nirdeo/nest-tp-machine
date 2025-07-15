import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, Permission, ROLE_PERMISSIONS } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si aucun rôle/permission requis, on autorise l'accès
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // Vérification des rôles
    if (requiredRoles && !this.hasRequiredRole(user.role, requiredRoles)) {
      throw new ForbiddenException(
        `Accès refusé. Rôle requis: ${requiredRoles.join(' ou ')}. Votre rôle: ${user.role}`
      );
    }

    // Vérification des permissions
    if (requiredPermissions && !this.hasRequiredPermissions(user.role, requiredPermissions)) {
      throw new ForbiddenException(
        `Accès refusé. Permissions insuffisantes. Permissions requises: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }

  private hasRequiredRole(userRole: Role, requiredRoles: Role[]): boolean {
    return requiredRoles.includes(userRole);
  }

  private hasRequiredPermissions(userRole: Role, requiredPermissions: Permission[]): boolean {
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }
} 