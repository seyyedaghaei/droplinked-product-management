import { Types } from 'mongoose';
import { ProductType, ProductStatus } from '../enums/product.enum';

export interface BaseProduct {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  status: ProductStatus;
  collectionId?: Types.ObjectId;
  variants?: Array<{
    name: string;
    values: string[];
  }>;
  skus?: Types.ObjectId[];
  purchasable?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PhysicalProduct extends BaseProduct {
  type: ProductType.PHYSICAL;
  shippingModel: {
    name: string;
    description?: string;
    weight?: number;
    dimensions?: {
      width: number;
      height: number;
      length: number;
    };
  };
  fileUrl?: never; // Physical products don't have file URLs
}

export interface DigitalProduct extends BaseProduct {
  type: ProductType.DIGITAL;
  fileUrl: string;
  shippingModel?: never; // Digital products don't have shipping models
}

export type Product = PhysicalProduct | DigitalProduct;

export interface DraftProduct {
  _id?: Types.ObjectId;
  title: string;
  type: ProductType;
  status: ProductStatus.DRAFT;
  description?: string;
  collectionId?: Types.ObjectId;
  shippingModel?: PhysicalProduct['shippingModel'];
  fileUrl?: string;
  variants?: Array<{
    name: string;
    values: string[];
  }>;
  skus?: Types.ObjectId[];
  purchasable?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PublishedProduct extends BaseProduct {
  type: ProductType;
  status: ProductStatus.PUBLISHED;
  description: string; // Required for published products
  collectionId: Types.ObjectId; // Required for published products
  skus: Types.ObjectId[]; // Must have at least one SKU
}

export interface ProductForValidation {
  _id?: Types.ObjectId | string | unknown;
  title: string;
  type: ProductType;
  status: ProductStatus;
  description?: string;
  collectionId?: Types.ObjectId | string;
  shippingModel?: PhysicalProduct['shippingModel'];
  fileUrl?: string;
  variants?: Array<{
    name: string;
    values: string[];
  }>;
  skus?: Types.ObjectId[];
  purchasable?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Type guards for runtime type checking
export function isPhysicalProduct(
  product: ProductForValidation,
): product is PhysicalProduct {
  return product.type === ProductType.PHYSICAL;
}

export function isDigitalProduct(
  product: ProductForValidation,
): product is DigitalProduct {
  return product.type === ProductType.DIGITAL;
}

export function isDraftProduct(
  product: ProductForValidation,
): product is DraftProduct {
  return product.status === ProductStatus.DRAFT;
}

export function isPublishedProduct(
  product: ProductForValidation,
): product is PublishedProduct {
  return product.status === ProductStatus.PUBLISHED;
}
