import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  IsNumber,
  IsEnum,
  IsUrl,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MetadataDto {
  @ApiPropertyOptional({ description: 'Collection tags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Collection category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Collection brand' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ description: 'Collection season' })
  @IsString()
  @IsOptional()
  season?: string;

  @ApiPropertyOptional({ description: 'Collection year' })
  @IsNumber()
  @IsOptional()
  year?: number;
}

export class SeoDto {
  @ApiPropertyOptional({ description: 'SEO title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'SEO description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'SEO keywords', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];
}

export class DisplaySettingsDto {
  @ApiPropertyOptional({
    description: 'Sort order for products in collection',
    enum: ['name', 'createdAt', 'updatedAt', 'productCount'],
  })
  @IsEnum(['name', 'createdAt', 'updatedAt', 'productCount'])
  @IsOptional()
  sortOrder?: 'name' | 'createdAt' | 'updatedAt' | 'productCount';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
  })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortDirection?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Show in navigation menu' })
  @IsBoolean()
  @IsOptional()
  showInNavigation?: boolean;

  @ApiPropertyOptional({ description: 'Featured collection' })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}

export class CreateCollectionDto {
  @ApiProperty({
    description: 'Collection name',
    example: 'Summer Collection 2024',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Collection description',
    example: 'Our latest summer collection featuring trendy designs',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug (auto-generated if not provided)',
    example: 'summer-collection-2024',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Whether the collection is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Collection metadata',
    type: MetadataDto,
  })
  @IsObject()
  @IsOptional()
  metadata?: MetadataDto;

  @ApiPropertyOptional({
    description: 'SEO settings',
    type: SeoDto,
  })
  @IsObject()
  @IsOptional()
  seo?: SeoDto;

  @ApiPropertyOptional({
    description: 'Display settings',
    type: DisplaySettingsDto,
  })
  @IsObject()
  @IsOptional()
  displaySettings?: DisplaySettingsDto;
}
