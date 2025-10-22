import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiProduces,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateSkusDto } from './dto/update-sku.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Products')
@Controller('products')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiConsumes('application/json')
@ApiProduces('application/json')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new product',
    description:
      'Creates a new product with automatic SKU generation based on variants. Supports both physical and digital products with proper validation rules. Requires authentication.',
  })
  @ApiBody({
    type: CreateProductDto,
    description:
      'Product data including type, status, variants, collection reference, and product-specific fields',
    examples: {
      'physical-draft': {
        summary: 'Physical Draft Product',
        description: 'Example of a physical product in draft status',
        value: {
          title: 'Premium Cotton T-Shirt',
          type: 'physical',
          status: 'draft',
          description: 'High-quality cotton t-shirt with modern fit',
          variants: [
            { name: 'size', values: ['S', 'M', 'L', 'XL', 'XXL'] },
            {
              name: 'color',
              values: ['Red', 'Blue', 'Green', 'Black', 'White'],
            },
          ],
          shippingModel: {
            name: 'Standard Shipping',
            description: 'Standard delivery within 3-5 business days',
            weight: 200,
            dimensions: { width: 30, height: 40, length: 2 },
          },
        },
      },
      'physical-published': {
        summary: 'Physical Published Product',
        description:
          'Example of a physical product ready for sale with collection',
        value: {
          title: 'Designer Jeans',
          type: 'physical',
          status: 'published',
          description:
            'Premium denim jeans with modern cut and sustainable materials',
          collectionId: '507f1f77bcf86cd799439011',
          variants: [
            { name: 'size', values: ['28', '30', '32', '34', '36', '38'] },
            { name: 'color', values: ['Dark Blue', 'Light Blue', 'Black'] },
            { name: 'fit', values: ['Slim', 'Regular', 'Relaxed'] },
          ],
          shippingModel: {
            name: 'Express Shipping',
            description: 'Fast delivery within 1-2 business days',
            weight: 800,
            dimensions: { width: 35, height: 45, length: 3 },
          },
        },
      },
      'digital-published': {
        summary: 'Digital Published Product',
        description:
          'Example of a digital product ready for sale with collection',
        value: {
          title: 'Complete JavaScript Course',
          type: 'digital',
          status: 'published',
          description:
            'Comprehensive JavaScript programming course with 50+ hours of content',
          collectionId: '507f1f77bcf86cd799439012',
          fileUrl: 'https://example.com/javascript-course.zip',
        },
      },
      'digital-draft': {
        summary: 'Digital Draft Product',
        description: 'Example of a digital product in draft status',
        value: {
          title: 'Python Data Science Guide',
          type: 'digital',
          status: 'draft',
          description: 'Complete guide to data science with Python',
          fileUrl: 'https://example.com/python-guide.pdf',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'Premium Cotton T-Shirt' },
        description: {
          type: 'string',
          example: 'High-quality cotton t-shirt with modern fit',
        },
        type: { type: 'string', enum: ['physical', 'digital'] },
        status: { type: 'string', enum: ['draft', 'published'] },
        collectionId: { type: 'string', example: '507f1f77bcf86cd799439010' },
        purchasable: { type: 'boolean', example: false },
        variants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'size' },
              values: {
                type: 'array',
                items: { type: 'string' },
                example: ['S', 'M', 'L'],
              },
            },
          },
        },
        skus: {
          type: 'array',
          items: { type: 'string' },
          example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - Invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict - Duplicate variant combination or business rule violation',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Duplicate variant combination found',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user,
  ) {
    return this.productsService.create(createProductDto, user._id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all products',
    description:
      'Retrieves a list of all products with their basic information and SKU counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          title: { type: 'string', example: 'Premium Cotton T-Shirt' },
          description: {
            type: 'string',
            example: 'High-quality cotton t-shirt with modern fit',
          },
          type: { type: 'string', enum: ['physical', 'digital'] },
          status: { type: 'string', enum: ['draft', 'published'] },
          collectionId: { type: 'string', example: '507f1f77bcf86cd799439010' },
          purchasable: { type: 'boolean', example: true },
          skuCount: { type: 'number', example: 12 },
          variantCount: { type: 'number', example: 2 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description:
      'Retrieves a specific product with all its details including SKUs and variant information',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the product',
    example: '507f1f77bcf86cd799439011',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'Premium Cotton T-Shirt' },
        description: {
          type: 'string',
          example: 'High-quality cotton t-shirt with modern fit',
        },
        type: { type: 'string', enum: ['physical', 'digital'] },
        status: { type: 'string', enum: ['draft', 'published'] },
        collectionId: { type: 'string', example: '507f1f77bcf86cd799439010' },
        purchasable: { type: 'boolean', example: true },
        shippingModel: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Standard Shipping' },
            description: {
              type: 'string',
              example: 'Standard delivery within 3-5 business days',
            },
            weight: { type: 'number', example: 200 },
            dimensions: {
              type: 'object',
              properties: {
                width: { type: 'number', example: 30 },
                height: { type: 'number', example: 40 },
                length: { type: 'number', example: 2 },
              },
            },
          },
        },
        fileUrl: { type: 'string', example: 'https://example.com/file.pdf' },
        variants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'size' },
              values: {
                type: 'array',
                items: { type: 'string' },
                example: ['S', 'M', 'L', 'XL'],
              },
            },
          },
        },
        skus: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
              productId: {
                type: 'string',
                example: '507f1f77bcf86cd799439011',
              },
              variantCombination: {
                type: 'object',
                example: { size: 'M', color: 'Red' },
              },
              price: { type: 'number', example: 29.99 },
              quantity: { type: 'number', example: 10 },
              dimensions: {
                type: 'object',
                properties: {
                  width: { type: 'number', example: 30 },
                  height: { type: 'number', example: 40 },
                  length: { type: 'number', example: 2 },
                  weight: { type: 'number', example: 200 },
                },
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid product ID format',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid product ID format' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Product not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update product by ID',
    description:
      'Updates an existing product. If variants change, SKUs are automatically regenerated within a transaction. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the product to update',
    example: '507f1f77bcf86cd799439011',
    type: 'string',
  })
  @ApiBody({
    type: UpdateProductDto,
    description:
      'Partial product data to update. Only provided fields will be updated.',
    examples: {
      'update-status': {
        summary: 'Update Product Status',
        description: 'Change product from draft to published with collection',
        value: {
          status: 'published',
          description: 'Updated product description for published status',
          collectionId: '507f1f77bcf86cd799439010',
        },
      },
      'update-variants': {
        summary: 'Update Variants',
        description: 'Add new variant options (will regenerate SKUs)',
        value: {
          variants: [
            { name: 'size', values: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
            {
              name: 'color',
              values: ['Red', 'Blue', 'Green', 'Black', 'White', 'Gray'],
            },
            { name: 'material', values: ['Cotton', 'Polyester', 'Blend'] },
          ],
        },
      },
      'update-collection': {
        summary: 'Update Collection',
        description: 'Change product collection assignment',
        value: {
          collectionId: '507f1f77bcf86cd799439015',
        },
      },
      'update-shipping': {
        summary: 'Update Shipping Model',
        description: 'Update shipping information for physical products',
        value: {
          shippingModel: {
            name: 'Premium Shipping',
            description: 'Express delivery with tracking',
            weight: 250,
            dimensions: { width: 35, height: 45, length: 3 },
          },
        },
      },
      'update-digital': {
        summary: 'Update Digital Product',
        description: 'Update file URL for digital products',
        value: {
          fileUrl: 'https://example.com/updated-course.zip',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'Premium Cotton T-Shirt' },
        description: {
          type: 'string',
          example: 'High-quality cotton t-shirt with modern fit',
        },
        type: { type: 'string', enum: ['physical', 'digital'] },
        status: { type: 'string', enum: ['draft', 'published'] },
        collectionId: { type: 'string', example: '507f1f77bcf86cd799439010' },
        purchasable: { type: 'boolean', example: true },
        skuCount: { type: 'number', example: 20 },
        variantCount: { type: 'number', example: 3 },
        message: { type: 'string', example: 'Product updated successfully' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or invalid product ID',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Product not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Missing or invalid JWT token',
    schema: {
      example: {
        message: 'Unauthorized',
        statusCode: 401,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: You can only update your own products',
    schema: {
      example: {
        message: 'You can only update your own products',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict - Duplicate variant combination or business rule violation',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Duplicate variant combination found',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user,
  ) {
    return this.productsService.update(id, updateProductDto, user._id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete product by ID',
    description:
      'Permanently deletes a product and all its associated SKUs. This operation cannot be undone. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the product to delete',
    example: '507f1f77bcf86cd799439011',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Product deleted successfully' },
        deletedProductId: {
          type: 'string',
          example: '507f1f77bcf86cd799439011',
        },
        deletedSkusCount: { type: 'number', example: 12 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid product ID format',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid product ID format' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Missing or invalid JWT token',
    schema: {
      example: {
        message: 'Unauthorized',
        statusCode: 401,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: You can only delete your own products',
    schema: {
      example: {
        message: 'You can only delete your own products',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Product not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @CurrentUser() user) {
    await this.productsService.remove(id, user._id);
    return { message: 'Product deleted successfully' };
  }

  @Patch(':id/skus')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update product SKUs',
    description:
      'Updates quantity and price for specific SKUs of a product. Only the owner can update their product SKUs.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the product',
    example: '507f1f77bcf86cd799439011',
    type: 'string',
  })
  @ApiBody({
    type: UpdateSkusDto,
    description: 'SKU updates with new prices and quantities',
    examples: {
      example1: {
        summary: 'Update multiple SKUs',
        value: {
          skus: [
            {
              variantCombination: { color: 'red', size: 'L' },
              price: 29.99,
              quantity: 100,
            },
            {
              variantCombination: { color: 'blue', size: 'M' },
              price: 31.99,
              quantity: 50,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'SKUs updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        title: { type: 'string', example: 'Premium Cotton T-Shirt' },
        skus: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
              sku: { type: 'string', example: 'PROD-001-RED-L' },
              price: { type: 'number', example: 29.99 },
              quantity: { type: 'number', example: 100 },
              variantCombination: {
                type: 'object',
                example: { color: 'red', size: 'L' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid product ID or SKU not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example:
            'SKU with variant combination {"color":"red","size":"L"} not found in product',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Missing or invalid JWT token',
    schema: {
      example: {
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: You can only update your own products',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: {
          type: 'string',
          example: 'You can only update your own products',
        },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Product not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async updateSkus(
    @Param('id') id: string,
    @Body() updateSkusDto: UpdateSkusDto,
    @CurrentUser() user,
  ) {
    return this.productsService.updateSkus(id, updateSkusDto, user._id);
  }
}
