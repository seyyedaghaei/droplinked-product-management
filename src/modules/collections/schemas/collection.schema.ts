import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CollectionDocument = Collection & Document;

@Schema({ timestamps: true })
export class Collection {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  slug: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  metadata?: {
    tags?: string[];
    category?: string;
    brand?: string;
    season?: string;
    year?: number;
    [key: string]: any;
  };

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  products: Types.ObjectId[];

  @Prop({ default: 0 })
  productCount: number;

  @Prop({ type: Object })
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @Prop({ type: Object })
  displaySettings?: {
    sortOrder?: 'name' | 'createdAt' | 'updatedAt' | 'productCount';
    sortDirection?: 'asc' | 'desc';
    showInNavigation?: boolean;
    featured?: boolean;
  };
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);

// Create indexes for better performance
// Note: name index is already created by unique: true in @Prop
CollectionSchema.index({ slug: 1 });
CollectionSchema.index({ isActive: 1 });
CollectionSchema.index({ 'metadata.category': 1 });
CollectionSchema.index({ 'metadata.brand': 1 });
CollectionSchema.index({ createdAt: -1 });
