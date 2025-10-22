import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProductType, ProductStatus } from '../enums/product.enum';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    required: true,
    enum: ProductType,
    default: ProductType.PHYSICAL,
  })
  type: ProductType;

  @Prop({
    required: true,
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Prop({ type: Types.ObjectId, ref: 'Collection' })
  collectionId?: Types.ObjectId;

  @Prop({ type: Object })
  shippingModel?: {
    name: string;
    description?: string;
    weight?: number;
    dimensions?: {
      width: number;
      height: number;
      length: number;
    };
  };

  @Prop({ trim: true })
  fileUrl?: string;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        values: { type: [String], required: true },
      },
    ],
    default: [],
  })
  variants: Array<{
    name: string;
    values: string[];
  }>;

  @Prop({ type: [Types.ObjectId], ref: 'SKU', default: [] })
  skus: Types.ObjectId[];

  @Prop({ default: false })
  purchasable: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
