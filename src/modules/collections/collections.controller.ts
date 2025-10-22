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
  Query,
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
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Collections')
@Controller('collections')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiConsumes('application/json')
@ApiProduces('application/json')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new collection (Admin only)',
    description:
      'Creates a new collection with metadata, SEO settings, and display options. Supports automatic slug generation. Requires admin role.',
  })
  @ApiBody({
    type: CreateCollectionDto,
    description:
      'Collection data including name, description, metadata, and settings',
    examples: {
      'basic-collection': {
        summary: 'Basic Collection',
        description: 'Example of a basic collection',
        value: {
          name: 'Summer Collection 2024',
          description: 'Our latest summer collection featuring trendy designs',
          metadata: {
            category: 'Fashion',
            brand: 'TrendyBrand',
            season: 'Summer',
            year: 2024,
            tags: ['summer', 'fashion', 'trendy'],
          },
          displaySettings: {
            featured: true,
            showInNavigation: true,
            sortOrder: 'name',
            sortDirection: 'asc',
          },
        },
      },
      'seo-optimized': {
        summary: 'SEO Optimized Collection',
        description: 'Example with SEO settings',
        value: {
          name: 'Winter Essentials',
          description: 'Essential winter items for cold weather',
          slug: 'winter-essentials-2024',
          seo: {
            title: 'Winter Essentials Collection - Best Cold Weather Items',
            description: 'Discover our curated winter essentials collection',
            keywords: ['winter', 'essentials', 'cold weather', 'collection'],
          },
          displaySettings: {
            featured: false,
            showInNavigation: true,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Collection created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        name: { type: 'string', example: 'Summer Collection 2024' },
        slug: { type: 'string', example: 'summer-collection-2024' },
        isActive: { type: 'boolean', example: true },
        productCount: { type: 'number', example: 0 },
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
    status: 403,
    description: 'Forbidden - Admin access required',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Admin access required' },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Collection name or slug already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Collection name already exists' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCollectionDto: CreateCollectionDto) {
    return this.collectionsService.create(createCollectionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all collections',
    description:
      'Retrieves all collections with optional filtering by status, featured status, and other criteria. Supports pagination and sorting.',
  })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Filter by active status (true/false)',
    example: true,
  })
  @ApiQuery({
    name: 'featured',
    required: false,
    type: Boolean,
    description: 'Filter by featured status (true/false)',
    example: true,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by collection category',
    example: 'Fashion',
  })
  @ApiQuery({
    name: 'brand',
    required: false,
    type: String,
    description: 'Filter by collection brand',
    example: 'TrendyBrand',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort by field (name, createdAt, updatedAt, productCount)',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    description: 'Sort order (asc/desc)',
    example: 'desc',
  })
  @ApiResponse({
    status: 200,
    description: 'Collections retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'Summer Collection 2024' },
          description: {
            type: 'string',
            example: 'Our latest summer collection featuring trendy designs',
          },
          slug: { type: 'string', example: 'summer-collection-2024' },
          isActive: { type: 'boolean', example: true },
          productCount: { type: 'number', example: 5 },
          metadata: {
            type: 'object',
            properties: {
              category: { type: 'string', example: 'Fashion' },
              brand: { type: 'string', example: 'TrendyBrand' },
              season: { type: 'string', example: 'Summer' },
              year: { type: 'number', example: 2024 },
              tags: {
                type: 'array',
                items: { type: 'string' },
                example: ['summer', 'fashion', 'trendy'],
              },
            },
          },
          seo: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                example: 'Summer Collection 2024 - Trendy Fashion',
              },
              description: {
                type: 'string',
                example: 'Discover our latest summer collection',
              },
              keywords: {
                type: 'array',
                items: { type: 'string' },
                example: ['summer', 'fashion', 'collection'],
              },
            },
          },
          displaySettings: {
            type: 'object',
            properties: {
              featured: { type: 'boolean', example: true },
              showInNavigation: { type: 'boolean', example: true },
              sortOrder: { type: 'string', example: 'name' },
              sortDirection: { type: 'string', example: 'asc' },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async findAll(
    @Query('active') active?: boolean,
    @Query('featured') featured?: boolean,
  ) {
    if (featured === true) {
      return this.collectionsService.findFeatured();
    }
    if (active === true) {
      return this.collectionsService.findActive();
    }
    return this.collectionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get collection by ID',
    description:
      'Retrieves a specific collection with all its details including products',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the collection',
    example: '507f1f77bcf86cd799439011',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        name: { type: 'string', example: 'Summer Collection 2024' },
        description: {
          type: 'string',
          example: 'Our latest summer collection featuring trendy designs',
        },
        slug: { type: 'string', example: 'summer-collection-2024' },
        isActive: { type: 'boolean', example: true },
        productCount: { type: 'number', example: 5 },
        metadata: {
          type: 'object',
          properties: {
            category: { type: 'string', example: 'Fashion' },
            brand: { type: 'string', example: 'TrendyBrand' },
            season: { type: 'string', example: 'Summer' },
            year: { type: 'number', example: 2024 },
            tags: {
              type: 'array',
              items: { type: 'string' },
              example: ['summer', 'fashion', 'trendy'],
            },
          },
        },
        seo: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              example: 'Summer Collection 2024 - Trendy Fashion',
            },
            description: {
              type: 'string',
              example: 'Discover our latest summer collection',
            },
            keywords: {
              type: 'array',
              items: { type: 'string' },
              example: ['summer', 'fashion', 'collection'],
            },
          },
        },
        displaySettings: {
          type: 'object',
          properties: {
            featured: { type: 'boolean', example: true },
            showInNavigation: { type: 'boolean', example: true },
            sortOrder: { type: 'string', example: 'name' },
            sortDirection: { type: 'string', example: 'asc' },
          },
        },
        products: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
              title: { type: 'string', example: 'Summer T-Shirt' },
              description: {
                type: 'string',
                example: 'Lightweight summer t-shirt',
              },
              type: { type: 'string', enum: ['physical', 'digital'] },
              status: { type: 'string', enum: ['draft', 'published'] },
              purchasable: { type: 'boolean', example: true },
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
    description: 'Invalid collection ID format',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid collection ID format' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Collection not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    return this.collectionsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get collection by slug',
    description: 'Retrieves a collection by its URL-friendly slug',
  })
  @ApiParam({
    name: 'slug',
    description: 'URL-friendly slug of the collection',
    example: 'summer-collection-2024',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found',
  })
  async findBySlug(@Param('slug') slug: string) {
    return this.collectionsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update collection by ID (Admin only)',
    description:
      'Updates an existing collection. All fields are optional. Requires admin role.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the collection to update',
    example: '507f1f77bcf86cd799439011',
    type: 'string',
  })
  @ApiBody({
    type: UpdateCollectionDto,
    description: 'Partial collection data to update',
    examples: {
      'update-status': {
        summary: 'Update Collection Status',
        description: 'Change collection active status',
        value: {
          isActive: false,
        },
      },
      'update-metadata': {
        summary: 'Update Metadata',
        description: 'Update collection metadata and SEO',
        value: {
          metadata: {
            category: 'Updated Category',
            brand: 'New Brand',
            season: 'Winter',
            year: 2024,
            tags: ['updated', 'tags', 'winter'],
          },
          seo: {
            title: 'Updated SEO Title',
            description: 'Updated SEO description',
            keywords: ['updated', 'seo', 'keywords'],
          },
        },
      },
      'update-display-settings': {
        summary: 'Update Display Settings',
        description: 'Update collection display and navigation settings',
        value: {
          displaySettings: {
            featured: true,
            showInNavigation: true,
            sortOrder: 'productCount',
            sortDirection: 'desc',
          },
        },
      },
      'update-basic-info': {
        summary: 'Update Basic Information',
        description: 'Update collection name, description, and slug',
        value: {
          name: 'Updated Collection Name',
          description: 'Updated collection description',
          slug: 'updated-collection-slug',
        },
      },
      'add-products': {
        summary: 'Add Products to Collection',
        description: 'Add products to the collection',
        value: {
          products: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Collection updated successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        name: { type: 'string', example: 'Updated Collection Name' },
        description: {
          type: 'string',
          example: 'Updated collection description',
        },
        slug: { type: 'string', example: 'updated-collection-slug' },
        isActive: { type: 'boolean', example: true },
        productCount: { type: 'number', example: 3 },
        message: { type: 'string', example: 'Collection updated successfully' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or invalid collection ID',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['name must be at least 2 characters long'],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Collection not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Collection name or slug already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Collection name already exists' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto,
  ) {
    return this.collectionsService.update(id, updateCollectionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete collection by ID (Admin only)',
    description:
      'Permanently deletes a collection. Cannot delete collections that contain products. Requires admin role.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the collection to delete',
    example: '507f1f77bcf86cd799439011',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Collection deleted successfully' },
        deletedCollectionId: {
          type: 'string',
          example: '507f1f77bcf86cd799439011',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid collection ID format',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid collection ID format' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Collection not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Collection not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Cannot delete collection with products',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example:
            'Cannot delete collection with products. Remove all products first.',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.collectionsService.remove(id);
    return { message: 'Collection deleted successfully' };
  }

  @Post(':id/products/:productId')
  @ApiOperation({
    summary: 'Add product to collection',
    description: 'Adds a product to a collection',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the collection',
    example: '507f1f77bcf86cd799439011',
    type: 'string',
  })
  @ApiParam({
    name: 'productId',
    description: 'MongoDB ObjectId of the product to add',
    example: '507f1f77bcf86cd799439012',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Product added to collection successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        name: { type: 'string', example: 'Summer Collection 2024' },
        productCount: { type: 'number', example: 6 },
        message: {
          type: 'string',
          example: 'Product added to collection successfully',
        },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid collection or product ID',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Invalid collection or product ID',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Collection or product not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Collection or product not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Product is already in this collection',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Product is already in this collection',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async addProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    return this.collectionsService.addProduct(id, productId);
  }

  @Delete(':id/products/:productId')
  @ApiOperation({
    summary: 'Remove product from collection',
    description: 'Removes a product from a collection',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the collection',
    example: '507f1f77bcf86cd799439011',
    type: 'string',
  })
  @ApiParam({
    name: 'productId',
    description: 'MongoDB ObjectId of the product to remove',
    example: '507f1f77bcf86cd799439012',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Product removed from collection successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        name: { type: 'string', example: 'Summer Collection 2024' },
        productCount: { type: 'number', example: 4 },
        message: {
          type: 'string',
          example: 'Product removed from collection successfully',
        },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid collection or product ID',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Invalid collection or product ID',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Collection or product not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Collection or product not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async removeProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    return this.collectionsService.removeProduct(id, productId);
  }
}
