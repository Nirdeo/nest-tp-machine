import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Adresse email à vérifier',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Code de vérification à 6 chiffres reçu par email',
    example: '123456',
    pattern: '^[0-9]{6}$',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  code: string;
} 