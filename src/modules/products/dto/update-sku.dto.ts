import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateSkuDto {
  @ApiProperty({
    description: 'Variant combination to identify the SKU',
    example: { color: 'red', size: 'L' },
  })
  @IsObject()
  variantCombination: Record<string, string>;

  @ApiProperty({
    description: 'New price for the SKU',
    example: 29.99,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiProperty({
    description: 'New quantity for the SKU',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;
}

export class UpdateSkusDto {
  @ApiProperty({
    description: 'Array of SKU updates',
    type: [UpdateSkuDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSkuDto)
  skus: UpdateSkuDto[];
}
