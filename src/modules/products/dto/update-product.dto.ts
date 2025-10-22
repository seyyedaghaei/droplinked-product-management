import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { Types } from 'mongoose';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({
    description: 'Array of SKU ObjectIds to associate with the product',
    type: [String],
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
  })
  skus?: Types.ObjectId[];
}
