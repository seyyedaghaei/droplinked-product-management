import { Types } from 'mongoose';

export interface BaseSKU {
  _id?: Types.ObjectId;
  productId: Types.ObjectId;
  variantCombination: Record<string, string>;
  price: number;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PhysicalSKU extends BaseSKU {
  dimensions: {
    width: number;
    height: number;
    length: number;
    weight: number;
  };
}

export interface DigitalSKU extends BaseSKU {
  dimensions?: never; // Digital SKUs don't have physical dimensions
}

export type SKU = PhysicalSKU | DigitalSKU;

// Type guards for runtime type checking
export function isPhysicalSKU(sku: SKU): sku is PhysicalSKU {
  return 'dimensions' in sku && sku.dimensions !== undefined;
}

export function isDigitalSKU(sku: SKU): sku is DigitalSKU {
  return !('dimensions' in sku) || sku.dimensions === undefined;
}
