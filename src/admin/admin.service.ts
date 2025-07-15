import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role, ROLE_PERMISSIONS } from '../auth/decorators/roles.decorator';
import * as bcrypt from 'bcrypt';

interface User {
  id: number;
  email: string;
  role: Role;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers(admin: User) {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: { movies: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      users,
      total: users.length,
      requestedBy: admin.email,
      timestamp: new Date().toISOString()
    };
  }

  async getAnalytics(admin: User) {
    const totalUsers = await this.prisma.user.count();
    const totalMovies = await this.prisma.movie.count();
    const verifiedUsers = await this.prisma.user.count({
      where: { emailVerified: true }
    });

    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });

    const topGenres = await this.prisma.movie.groupBy({
      by: ['genre'],
      where: { genre: { not: null } },
      _count: { genre: true },
      orderBy: { _count: { genre: 'desc' } },
      take: 10
    });

    const recentUsers = await this.prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return {
      summary: {
        totalUsers,
        verifiedUsers,
        totalMovies,
        unverifiedUsers: totalUsers - verifiedUsers
      },
      usersByRole: usersByRole.map(r => ({
        role: r.role,
        count: r._count.role
      })),
      topGenres: topGenres.map(g => ({
        genre: g.genre,
        count: g._count.genre
      })),
      recentUsers,
      requestedBy: admin.email,
      timestamp: new Date().toISOString()
    };
  }

  async changeUserRole(userId: number, newRole: Role, admin: User) {
    // Vérifier que l'utilisateur existe
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifications de sécurité
    if (targetUser.id === admin.id) {
      throw new BadRequestException('Vous ne pouvez pas modifier votre propre rôle');
    }

    // Seuls les rôles USER et ADMIN sont autorisés
    if (!Object.values(Role).includes(newRole)) {
      throw new BadRequestException('Rôle invalide. Utilisez USER ou ADMIN');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    return {
      message: `Rôle modifié avec succès`,
      user: updatedUser,
      changedBy: admin.email,
      timestamp: new Date().toISOString()
    };
  }

  async deleteUser(userId: number, admin: User) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (targetUser.id === admin.id) {
      throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte');
    }

    await this.prisma.user.delete({
      where: { id: userId }
    });

    return {
      message: `Utilisateur ${targetUser.email} supprimé avec succès`,
      deletedBy: admin.email,
      timestamp: new Date().toISOString()
    };
  }

  async createAdmin(adminData: { email: string; password: string }, currentAdmin: User) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: adminData.email }
    });

    if (existingUser) {
      throw new BadRequestException('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    const newAdmin = await this.prisma.user.create({
      data: {
        email: adminData.email,
        password: hashedPassword,
        role: Role.ADMIN,
        emailVerified: true // Les admins créés sont automatiquement vérifiés
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return {
      message: `ADMIN créé avec succès`,
      admin: newAdmin,
      createdBy: currentAdmin.email,
      permissions: ROLE_PERMISSIONS[Role.ADMIN],
      timestamp: new Date().toISOString()
    };
  }
} 