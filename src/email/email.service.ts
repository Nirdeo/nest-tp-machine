import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'localhost'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendVerificationCode(email: string, code: string, type: 'registration' | 'login') {
    const subject = type === 'registration' 
      ? 'Vérification de votre inscription'
      : 'Code de connexion';
    
    const text = type === 'registration'
      ? `Votre code de vérification pour l'inscription est : ${code}`
      : `Votre code de connexion est : ${code}`;

    const html = type === 'registration'
      ? `
        <h1>Bienvenue !</h1>
        <p>Votre code de vérification pour l'inscription est :</p>
        <h2 style="font-family: monospace; font-size: 24px; color: #333;">${code}</h2>
        <p>Ce code expire dans 15 minutes.</p>
      `
      : `
        <h1>Code de connexion</h1>
        <p>Votre code de connexion est :</p>
        <h2 style="font-family: monospace; font-size: 24px; color: #333;">${code}</h2>
        <p>Ce code expire dans 10 minutes.</p>
      `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM', 'no-reply@watchlist.app'),
        to: email,
        subject,
        text,
        html,
      });
      console.log(`Email envoyé avec succès à ${email}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      // En développement, on peut afficher le code dans la console
      if (process.env.NODE_ENV === 'development') {
        console.log(`CODE DE ${type.toUpperCase()} POUR ${email}: ${code}`);
      }
    }
  }
} 