import { IsOptional, IsString, IsNumber, IsBoolean, IsIn, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterMoviesDto {
  // Pagination
  @ApiPropertyOptional({
    description: 'Numéro de page (à partir de 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  // Filtres de recherche
  @ApiPropertyOptional({
    description: 'Recherche dans le titre du film (insensible à la casse)',
    example: 'batman',
  })
  @IsOptional()
  @IsString()
  search?: string; // Recherche dans le titre

  @ApiPropertyOptional({
    description: 'Filtrer par genre (recherche partielle, insensible à la casse)',
    example: 'action',
  })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par année de sortie',
    example: 2008,
    minimum: 1888,
    maximum: new Date().getFullYear() + 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({
    description: 'Filtrer par réalisateur (recherche partielle, insensible à la casse)',
    example: 'nolan',
  })
  @IsOptional()
  @IsString()
  director?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par statut de visionnage',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  watched?: boolean;

  @ApiPropertyOptional({
    description: 'Note minimale (inclusive)',
    example: 7,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Note maximale (inclusive)',
    example: 10,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxRating?: number;

  // Tri
  @ApiPropertyOptional({
    description: 'Champ de tri',
    example: 'createdAt',
    enum: ['title', 'year', 'rating', 'createdAt', 'watchedAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['title', 'year', 'rating', 'createdAt', 'watchedAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Ordre de tri',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
} 