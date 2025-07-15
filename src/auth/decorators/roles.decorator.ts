import { SetMetadata } from '@nestjs/common';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum Permission {
  // Permissions utilisateur de base
  READ_OWN_MOVIES = 'READ_OWN_MOVIES',
  WRITE_OWN_MOVIES = 'WRITE_OWN_MOVIES',
  DELETE_OWN_MOVIES = 'DELETE_OWN_MOVIES',
  
  // Permissions admin
  READ_ALL_MOVIES = 'READ_ALL_MOVIES',
  MANAGE_USERS = 'MANAGE_USERS',
  DELETE_ANY_MOVIE = 'DELETE_ANY_MOVIE',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  DELETE_USERS = 'DELETE_USERS'
}

// Mapping des rôles vers les permissions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.READ_OWN_MOVIES,
    Permission.WRITE_OWN_MOVIES,
    Permission.DELETE_OWN_MOVIES,
  ],
  [Role.ADMIN]: [
    Permission.READ_OWN_MOVIES,
    Permission.WRITE_OWN_MOVIES,
    Permission.DELETE_OWN_MOVIES,
    Permission.READ_ALL_MOVIES,
    Permission.MANAGE_USERS,
    Permission.DELETE_ANY_MOVIE,
    Permission.VIEW_ANALYTICS,
    Permission.DELETE_USERS,
  ],
};

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
export const RequirePermissions = (...permissions: Permission[]) => SetMetadata('permissions', permissions); 