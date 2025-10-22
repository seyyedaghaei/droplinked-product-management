import { Types } from 'mongoose';

export interface BaseCollection {
  _id?: Types.ObjectId;
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
  metadata?: {
    tags?: string[];
    category?: string;
    brand?: string;
    season?: string;
    year?: number;
    [key: string]: any;
  };
  products?: Types.ObjectId[];
  productCount?: number;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  displaySettings?: {
    sortOrder?: 'name' | 'createdAt' | 'updatedAt' | 'productCount';
    sortDirection?: 'asc' | 'desc';
    showInNavigation?: boolean;
    featured?: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CollectionWithProducts extends BaseCollection {
  products: Types.ObjectId[];
  productCount: number;
}

export interface CollectionForValidation {
  _id?: Types.ObjectId | string | unknown;
  name: string;
  description?: string;
  slug?: string;
  isActive?: boolean;
  metadata?: {
    tags?: string[];
    category?: string;
    brand?: string;
    season?: string;
    year?: number;
    [key: string]: any;
  };
  products?: Types.ObjectId[] | string[];
  productCount?: number;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  displaySettings?: {
    sortOrder?: 'name' | 'createdAt' | 'updatedAt' | 'productCount';
    sortDirection?: 'asc' | 'desc';
    showInNavigation?: boolean;
    featured?: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Type guards for runtime type checking
export function isActiveCollection(
  collection: CollectionForValidation,
): boolean {
  return collection.isActive === true;
}

export function hasProducts(collection: CollectionForValidation): boolean {
  return (collection.products?.length || 0) > 0;
}

export function isFeaturedCollection(
  collection: CollectionForValidation,
): boolean {
  return collection.displaySettings?.featured === true;
}
