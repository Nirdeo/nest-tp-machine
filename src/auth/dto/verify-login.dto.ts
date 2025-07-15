import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyLoginDto {
  @ApiProperty({
    description: 'Adresse email utilisée pour la connexion',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Code de validation 2FA à 6 chiffres reçu par email',
    example: '789012',
    pattern: '^[0-9]{6}$',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  code: string;
} 