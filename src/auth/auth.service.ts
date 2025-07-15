import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterDto, LoginDto, VerifyEmailDto, VerifyLoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Générer un code de vérification
    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        verificationCode,
        verificationCodeExpiry,
      },
    });

    // Envoyer l'email de vérification
    await this.emailService.sendVerificationCode(email, verificationCode, 'registration');

    return {
      message: 'Inscription réussie. Vérifiez votre email pour activer votre compte.',
      userId: user.id,
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, code } = verifyEmailDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email déjà vérifié');
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      throw new UnauthorizedException('Code de vérification invalide');
    }

    if (!user.verificationCodeExpiry || user.verificationCodeExpiry < new Date()) {
      throw new UnauthorizedException('Code de vérification expiré');
    }

    // Marquer l'email comme vérifié
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
      },
    });

    return {
      message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.',
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Veuillez vérifier votre email avant de vous connecter');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Générer un code de connexion
    const loginCode = this.generateVerificationCode();
    const loginCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginCode,
        loginCodeExpiry,
      },
    });

    // Envoyer le code de connexion par email
    await this.emailService.sendVerificationCode(email, loginCode, 'login');

    return {
      message: 'Code de connexion envoyé par email.',
      userId: user.id,
    };
  }

  async verifyLogin(verifyLoginDto: VerifyLoginDto) {
    const { email, code } = verifyLoginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    if (!user.loginCode || user.loginCode !== code) {
      throw new UnauthorizedException('Code de connexion invalide');
    }

    if (!user.loginCodeExpiry || user.loginCodeExpiry < new Date()) {
      throw new UnauthorizedException('Code de connexion expiré');
    }

    // Nettoyer le code de connexion
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginCode: null,
        loginCodeExpiry: null,
      },
    });

    // Générer le JWT
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async validateUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user || !user.emailVerified) {
      return null;
    }

    return user;
  }

  async createAdmin(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    // Vérifier si des admins existent déjà
    const existingAdmin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (existingAdmin) {
      throw new ConflictException('Un administrateur existe déjà. Contactez l\'administrateur actuel.');
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'admin avec email vérifié
    const admin = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: true, // Admin créé avec email déjà vérifié
      },
    });

    return {
      message: 'Administrateur créé avec succès. Vous pouvez maintenant vous connecter.',
      userId: admin.id,
      role: admin.role,
    };
  }
} 