import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
  IsUrl,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType, ProductStatus } from '../enums/product.enum';

export class VariantDefinitionDto {
  @ApiProperty({ description: 'Variant name (e.g., color, size)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Available values for this variant',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  values: string[];
}

export class ShippingModelDto {
  @ApiProperty({ description: 'Shipping model name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Shipping model description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Weight in grams' })
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ description: 'Package dimensions' })
  @IsOptional()
  @IsObject()
  dimensions?: {
    width: number;
    height: number;
    length: number;
  };
}

export class CreateProductDto {
  @ApiProperty({ description: 'Product title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Product type',
    enum: ProductType,
    example: ProductType.PHYSICAL,
  })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiProperty({
    description: 'Product status',
    enum: ProductStatus,
    example: ProductStatus.DRAFT,
  })
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @ApiPropertyOptional({
    description: 'Product collection ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  collectionId?: string;

  @ApiPropertyOptional({
    description: 'Shipping model for physical products',
    type: ShippingModelDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingModelDto)
  shippingModel?: ShippingModelDto;

  @ApiPropertyOptional({
    description: 'File URL for digital products',
    example: 'https://example.com/file.pdf',
  })
  @IsUrl()
  @IsOptional()
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'Product variants',
    type: [VariantDefinitionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDefinitionDto)
  @IsOptional()
  variants?: VariantDefinitionDto[];
}
