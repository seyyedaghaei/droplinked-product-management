import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Model, Types, ClientSession } from 'mongoose';
import { ProductsService } from './products.service';
import { Product, ProductDocument } from './schemas/product.schema';
import { SKU as SkuSchema, SkuDocument } from './schemas/sku.schema';
import {
  Collection,
  CollectionDocument,
} from '../collections/schemas/collection.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductType, ProductStatus } from './enums/product.enum';

describe('ProductsService', () => {
  let service: ProductsService;
  let productModel: jest.Mocked<Model<ProductDocument>>;
  let skuModel: jest.Mocked<Model<SkuDocument>>;
  let collectionModel: jest.Mocked<Model<CollectionDocument>>;

  // Mock data
  const mockCollectionId = new Types.ObjectId();
  const mockProductId = new Types.ObjectId();
  const mockSkuId = new Types.ObjectId();

  const mockCollection = {
    _id: mockCollectionId,
    name: 'Test Collection',
    slug: 'test-collection',
    isActive: true,
    products: [],
    productCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserId = new Types.ObjectId();

  const mockProduct = {
    _id: mockProductId,
    title: 'Test Product',
    description: 'Test Description',
    type: ProductType.PHYSICAL,
    status: ProductStatus.DRAFT,
    collectionId: mockCollectionId,
    userId: mockUserId,
    variants: [
      { name: 'color', values: ['red', 'blue'] },
      { name: 'size', values: ['S', 'M', 'L'] },
    ],
    skus: [mockSkuId],
    purchasable: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSku = {
    _id: mockSkuId,
    productId: mockProductId,
    variantCombination: new Map([
      ['color', 'red'],
      ['size', 'M'],
    ]),
    price: 29.99,
    quantity: 10,
    dimensions: {
      width: 10,
      height: 5,
      length: 2,
      weight: 0.5,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock session
  const mockSession = {
    withTransaction: jest.fn(),
    endSession: jest.fn(),
  } as unknown as ClientSession;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: {
            db: {
              startSession: jest.fn().mockResolvedValue(mockSession),
            },
            findById: jest.fn(),
            find: jest.fn(),
            findByIdAndDelete: jest.fn(),
            insertMany: jest.fn(),
            deleteMany: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getModelToken(SkuSchema.name),
          useValue: {
            insertMany: jest.fn(),
            deleteMany: jest.fn(),
            findByIdAndUpdate: jest.fn(),
          },
        },
        {
          provide: getModelToken(Collection.name),
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productModel = module.get<Model<ProductDocument>>(
      getModelToken(Product.name),
    ) as jest.Mocked<Model<ProductDocument>>;
    skuModel = module.get<Model<SkuDocument>>(
      getModelToken(SkuSchema.name),
    ) as jest.Mocked<Model<SkuDocument>>;
    collectionModel = module.get<Model<CollectionDocument>>(
      getModelToken(Collection.name),
    ) as jest.Mocked<Model<CollectionDocument>>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw BadRequestException for published product without collection', async () => {
      const createProductDto: CreateProductDto = {
        title: 'Test Product',
        description: 'Test Description',
        type: ProductType.PHYSICAL,
        status: ProductStatus.PUBLISHED,
        shippingModel: {
          name: 'Standard Shipping',
        },
      };

      mockSession.withTransaction = jest
        .fn()
        .mockImplementation(async (callback) => {
          return await callback();
        });

      await expect(
        service.create(createProductDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(createProductDto, mockUserId),
      ).rejects.toThrow(
        'Published products require title, description, and collection',
      );
    });

    it('should throw BadRequestException for physical product without shipping model', async () => {
      const createProductDto: CreateProductDto = {
        title: 'Test Product',
        description: 'Test Description',
        type: ProductType.PHYSICAL,
        status: ProductStatus.PUBLISHED,
        collectionId: mockCollectionId.toString(),
      };

      mockSession.withTransaction = jest
        .fn()
        .mockImplementation(async (callback) => {
          return await callback();
        });

      await expect(
        service.create(createProductDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(createProductDto, mockUserId),
      ).rejects.toThrow('Physical products require shipping model');
    });

    it('should throw BadRequestException for digital product without file URL', async () => {
      const createProductDto: CreateProductDto = {
        title: 'Test Product',
        description: 'Test Description',
        type: ProductType.DIGITAL,
        status: ProductStatus.PUBLISHED,
        collectionId: mockCollectionId.toString(),
      };

      mockSession.withTransaction = jest
        .fn()
        .mockImplementation(async (callback) => {
          return await callback();
        });

      await expect(
        service.create(createProductDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(createProductDto, mockUserId),
      ).rejects.toThrow('Digital products require file URL');
    });

    it('should throw NotFoundException for invalid collection', async () => {
      const createProductDto: CreateProductDto = {
        title: 'Test Product',
        description: 'Test Description',
        type: ProductType.PHYSICAL,
        status: ProductStatus.PUBLISHED,
        collectionId: mockCollectionId.toString(),
        shippingModel: {
          name: 'Standard Shipping',
        },
      };

      (collectionModel.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(null),
      });

      mockSession.withTransaction = jest
        .fn()
        .mockImplementation(async (callback) => {
          return await callback();
        });

      await expect(
        service.create(createProductDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create(createProductDto, mockUserId),
      ).rejects.toThrow('Collection not found');
    });

    it('should throw BadRequestException for inactive collection', async () => {
      const createProductDto: CreateProductDto = {
        title: 'Test Product',
        description: 'Test Description',
        type: ProductType.PHYSICAL,
        status: ProductStatus.PUBLISHED,
        collectionId: mockCollectionId.toString(),
        shippingModel: {
          name: 'Standard Shipping',
        },
      };

      const inactiveCollection = { ...mockCollection, isActive: false };
      (collectionModel.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(inactiveCollection),
      });

      mockSession.withTransaction = jest
        .fn()
        .mockImplementation(async (callback) => {
          return await callback();
        });

      await expect(
        service.create(createProductDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(createProductDto, mockUserId),
      ).rejects.toThrow('Collection is not active');
    });
  });

  describe('update', () => {
    it('should throw BadRequestException for invalid product ID', async () => {
      const updateProductDto: UpdateProductDto = {
        title: 'Updated Product',
      };

      await expect(
        service.update('invalid-id', updateProductDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('invalid-id', updateProductDto, mockUserId),
      ).rejects.toThrow('Invalid product ID');
    });
  });

  describe('remove (Cascade Delete)', () => {
    it('should throw BadRequestException for invalid product ID', async () => {
      await expect(service.remove('invalid-id', mockUserId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove('invalid-id', mockUserId)).rejects.toThrow(
        'Invalid product ID',
      );
    });
  });

  describe('Purchasable Flag Logic', () => {
    it('should calculate purchasable as false for draft products', () => {
      const draftProduct = {
        ...mockProduct,
        status: ProductStatus.DRAFT,
      };

      const result = service['calculatePurchasable'](draftProduct, []);

      expect(result).toBe(false);
    });

    it('should calculate purchasable as false for published products without SKUs', () => {
      const publishedProduct = {
        ...mockProduct,
        status: ProductStatus.PUBLISHED,
      };

      const result = service['calculatePurchasable'](publishedProduct, []);

      expect(result).toBe(false);
    });

    it('should calculate purchasable as true for published products with available SKUs', () => {
      const publishedProduct = {
        ...mockProduct,
        status: ProductStatus.PUBLISHED,
      };

      const skusWithQuantity = [
        { quantity: 0 } as any,
        { quantity: 5 } as any,
        { quantity: 0 } as any,
      ];

      const result = service['calculatePurchasable'](
        publishedProduct,
        skusWithQuantity,
      );

      expect(result).toBe(true);
    });

    it('should calculate purchasable as false for published products with no available SKUs', () => {
      const publishedProduct = {
        ...mockProduct,
        status: ProductStatus.PUBLISHED,
      };

      const skusWithoutQuantity = [
        { quantity: 0 } as any,
        { quantity: 0 } as any,
      ];

      const result = service['calculatePurchasable'](
        publishedProduct,
        skusWithoutQuantity,
      );

      expect(result).toBe(false);
    });

    it('should calculate purchasable as false when SKUs are ObjectIds only', () => {
      const publishedProduct = {
        ...mockProduct,
        status: ProductStatus.PUBLISHED,
      };

      const skuObjectIds = [mockSkuId, new Types.ObjectId()];

      const result = service['calculatePurchasable'](
        publishedProduct,
        skuObjectIds,
      );

      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return all products with populated SKUs', async () => {
      const products = [mockProduct];
      (productModel.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(products),
        }),
      });

      const result = await service.findAll();

      expect(result).toEqual(products);
      expect(productModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return product by ID with populated SKUs', async () => {
      (productModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockProduct),
        }),
      });

      const result = await service.findOne(mockProductId.toString());

      expect(result).toEqual(mockProduct);
      expect(productModel.findById).toHaveBeenCalledWith(
        mockProductId.toString(),
      );
    });

    it('should throw NotFoundException for non-existent product', async () => {
      (productModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne(mockProductId.toString())).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(mockProductId.toString())).rejects.toThrow(
        'Product not found',
      );
    });

    it('should throw BadRequestException for invalid product ID', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Invalid product ID',
      );
    });
  });

  describe('Private Methods', () => {
    describe('hasVariantsChanged', () => {
      it('should return false when variants are the same', () => {
        const oldVariants = [
          { name: 'color', values: ['red', 'blue'] },
          { name: 'size', values: ['S', 'M'] },
        ];
        const newVariants = [
          { name: 'color', values: ['red', 'blue'] },
          { name: 'size', values: ['S', 'M'] },
        ];

        const result = service['hasVariantsChanged'](oldVariants, newVariants);

        expect(result).toBe(false);
      });

      it('should return false when variants are reordered but same', () => {
        const oldVariants = [
          { name: 'color', values: ['red', 'blue'] },
          { name: 'size', values: ['S', 'M'] },
        ];
        const newVariants = [
          { name: 'size', values: ['M', 'S'] }, // Different order
          { name: 'color', values: ['blue', 'red'] }, // Different order
        ];

        const result = service['hasVariantsChanged'](oldVariants, newVariants);

        expect(result).toBe(false);
      });

      it('should return true when variants are different', () => {
        const oldVariants = [
          { name: 'color', values: ['red', 'blue'] },
          { name: 'size', values: ['S', 'M'] },
        ];
        const newVariants = [
          { name: 'color', values: ['red', 'blue', 'green'] },
          { name: 'size', values: ['S', 'M'] },
        ];

        const result = service['hasVariantsChanged'](oldVariants, newVariants);

        expect(result).toBe(true);
      });

      it('should return true when one variant set is null', () => {
        const oldVariants = null;
        const newVariants = [{ name: 'color', values: ['red', 'blue'] }];

        const result = service['hasVariantsChanged'](oldVariants, newVariants);

        expect(result).toBe(true);
      });

      it('should return false when both variant sets are null', () => {
        const oldVariants = null;
        const newVariants = null;

        const result = service['hasVariantsChanged'](oldVariants, newVariants);

        expect(result).toBe(false);
      });
    });

    describe('generateVariantCombinations', () => {
      it('should generate all combinations for multiple variants', () => {
        const variants = [
          { name: 'color', values: ['red', 'blue'] },
          { name: 'size', values: ['S', 'M'] },
        ];

        const result = service['generateVariantCombinations'](variants);

        expect(result).toHaveLength(4);
        expect(result).toEqual([
          { color: 'red', size: 'S' },
          { color: 'red', size: 'M' },
          { color: 'blue', size: 'S' },
          { color: 'blue', size: 'M' },
        ]);
      });

      it('should generate combinations for single variant', () => {
        const variants = [{ name: 'color', values: ['red', 'blue', 'green'] }];

        const result = service['generateVariantCombinations'](variants);

        expect(result).toHaveLength(3);
        expect(result).toEqual([
          { color: 'red' },
          { color: 'blue' },
          { color: 'green' },
        ]);
      });

      it('should return empty array for no variants', () => {
        const variants = [];

        const result = service['generateVariantCombinations'](variants);

        expect(result).toEqual([{}]);
      });
    });
  });

  describe('updateSkus', () => {
    const mockUserId = new Types.ObjectId();
    const mockProductId = new Types.ObjectId();
    const mockSkuId1 = new Types.ObjectId();
    const mockSkuId2 = new Types.ObjectId();

    const mockProduct = {
      _id: mockProductId,
      userId: mockUserId,
      title: 'Test Product',
      skus: [
        {
          _id: mockSkuId1,
          variantCombination: { color: 'red', size: 'S' },
          price: 0,
          quantity: 0,
        },
        {
          _id: mockSkuId2,
          variantCombination: { color: 'blue', size: 'M' },
          price: 0,
          quantity: 0,
        },
      ],
    };

    const updateSkusDto = {
      skus: [
        {
          variantCombination: { color: 'red', size: 'S' },
          price: 29.99,
          quantity: 100,
        },
        {
          variantCombination: { color: 'blue', size: 'M' },
          price: 31.99,
          quantity: 50,
        },
      ],
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update SKUs successfully', async () => {
      const mockSession = {
        withTransaction: jest.fn().mockImplementation(async (callback) => {
          return await callback();
        }),
        endSession: jest.fn(),
      };

      const mockUpdatedProduct = {
        ...mockProduct,
        skus: [
          {
            ...mockProduct.skus[0],
            price: 29.99,
            quantity: 100,
          },
          {
            ...mockProduct.skus[1],
            price: 31.99,
            quantity: 50,
          },
        ],
      };

      (service['productModel'].db.startSession as jest.Mock).mockResolvedValue(
        mockSession,
      );
      (service['productModel'].findById as jest.Mock)
        .mockReturnValue({
          populate: jest.fn().mockReturnValue({
            session: jest.fn().mockResolvedValue(mockProduct),
          }),
        })
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            session: jest.fn().mockResolvedValue(mockProduct),
          }),
        })
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            session: jest.fn().mockResolvedValue(mockUpdatedProduct),
          }),
        });

      (service['skuModel'].findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      const result = await service.updateSkus(
        mockProductId.toString(),
        updateSkusDto,
        mockUserId,
      );

      expect(result).toEqual(mockUpdatedProduct);
      expect(service['skuModel'].findByIdAndUpdate).toHaveBeenCalledTimes(2);
      expect(service['skuModel'].findByIdAndUpdate).toHaveBeenCalledWith(
        mockSkuId1,
        { price: 29.99, quantity: 100 },
        { session: mockSession },
      );
      expect(service['skuModel'].findByIdAndUpdate).toHaveBeenCalledWith(
        mockSkuId2,
        { price: 31.99, quantity: 50 },
        { session: mockSession },
      );
    });

    it('should throw BadRequestException for invalid product ID', async () => {
      await expect(
        service.updateSkus('invalid-id', updateSkusDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateSkus('invalid-id', updateSkusDto, mockUserId),
      ).rejects.toThrow('Invalid product ID');
    });

    it('should throw NotFoundException when product not found', async () => {
      const mockSession = {
        withTransaction: jest.fn().mockImplementation(async (callback) => {
          return await callback();
        }),
        endSession: jest.fn(),
      };

      (service['productModel'].db.startSession as jest.Mock).mockResolvedValue(
        mockSession,
      );
      (service['productModel'].findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.updateSkus(mockProductId.toString(), updateSkusDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateSkus(mockProductId.toString(), updateSkusDto, mockUserId),
      ).rejects.toThrow('Product not found');
    });

    it('should throw BadRequestException when user is not the owner', async () => {
      const mockSession = {
        withTransaction: jest.fn().mockImplementation(async (callback) => {
          return await callback();
        }),
        endSession: jest.fn(),
      };

      const differentUserId = new Types.ObjectId();
      const productWithDifferentOwner = {
        ...mockProduct,
        userId: differentUserId,
      };

      (service['productModel'].db.startSession as jest.Mock).mockResolvedValue(
        mockSession,
      );
      (service['productModel'].findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(productWithDifferentOwner),
        }),
      });

      await expect(
        service.updateSkus(mockProductId.toString(), updateSkusDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateSkus(mockProductId.toString(), updateSkusDto, mockUserId),
      ).rejects.toThrow('You can only update your own products');
    });

    it('should throw BadRequestException when product has no SKUs', async () => {
      const mockSession = {
        withTransaction: jest.fn().mockImplementation(async (callback) => {
          return await callback();
        }),
        endSession: jest.fn(),
      };

      const productWithoutSkus = {
        ...mockProduct,
        skus: [],
      };

      (service['productModel'].db.startSession as jest.Mock).mockResolvedValue(
        mockSession,
      );
      (service['productModel'].findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(productWithoutSkus),
        }),
      });

      await expect(
        service.updateSkus(mockProductId.toString(), updateSkusDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateSkus(mockProductId.toString(), updateSkusDto, mockUserId),
      ).rejects.toThrow('Product has no SKUs to update');
    });

    it('should throw BadRequestException when SKU variant combination not found', async () => {
      const mockSession = {
        withTransaction: jest.fn().mockImplementation(async (callback) => {
          return await callback();
        }),
        endSession: jest.fn(),
      };

      const invalidUpdateDto = {
        skus: [
          {
            variantCombination: { color: 'green', size: 'XL' },
            price: 99.99,
            quantity: 10,
          },
        ],
      };

      (service['productModel'].db.startSession as jest.Mock).mockResolvedValue(
        mockSession,
      );
      (service['productModel'].findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          session: jest.fn().mockResolvedValue(mockProduct),
        }),
      });

      await expect(
        service.updateSkus(
          mockProductId.toString(),
          invalidUpdateDto,
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateSkus(
          mockProductId.toString(),
          invalidUpdateDto,
          mockUserId,
        ),
      ).rejects.toThrow(
        'SKU with variant combination {"color":"green","size":"XL"} not found in product',
      );
    });
  });
});
