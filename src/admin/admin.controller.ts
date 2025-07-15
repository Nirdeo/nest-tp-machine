import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete,
  Body, 
  Param, 
  UseGuards, 
  ParseIntPipe 
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles, RequirePermissions, Role, Permission } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface User {
  id: number;
  email: string;
  role: Role;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 👁️ LECTURE - ADMIN uniquement
  @Get('users')
  @RequirePermissions(Permission.READ_ALL_MOVIES)
  async getAllUsers(@CurrentUser() user: User) {
    return this.adminService.getAllUsers(user);
  }

  // 📊 ANALYTICS - ADMIN uniquement
  @Get('analytics')
  @RequirePermissions(Permission.VIEW_ANALYTICS)
  async getAnalytics(@CurrentUser() user: User) {
    return this.adminService.getAnalytics(user);
  }

  // 👥 GESTION UTILISATEURS - ADMIN uniquement
  @Patch('users/:id/role')
  @RequirePermissions(Permission.MANAGE_USERS)
  async changeUserRole(
    @Param('id', ParseIntPipe) userId: number,
    @Body('role') newRole: Role,
    @CurrentUser() admin: User
  ) {
    return this.adminService.changeUserRole(userId, newRole, admin);
  }

  // 🗑️ SUPPRESSION UTILISATEUR - ADMIN uniquement
  @Delete('users/:id')
  @RequirePermissions(Permission.DELETE_USERS)
  async deleteUser(
    @Param('id', ParseIntPipe) userId: number,
    @CurrentUser() admin: User
  ) {
    return this.adminService.deleteUser(userId, admin);
  }

  // 👑 CRÉATION ADMIN - ADMIN uniquement
  @Post('create-admin')
  @RequirePermissions(Permission.MANAGE_USERS)
  async createAdmin(
    @Body() adminData: { email: string; password: string },
    @CurrentUser() admin: User
  ) {
    return this.adminService.createAdmin(adminData, admin);
  }

  // 🛡️ ENDPOINTS DEMO
  @Get('demo/admin-only')
  getDemoAdmin() {
    return { 
      message: 'Accessible aux ADMIN uniquement',
      timestamp: new Date().toISOString()
    };
  }

  @Get('demo/manage-users-permission')
  @RequirePermissions(Permission.MANAGE_USERS)
  getDemoManageUsers() {
    return { 
      message: 'Vous avez la permission MANAGE_USERS',
      requiredPermission: Permission.MANAGE_USERS
    };
  }

  @Get('demo/analytics-permission')
  @RequirePermissions(Permission.VIEW_ANALYTICS)
  getDemoAnalytics() {
    return { 
      message: 'Vous avez la permission VIEW_ANALYTICS',
      requiredPermission: Permission.VIEW_ANALYTICS
    };
  }
} 