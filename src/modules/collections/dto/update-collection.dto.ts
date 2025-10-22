import { PartialType } from '@nestjs/mapped-types';
import { CreateCollectionDto } from './create-collection.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCollectionDto extends PartialType(CreateCollectionDto) {
  @ApiPropertyOptional({
    description: 'Array of Product ObjectIds to associate with the collection',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  products?: string[];
}
