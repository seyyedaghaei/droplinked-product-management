# System Architecture

## Overview

This document outlines the architecture for the Product Management Backend system, designed to handle complex product variants, SKU generation, and transactional operations.

## Core Concepts

### Product Types
- **Physical**: Requires shipping model and physical dimensions
- **Digital**: Requires file URL for digital delivery

### Product Status
- **Draft**: Minimal validation (title, type, status only)
- **Published**: Full validation with all required fields and collection reference

### Collections System
- **Collections**: Group products with metadata, SEO, and display settings
- **Collection Integration**: Published products must reference a valid collection
- **Collection Features**: Metadata, SEO optimization, display settings, filtering

### Variant System
- Products can have multiple variant definitions (e.g., color, size)
- SKUs are auto-generated for all possible variant combinations
- Full matrix logic ensures no missing combinations

### User Authentication & Authorization
- **JWT Authentication**: Secure token-based authentication system
- **User Registration**: User signup with email and password validation
- **User Login**: Secure login with password hashing using bcryptjs
- **Ownership Validation**: Users can only modify their own products
- **Custom Decorators**: Clean @CurrentUser() decorator for extracting authenticated user data

## Database Schema Design

### Collection Schema
```typescript
interface Collection {
  _id: ObjectId;
  name: string;
  description?: string;
  slug: string; // auto-generated from name
  isActive: boolean;
  products: ObjectId[]; // references to Product documents
  productCount: number; // calculated field
  metadata?: {
    category?: string;
    brand?: string;
    season?: string;
    year?: number;
    tags?: string[];
    [key: string]: any;
  };
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  displaySettings?: {
    featured?: boolean;
    showInNavigation?: boolean;
    sortOrder?: 'name' | 'createdAt' | 'updatedAt' | 'productCount';
    sortDirection?: 'asc' | 'desc';
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### User Schema
```typescript
interface User {
  _id: ObjectId;
  email: string; // unique
  password: string; // hashed with bcryptjs
  firstName: string;
  lastName: string;
  isActive: boolean; // default: true
  products: ObjectId[]; // references to Product documents
  productCount: number; // calculated field
  createdAt: Date;
  updatedAt: Date;
}
```

### Product Schema
```typescript
interface Product {
  _id: ObjectId;
  title: string;
  description?: string;
  type: 'physical' | 'digital';
  status: 'draft' | 'published';
  collectionId?: ObjectId; // reference to Collection
  userId: ObjectId; // reference to User (required)
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
2. **CollectionsService**: Collection management with metadata and SEO
3. **SkuService**: SKU generation, validation, and management
4. **ValidationService**: Business rule validation
5. **TransactionService**: MongoDB transaction management
6. **AuthService**: User authentication and JWT token management
7. **UsersService**: User management and profile operations

### Key Methods
- `createProduct()`: Create product with SKU generation
- `updateProduct()`: Update product with SKU regeneration if variants change
- `deleteProduct()`: Cascade delete product and all SKUs
- `generateSkus()`: Generate SKU matrix from variant definitions
- `validateProduct()`: Validate product based on status and type
- `calculatePurchasable()`: Determine if product is purchasable
- `register()`: User registration with password hashing
- `login()`: User authentication with JWT token generation
- `validateUser()`: JWT token validation and user extraction

## API Design

### Endpoints

**Products:**
- `POST /products` - Create product (requires authentication)
- `GET /products/:id` - Get product by ID
- `PATCH /products/:id` - Update product (requires authentication + ownership)
- `DELETE /products/:id` - Delete product (requires authentication + ownership)
- `PATCH /products/:id/skus` - Update product SKUs (requires authentication + ownership)
- `GET /products` - List products (with filtering)

**Collections:**
- `POST /collections` - Create collection
- `GET /collections/:id` - Get collection by ID

**Authentication:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /collections/slug/:slug` - Get collection by slug
- `PATCH /collections/:id` - Update collection
- `DELETE /collections/:id` - Delete collection
- `GET /collections` - List collections (with filtering)
- `POST /collections/:id/products/:productId` - Add product to collection
- `DELETE /collections/:id/products/:productId` - Remove product from collection

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
- Required: title, description, collectionId (valid collection reference)
- Physical: shipping model required
- Digital: file URL required
- Must have at least one SKU
- Collection must exist and be active

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
- User authentication and JWT token validation
- Ownership validation for product modification
- Custom decorator functionality

### Additional Tests
- Integration tests for API endpoints
- Test SKU generation scenarios
- Test transactional operations
- Test validation rules
- Test error handling
- Authentication flow testing
- Authorization testing with different users

## Authentication & Authorization

### JWT Implementation
- **Token Generation**: JWT tokens with user ID payload
- **Token Validation**: Passport JWT strategy with user lookup
- **Password Security**: bcryptjs hashing with salt rounds
- **Token Expiration**: 24-hour token lifetime

### Authorization Flow
1. **User Registration**: Email validation, password hashing, user creation
2. **User Login**: Credential validation, JWT token generation
3. **Protected Routes**: JWT guard validation on product modification endpoints
4. **Ownership Validation**: Users can only modify their own products
5. **Custom Decorators**: @CurrentUser() for clean user extraction

### Security Features
- **Password Hashing**: bcryptjs with 10 salt rounds
- **JWT Security**: Signed tokens with secret key
- **User Isolation**: Ownership-based access control
- **Input Validation**: DTO validation for all endpoints
- **Error Handling**: Secure error messages without sensitive data

## Database Configuration

### MongoDB Setup
- **Replica Set**: `rs0` for high availability
- **Authentication**: Username/password with keyfile security
- **Mongo Express**: Web UI for database management
- **Environment Variables**: Configurable credentials and settings

### Testing Status
- ✅ **Collections Module**: Full CRUD with metadata, SEO, and display settings
- ✅ **Products Module**: Complete product management with SKU generation
- ✅ **Integration**: Cross-module relationships and validation
- ✅ **MongoDB**: Replica set with authentication working
- ✅ **API Documentation**: Swagger UI with complete endpoint coverage
- ✅ **Unit Testing**: 42 comprehensive unit tests (ProductsService: 23, CollectionsService: 12, AppController: 7)
- ✅ **Test Coverage**: 37.24% overall, 55.79% ProductsService statements
- ✅ **All Tests Passing**: 42/42 tests with fast execution (~5 seconds)

## Future Considerations

- Caching strategy for frequently accessed products
- Search and filtering capabilities
- Bulk operations for product management
- Audit logging for product changes
- Advanced integration testing with real database
- Controller testing for API endpoints
