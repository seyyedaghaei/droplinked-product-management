import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Model, Types, ClientSession } from 'mongoose';
import { CollectionsService } from './collections.service';
import { Collection, CollectionDocument } from './schemas/collection.schema';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

describe('CollectionsService', () => {
  let service: CollectionsService;
  let collectionModel: jest.Mocked<Model<CollectionDocument>>;

  // Mock data
  const mockCollectionId = new Types.ObjectId();
  const mockProductId = new Types.ObjectId();

  const mockCollection = {
    _id: mockCollectionId,
    name: 'Test Collection',
    description: 'Test Description',
    slug: 'test-collection',
    isActive: true,
    products: [mockProductId],
    productCount: 1,
    metadata: {
      category: 'Fashion',
      brand: 'Test Brand',
      season: 'Summer',
      year: 2024,
      tags: ['new', 'trending'],
    },
    seo: {
      title: 'Test Collection SEO Title',
      description: 'Test Collection SEO Description',
      keywords: ['test', 'collection', 'fashion'],
    },
    displaySettings: {
      sortOrder: 'name',
      sortDirection: 'asc',
      showInNavigation: true,
      featured: true,
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
        CollectionsService,
        {
          provide: getModelToken(Collection.name),
          useValue: {
            db: {
              startSession: jest.fn().mockResolvedValue(mockSession),
            },
            findById: jest.fn(),
            find: jest.fn(),
            findByIdAndDelete: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            countDocuments: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
    collectionModel = module.get<Model<CollectionDocument>>(
      getModelToken(Collection.name),
    ) as jest.Mocked<Model<CollectionDocument>>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all collections', async () => {
      const collections = [mockCollection];
      (collectionModel.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(collections),
          }),
        }),
      });

      const result = await service.findAll();

      expect(result).toEqual(collections);
      expect(collectionModel.find).toHaveBeenCalled();
    });
  });

  describe('findActive', () => {
    it('should return active collections', async () => {
      const activeCollections = [mockCollection];
      (collectionModel.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(activeCollections),
          }),
        }),
      });

      const result = await service.findActive();

      expect(result).toEqual(activeCollections);
      expect(collectionModel.find).toHaveBeenCalledWith({ isActive: true });
    });
  });

  describe('findFeatured', () => {
    it('should return featured collections', async () => {
      const featuredCollections = [mockCollection];
      (collectionModel.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(featuredCollections),
          }),
        }),
      });

      const result = await service.findFeatured();

      expect(result).toEqual(featuredCollections);
      expect(collectionModel.find).toHaveBeenCalledWith({
        isActive: true,
        'displaySettings.featured': true,
      });
    });
  });

  describe('findOne', () => {
    it('should return collection by ID', async () => {
      (collectionModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCollection),
        }),
      });

      const result = await service.findOne(mockCollectionId.toString());

      expect(result).toEqual(mockCollection);
      expect(collectionModel.findById).toHaveBeenCalledWith(
        mockCollectionId.toString(),
      );
    });

    it('should throw NotFoundException for non-existent collection', async () => {
      (collectionModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        service.findOne(mockCollectionId.toString()),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne(mockCollectionId.toString()),
      ).rejects.toThrow('Collection not found');
    });

    it('should throw BadRequestException for invalid collection ID', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Invalid collection ID',
      );
    });
  });

  describe('findBySlug', () => {
    it('should return collection by slug', async () => {
      (collectionModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockCollection),
        }),
      });

      const result = await service.findBySlug('test-collection');

      expect(result).toEqual(mockCollection);
      expect(collectionModel.findOne).toHaveBeenCalledWith({
        slug: 'test-collection',
      });
    });

    it('should throw NotFoundException for non-existent slug', async () => {
      (collectionModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findBySlug('non-existent')).rejects.toThrow(
        'Collection not found',
      );
    });
  });

  describe('Private Methods', () => {
    describe('validateCollection', () => {
      it('should throw BadRequestException for empty name', () => {
        const invalidCollection = { name: '' };

        expect(() => service['validateCollection'](invalidCollection)).toThrow(
          BadRequestException,
        );
        expect(() => service['validateCollection'](invalidCollection)).toThrow(
          'Collection name is required',
        );
      });

      it('should throw BadRequestException for name too short', () => {
        const invalidCollection = { name: 'A' };

        expect(() => service['validateCollection'](invalidCollection)).toThrow(
          BadRequestException,
        );
        expect(() => service['validateCollection'](invalidCollection)).toThrow(
          'Collection name must be at least 2 characters long',
        );
      });

      it('should throw BadRequestException for name too long', () => {
        const invalidCollection = { name: 'A'.repeat(101) };

        expect(() => service['validateCollection'](invalidCollection)).toThrow(
          BadRequestException,
        );
        expect(() => service['validateCollection'](invalidCollection)).toThrow(
          'Collection name must be less than 100 characters',
        );
      });

      it('should throw BadRequestException for description too long', () => {
        const invalidCollection = {
          name: 'Valid Name',
          description: 'A'.repeat(501),
        };

        expect(() => service['validateCollection'](invalidCollection)).toThrow(
          BadRequestException,
        );
        expect(() => service['validateCollection'](invalidCollection)).toThrow(
          'Collection description must be less than 500 characters',
        );
      });

      it('should pass validation for valid collection', () => {
        const validCollection = {
          name: 'Valid Collection',
          description: 'Valid description',
        };

        expect(() =>
          service['validateCollection'](validCollection),
        ).not.toThrow();
      });
    });

    describe('generateSlug', () => {
      it('should generate slug from name', () => {
        const result = service['generateSlug']('Test Collection Name');
        expect(result).toBe('test-collection-name');
      });

      it('should handle special characters', () => {
        const result = service['generateSlug']('Test & Collection! Name@');
        expect(result).toBe('test-collection-name');
      });

      it('should handle multiple spaces', () => {
        const result = service['generateSlug']('Test    Collection   Name');
        expect(result).toBe('test-collection-name');
      });

      it('should handle multiple hyphens', () => {
        const result = service['generateSlug']('Test---Collection---Name');
        expect(result).toBe('test-collection-name');
      });

      it('should trim leading and trailing hyphens', () => {
        const result = service['generateSlug']('-Test Collection Name-');
        expect(result).toBe('test-collection-name');
      });
    });
  });
});
