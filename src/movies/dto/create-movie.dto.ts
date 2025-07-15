import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovieDto {
  @ApiProperty({
    description: 'Titre du film',
    example: 'The Dark Knight',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Année de sortie du film',
    example: 2008,
    minimum: 1888,
    maximum: new Date().getFullYear() + 5,
  })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({
    description: 'Genre du film',
    example: 'Action, Crime, Drama',
  })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({
    description: 'Réalisateur du film',
    example: 'Christopher Nolan',
  })
  @IsOptional()
  @IsString()
  director?: string;

  @ApiPropertyOptional({
    description: 'Note personnelle du film (0-10)',
    example: 9.5,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Statut de visionnage',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  watched?: boolean;

  @ApiPropertyOptional({
    description: 'Date et heure de visionnage (ISO 8601)',
    example: '2024-01-15T20:30:00Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  watchedAt?: string;

  @ApiPropertyOptional({
    description: 'Notes personnelles sur le film',
    example: 'Excellent film, performance remarquable de Heath Ledger.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
} 