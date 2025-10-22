import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { Collection, CollectionDocument } from './schemas/collection.schema';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { CollectionForValidation } from './types/collection.types';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectModel(Collection.name)
    private collectionModel: Model<CollectionDocument>,
  ) {}

  async create(createCollectionDto: CreateCollectionDto): Promise<Collection> {
    const session = await this.collectionModel.db.startSession();

    try {
      let savedCollection: CollectionDocument;

      await session.withTransaction(async () => {
        // Validate collection data
        this.validateCollection(createCollectionDto);

        // Generate slug if not provided
        const slug =
          createCollectionDto.slug ||
          this.generateSlug(createCollectionDto.name);

        // Check for duplicate name or slug
        await this.checkForDuplicates(createCollectionDto.name, slug, session);

        // Create collection
        const collection = new this.collectionModel({
          ...createCollectionDto,
          slug,
          productCount: 0,
        });

        savedCollection = await collection.save({ session });
        return savedCollection;
      });

      return this.collectionModel.findById(savedCollection._id);
    } finally {
      await session.endSession();
    }
  }

  async findAll(): Promise<Collection[]> {
    return this.collectionModel
      .find()
      .populate('products', 'title type status purchasable')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findActive(): Promise<Collection[]> {
    return this.collectionModel
      .find({ isActive: true })
      .populate('products', 'title type status purchasable')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findFeatured(): Promise<Collection[]> {
    return this.collectionModel
      .find({
        isActive: true,
        'displaySettings.featured': true,
      })
      .populate('products', 'title type status purchasable')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Collection> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid collection ID');
    }

    const collection = await this.collectionModel
      .findById(id)
      .populate('products', 'title type status purchasable createdAt updatedAt')
      .exec();

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

  async findBySlug(slug: string): Promise<Collection> {
    const collection = await this.collectionModel
      .findOne({ slug })
      .populate('products', 'title type status purchasable createdAt updatedAt')
      .exec();

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

  async update(
    id: string,
    updateCollectionDto: UpdateCollectionDto,
  ): Promise<Collection> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid collection ID');
    }

    const session = await this.collectionModel.db.startSession();

    try {
      let updatedCollection: CollectionDocument;

      await session.withTransaction(async () => {
        const collection = await this.collectionModel
          .findById(id)
          .session(session);
        if (!collection) {
          throw new NotFoundException('Collection not found');
        }

        // Validate updated collection
        const updatedData = {
          ...collection.toObject(),
          ...updateCollectionDto,
        };
        this.validateCollection(updatedData);

        // Check for duplicate name or slug if they're being updated
        if (updateCollectionDto.name || updateCollectionDto.slug) {
          const name = updateCollectionDto.name || collection.name;
          const slug = updateCollectionDto.slug || collection.slug;
          await this.checkForDuplicates(name, slug, session, id);
        }

        // Update collection
        Object.assign(collection, updateCollectionDto);
        updatedCollection = await collection.save({ session });

        return updatedCollection;
      });

      return this.collectionModel
        .findById(id)
        .populate('products', 'title type status purchasable');
    } finally {
      await session.endSession();
    }
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid collection ID');
    }

    const session = await this.collectionModel.db.startSession();

    try {
      await session.withTransaction(async () => {
        const collection = await this.collectionModel
          .findById(id)
          .session(session);
        if (!collection) {
          throw new NotFoundException('Collection not found');
        }

        // Check if collection has products
        if (collection.products && collection.products.length > 0) {
          throw new ConflictException(
            'Cannot delete collection with products. Remove all products first.',
          );
        }

        // Delete collection
        await this.collectionModel.findByIdAndDelete(id).session(session);
      });
    } finally {
      await session.endSession();
    }
  }

  async addProduct(
    collectionId: string,
    productId: string,
  ): Promise<Collection> {
    if (
      !Types.ObjectId.isValid(collectionId) ||
      !Types.ObjectId.isValid(productId)
    ) {
      throw new BadRequestException('Invalid collection or product ID');
    }

    const session = await this.collectionModel.db.startSession();

    try {
      let updatedCollection: CollectionDocument;

      await session.withTransaction(async () => {
        const collection = await this.collectionModel
          .findById(collectionId)
          .session(session);
        if (!collection) {
          throw new NotFoundException('Collection not found');
        }

        // Check if product is already in collection
        if (collection.products.includes(new Types.ObjectId(productId))) {
          throw new ConflictException('Product is already in this collection');
        }

        // Add product to collection
        collection.products.push(new Types.ObjectId(productId));
        collection.productCount = collection.products.length;
        updatedCollection = await collection.save({ session });

        return updatedCollection;
      });

      return this.collectionModel
        .findById(collectionId)
        .populate('products', 'title type status purchasable');
    } finally {
      await session.endSession();
    }
  }

  async removeProduct(
    collectionId: string,
    productId: string,
  ): Promise<Collection> {
    if (
      !Types.ObjectId.isValid(collectionId) ||
      !Types.ObjectId.isValid(productId)
    ) {
      throw new BadRequestException('Invalid collection or product ID');
    }

    const session = await this.collectionModel.db.startSession();

    try {
      let updatedCollection: CollectionDocument;

      await session.withTransaction(async () => {
        const collection = await this.collectionModel
          .findById(collectionId)
          .session(session);
        if (!collection) {
          throw new NotFoundException('Collection not found');
        }

        // Remove product from collection
        collection.products = collection.products.filter(
          (id) => !id.equals(new Types.ObjectId(productId)),
        );
        collection.productCount = collection.products.length;
        updatedCollection = await collection.save({ session });

        return updatedCollection;
      });

      return this.collectionModel
        .findById(collectionId)
        .populate('products', 'title type status purchasable');
    } finally {
      await session.endSession();
    }
  }

  private validateCollection(collection: CollectionForValidation): void {
    if (!collection.name || collection.name.trim().length === 0) {
      throw new BadRequestException('Collection name is required');
    }

    if (collection.name.length < 2) {
      throw new BadRequestException(
        'Collection name must be at least 2 characters long',
      );
    }

    if (collection.name.length > 100) {
      throw new BadRequestException(
        'Collection name must be less than 100 characters',
      );
    }

    if (collection.description && collection.description.length > 500) {
      throw new BadRequestException(
        'Collection description must be less than 500 characters',
      );
    }
  }

  private async checkForDuplicates(
    name: string,
    slug: string,
    session: ClientSession,
    excludeId?: string,
  ): Promise<void> {
    const query: any = {
      $or: [{ name }, { slug }],
    };

    if (excludeId) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }

    const existing = await this.collectionModel.findOne(query).session(session);

    if (existing) {
      if (existing.name === name) {
        throw new ConflictException('Collection name already exists');
      }
      if (existing.slug === slug) {
        throw new ConflictException('Collection slug already exists');
      }
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }
}
