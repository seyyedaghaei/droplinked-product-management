# System Architecture

## Overview

This document outlines the architecture for the Product Management Backend system, designed to handle complex product variants, SKU generation, and transactional operations.

## Core Concepts

### Product Types
- **Physical**: Requires shipping model and physical dimensions
- **Digital**: Requires file URL for digital delivery

### Product Status
- **Draft**: Minimal validation (title, type, status only)
- **Published**: Full validation with all required fields

### Variant System
- Products can have multiple variant definitions (e.g., color, size)
- SKUs are auto-generated for all possible variant combinations
- Full matrix logic ensures no missing combinations

## Database Schema Design

### Product Schema
```typescript
interface Product {
  _id: ObjectId;
  title: string;
  description?: string;
  type: 'physical' | 'digital';
  status: 'draft' | 'published';
  collection?: string;
  collectionId?: ObjectId;
  shippingModel?: ShippingModel; // for physical products
  fileUrl?: string; // for digital products
  variants: VariantDefinition[];
  skus: ObjectId[]; // references to SKU documents
  purchasable: boolean; // calculated field
  createdAt: Date;
  updatedAt: Date;
}
```

### SKU Schema
```typescript
interface SKU {
  _id: ObjectId;
  productId: ObjectId;
  variantCombination: Record<string, string>; // e.g., {color: 'red', size: 'L'}
  price: number;
  quantity: number;
  dimensions?: PhysicalDimensions; // for physical products only
  createdAt: Date;
  updatedAt: Date;
}

interface PhysicalDimensions {
  width: number;
  height: number;
  length: number;
  weight: number;
}

interface VariantDefinition {
  name: string; // e.g., 'color', 'size'
  values: string[]; // e.g., ['red', 'blue'], ['S', 'M', 'L']
}
```

## Service Architecture

### Core Services
1. **ProductsService**: Main business logic for product operations
2. **SkuService**: SKU generation, validation, and management
3. **ValidationService**: Business rule validation
4. **TransactionService**: MongoDB transaction management

### Key Methods
- `createProduct()`: Create product with SKU generation
- `updateProduct()`: Update product with SKU regeneration if variants change
- `deleteProduct()`: Cascade delete product and all SKUs
- `generateSkus()`: Generate SKU matrix from variant definitions
- `validateProduct()`: Validate product based on status and type
- `calculatePurchasable()`: Determine if product is purchasable

## API Design

### Endpoints
- `POST /products` - Create product
- `GET /products/:id` - Get product by ID
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `GET /products` - List products (with filtering)

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Validation errors
- `404` - Product not found
- `409` - Conflicts (duplicate variants)
- `500` - Server errors

## Transactional Operations

All critical operations are wrapped in MongoDB transactions:
- Product creation with SKU generation
- Product updates with SKU regeneration
- Product deletion with cascade SKU deletion

## Validation Rules

### Draft Products
- Required: title, type, status
- Optional: all other fields

### Published Products
- Required: title, description, collection/collectionId
- Physical: shipping model required
- Digital: file URL required
- Must have at least one SKU

### SKU Validation
- Number of SKUs must match variant matrix (full matrix logic)
- No duplicate variant combinations
- All SKUs must have price and quantity
- Physical SKUs must have dimensions (width, height, length, weight)
- Each SKU must represent a unique combination of variant values

## Error Handling Strategy

- Comprehensive validation with detailed error messages
- Proper HTTP status codes for different error types
- Transaction rollback on any failure
- Graceful error responses with helpful messages

## Testing Strategy

### Required Unit Tests
- Product creation (draft and published scenarios)
- SKU validation and generation logic
- Product update with variant changes
- Cascade delete behavior
- Purchasable flag logic

### Additional Tests
- Integration tests for API endpoints
- Test SKU generation scenarios
- Test transactional operations
- Test validation rules
- Test error handling

## Future Considerations

- Caching strategy for frequently accessed products
- Search and filtering capabilities
- Bulk operations for product management
- Audit logging for product changes
- Performance optimization for large variant matrices
