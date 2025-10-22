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

- **Product Types**: Physical and Digital products
- **Product Status**: Draft and Published states with different validation rules
- **Variant System**: Support for multiple variant definitions (color, size, etc.)
- **SKU Auto-generation**: Automatic SKU creation based on variant combinations (full matrix logic)
- **Transactional Integrity**: All operations wrapped in MongoDB transactions with rollback
- **Business Validation**: Complex validation rules based on product status and type
- **Purchasable Logic**: Automatic calculation based on published status and SKU availability
- **Cascade Operations**: Automatic SKU deletion when products are deleted
- **Error Handling**: Proper HTTP status codes (400, 404, 409, 500)

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

🚧 **In Development** - Currently setting up project structure and documentation.

## Getting Started

*Instructions will be added as the project develops*

## API Documentation

*Swagger documentation will be available at `/api` once implemented*

## Testing

*Testing instructions will be added as tests are implemented*

## Contributing

*Contribution guidelines will be added as needed*
