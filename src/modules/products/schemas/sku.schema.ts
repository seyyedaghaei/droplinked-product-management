import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SkuDocument = SKU & Document;

@Schema({ timestamps: true })
export class SKU {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({
    type: Map,
    of: String,
    required: true,
  })
  variantCombination: Map<string, string>;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({
    type: {
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      length: { type: Number, min: 0 },
      weight: { type: Number, min: 0 },
    },
  })
  dimensions?: {
    width: number;
    height: number;
    length: number;
    weight: number;
  };
}

export const SkuSchema = SchemaFactory.createForClass(SKU);
