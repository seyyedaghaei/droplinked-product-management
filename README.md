# Product Management Backend

A NestJS + MongoDB backend system for managing products with complex SKU handling and variant logic.

## Project Overview

This project implements a complete backend module for Product Management, supporting creation, editing, and deletion of products with automatic SKU handling and validation logic.

The focus is on:
- Architecture quality and code structure
- Data integrity and transactional logic
- Business validation implementation
- Code readability and maintainability

## Key Features

- **Product Types**: Physical and Digital products with collection integration
- **Collections Module**: Product collections with metadata, SEO, and display settings
- **Product Status**: Draft and Published states with different validation rules
- **Variant System**: Support for multiple variant definitions (color, size, etc.)
- **SKU Auto-generation**: Automatic SKU creation based on variant combinations (full matrix logic)
- **Transactional Integrity**: All operations wrapped in MongoDB transactions with rollback
- **Business Validation**: Complex validation rules based on product status and type
- **Purchasable Logic**: Automatic calculation based on published status and SKU availability
- **Cascade Operations**: Automatic SKU deletion when products are deleted
- **Error Handling**: Proper HTTP status codes (400, 404, 409, 500)
- **Database Security**: MongoDB replica set with authentication and keyfile security

## Technology Stack

- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **Language**: TypeScript
- **Testing**: Jest
- **Documentation**: Swagger/OpenAPI

## Deliverables

- Mongoose schema definitions for Product and SKU
- CRUD endpoints for Product (create, update, delete, get)
- SKU auto-generation and validation logic
- Transactional operations and cascade deletion
- Unit tests for core business logic
- Swagger documentation for all endpoints

## Project Status

✅ **Core Implementation Complete** - Product Management API with full CRUD operations, SKU generation, Collections module, and transactional integrity.

### What's Working:
- **Product Management**: Create, read, update, delete products with collection integration
- **Collections Module**: Full CRUD operations with metadata, SEO, and display settings
- **SKU Auto-generation**: Full matrix logic for variant combinations
- **Business Validation**: Draft vs published product rules with collection requirements
- **Transactional Operations**: MongoDB sessions with rollback
- **API Documentation**: Swagger UI at `/docs`
- **Database**: MongoDB with replica set, authentication, and Mongo Express

## Getting Started

### Prerequisites
- Node.js v20.19.5+
- Docker and Docker Compose
- Yarn package manager

### Quick Setup
```bash
# Install dependencies
yarn install

# Setup MongoDB with replica set and authentication
./setup-mongodb.sh

# Start development server
yarn start:dev
```

### Configuration
You can customize MongoDB credentials by editing the `.env` file or using environment variables:

```bash
# Copy example configuration
cp .env.example .env

# Edit configuration
nano .env
```

**Available Configuration Variables:**
- `MONGO_ROOT_USERNAME` / `MONGO_ROOT_PASSWORD`: MongoDB admin credentials
- `MONGO_APP_USERNAME` / `MONGO_APP_PASSWORD`: Application database user
- `MONGO_DATABASE`: Database name (default: product_management)
- `MONGO_EXPRESS_USERNAME` / `MONGO_EXPRESS_PASSWORD`: Mongo Express web UI credentials
- `REPLICA_SET_NAME`: MongoDB replica set name (default: rs0)

### MongoDB Configuration

The project uses MongoDB with:
- **Replica Set**: `rs0` for high availability
- **Authentication**: Username/password authentication
- **Mongo Express**: Web UI for database management

**Connection Details:**
- **Host**: localhost:27017
- **Database**: product_management
- **Username**: app_user
- **Password**: app_password
- **Mongo Express**: http://localhost:8081 (admin/admin)

**Manual Setup (if needed):**
```bash
# Start MongoDB with replica set
docker compose up -d mongodb

# Initialize replica set
docker exec product-management-mongodb mongosh --eval "
db = db.getSiblingDB('admin');
db.auth('admin', 'password');
rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]});
"

# Create application user
docker exec product-management-mongodb mongosh --eval "
db = db.getSiblingDB('admin');
db.auth('admin', 'password');
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    { role: 'readWrite', db: 'product_management' },
    { role: 'dbAdmin', db: 'product_management' }
  ]
});
"
```

### API Endpoints
- **Base URL**: `http://localhost:3000`
- **Products**: `GET/POST /products`, `GET/PATCH/DELETE /products/:id`
- **Collections**: `GET/POST /collections`, `GET/PATCH/DELETE /collections/:id`
- **Documentation**: `http://localhost:3000/docs`

## API Documentation

Swagger documentation is available at `http://localhost:3000/docs` with full endpoint descriptions, request/response schemas, and interactive testing.

## Testing

### ✅ **Comprehensive Testing Completed**

**Automated Unit Testing (42 tests passing):**
- **ProductsService**: 23 comprehensive unit tests covering product creation, SKU generation, variant handling, cascade deletes, and purchasable logic
- **CollectionsService**: 12 unit tests covering CRUD operations, validation, and private methods  
- **AppController**: 7 basic tests for core functionality
- **Coverage**: 37.24% overall, 55.79% ProductsService statements, 26.78% CollectionsService statements
- **All Tests Passing**: 42/42 tests with fast execution (~5 seconds)

**Manual Testing Completed:**
- ✅ Collections Module: CRUD operations, filtering, metadata, SEO, slug generation
- ✅ Products Module: Product creation, SKU generation, variant matrix logic, collection integration
- ✅ Integration: Cross-module relationships, business rule validation, MongoDB authentication
- ✅ API Documentation: Swagger UI at `/docs` with interactive testing

**Test Data Created:**
- **2 Collections**: Summer Collection 2024 (featured) and Winter Essentials
- **2 Products**: Premium Cotton T-Shirt (draft) and Designer Jeans (published)
- **20 SKUs Total**: Generated across products with proper variant combinations

**Running Tests:**
```bash
# Run all tests
yarn test

# Run with coverage
yarn test:cov

# Run specific test suite
yarn test --testPathPattern=products.service.spec.ts
```

## Contributing

*Contribution guidelines will be added as needed*
