import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { SKU as SkuSchema, SkuDocument } from './schemas/sku.schema';
import {
  Collection,
  CollectionDocument,
} from '../collections/schemas/collection.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateSkusDto } from './dto/update-sku.dto';
import { ProductType, ProductStatus } from './enums/product.enum';
import {
  ProductForValidation,
  PhysicalProduct,
  DigitalProduct,
  isPhysicalProduct,
  isDigitalProduct,
} from './types/product.types';
import { SKU } from './types/sku.types';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(SkuSchema.name) private skuModel: Model<SkuDocument>,
    @InjectModel(Collection.name)
    private collectionModel: Model<CollectionDocument>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    userId: Types.ObjectId,
  ): Promise<Product> {
    const session = await this.productModel.db.startSession();

    try {
      let savedProduct: ProductDocument;

      await session.withTransaction(async () => {
        // Validate product based on status and type
        this.validateProduct(createProductDto);

        // Validate collection exists if provided
        if (createProductDto.collectionId) {
          await this.validateCollectionExists(
            createProductDto.collectionId,
            session,
          );
        }

        // Create product
        const product = new this.productModel({
          ...createProductDto,
          userId,
          purchasable: false,
        });

        savedProduct = await product.save({ session });

        // Generate SKUs if variants are provided
        if (createProductDto.variants && createProductDto.variants.length > 0) {
          const skus = await this.generateSkus(
            savedProduct._id as Types.ObjectId,
            createProductDto.variants as Array<{
              name: string;
              values: string[];
            }>,
            session,
          );
          savedProduct.skus = skus.map((sku) => sku._id as Types.ObjectId);
          savedProduct.purchasable = this.calculatePurchasable(
            savedProduct,
            skus,
          );
          await savedProduct.save({ session });
        }

        // For published products, ensure at least one SKU exists
        if (savedProduct.status === ProductStatus.PUBLISHED) {
          const finalProduct = await this.productModel
            .findById(savedProduct._id)
            .session(session);
          if (!finalProduct.skus || finalProduct.skus.length === 0) {
            throw new BadRequestException(
              'Published products must have at least one SKU',
            );
          }
        }

        return savedProduct;
      });

      return this.productModel.findById(savedProduct._id).populate('skus');
    } finally {
      await session.endSession();
    }
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find().populate('skus').exec();
  }

  async findOne(id: string): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel
      .findById(id)
      .populate('skus')
      .exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: Types.ObjectId,
  ): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const session = await this.productModel.db.startSession();

    try {
      let updatedProduct: ProductDocument;

      await session.withTransaction(async () => {
        const product = await this.productModel.findById(id).session(session);
        if (!product) {
          throw new NotFoundException('Product not found');
        }

        // Check if user owns this product
        if (!product.userId.equals(userId)) {
          throw new BadRequestException(
            'You can only update your own products',
          );
        }

        // Validate updated product
        this.validateProduct({ ...product.toObject(), ...updateProductDto });

        // Validate collection exists if being updated
        if (updateProductDto.collectionId) {
          await this.validateCollectionExists(
            updateProductDto.collectionId,
            session,
          );
        }

        // Check if variants changed
        const variantsChanged = this.hasVariantsChanged(
          product.variants,
          updateProductDto.variants,
        );

        if (variantsChanged) {
          // Delete existing SKUs
          await this.skuModel
            .deleteMany({ productId: product._id })
            .session(session);

          // Generate new SKUs
          if (
            updateProductDto.variants &&
            updateProductDto.variants.length > 0
          ) {
            const skus = await this.generateSkus(
              product._id as Types.ObjectId,
              updateProductDto.variants as Array<{
                name: string;
                values: string[];
              }>,
              session,
            );
            updateProductDto.skus = skus.map(
              (sku) => sku._id as Types.ObjectId,
            );
          } else {
            updateProductDto.skus = [];
          }
        }

        // Update product
        Object.assign(product, updateProductDto);
        product.purchasable = this.calculatePurchasable(product, product.skus);
        updatedProduct = await product.save({ session });

        return updatedProduct;
      });
    } finally {
      await session.endSession();
    }

    return this.productModel.findById(id).populate('skus');
  }

  async remove(id: string, userId: Types.ObjectId): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const session = await this.productModel.db.startSession();

    try {
      await session.withTransaction(async () => {
        const product = await this.productModel.findById(id).session(session);
        if (!product) {
          throw new NotFoundException('Product not found');
        }

        // Check if user owns this product
        if (!product.userId.equals(userId)) {
          throw new BadRequestException(
            'You can only delete your own products',
          );
        }

        // Cascade delete SKUs
        await this.skuModel
          .deleteMany({ productId: product._id })
          .session(session);

        // Delete product
        await this.productModel.findByIdAndDelete(id).session(session);
      });
    } finally {
      await session.endSession();
    }
  }

  private validateProduct(product: ProductForValidation): void {
    // Draft products only need title, type, and status
    if (product.status === ProductStatus.DRAFT) {
      if (!product.title || !product.type || !product.status) {
        throw new BadRequestException(
          'Draft products require title, type, and status',
        );
      }
      return;
    }

    // Published products need full validation
    if (product.status === ProductStatus.PUBLISHED) {
      this.validatePublishedProduct(product);
    }
  }

  private validatePublishedProduct(product: ProductForValidation): void {
    if (!product.title || !product.description || !product.collectionId) {
      throw new BadRequestException(
        'Published products require title, description, and collection',
      );
    }

    if (isPhysicalProduct(product)) {
      this.validatePhysicalProduct(product);
    } else if (isDigitalProduct(product)) {
      this.validateDigitalProduct(product);
    }

    // SKU validation will be done after SKU generation
  }

  private validatePhysicalProduct(product: PhysicalProduct): void {
    if (!product.shippingModel) {
      throw new BadRequestException('Physical products require shipping model');
    }
  }

  private validateDigitalProduct(product: DigitalProduct): void {
    if (!product.fileUrl) {
      throw new BadRequestException('Digital products require file URL');
    }
  }

  private hasVariantsChanged(
    oldVariants: Array<{ name: string; values: string[] }>,
    newVariants: Array<{ name: string; values: string[] }>,
  ): boolean {
    if (!oldVariants && !newVariants) return false;
    if (!oldVariants || !newVariants) return true;
    if (oldVariants.length !== newVariants.length) return true;

    // Sort variants by name for consistent comparison
    const sortedOld = [...oldVariants].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    const sortedNew = [...newVariants].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    // Sort values within each variant for consistent comparison
    const normalizedOld = sortedOld.map((variant) => ({
      ...variant,
      values: [...variant.values].sort(),
    }));
    const normalizedNew = sortedNew.map((variant) => ({
      ...variant,
      values: [...variant.values].sort(),
    }));

    return JSON.stringify(normalizedOld) !== JSON.stringify(normalizedNew);
  }

  private async generateSkus(
    productId: Types.ObjectId,
    variants: Array<{ name: string; values: string[] }>,
    session: ClientSession,
  ): Promise<SkuDocument[]> {
    if (!variants || variants.length === 0) {
      return [];
    }

    // Generate all possible combinations
    const combinations = this.generateVariantCombinations(variants);

    // Check for duplicates
    const uniqueCombinations = new Set(
      combinations.map((combo) => JSON.stringify(combo)),
    );
    if (uniqueCombinations.size !== combinations.length) {
      throw new ConflictException('Duplicate variant combinations found');
    }

    // Create SKUs for each combination
    const skus = combinations.map((combination) => ({
      productId,
      variantCombination: new Map(Object.entries(combination)),
      price: 0, // Default price, should be set by user
      quantity: 0, // Default quantity, should be set by user
    }));

    return this.skuModel.insertMany(skus, { session });
  }

  async updateSkus(
    productId: string,
    updateSkusDto: UpdateSkusDto,
    userId: Types.ObjectId,
  ): Promise<Product> {
    const session = await this.productModel.db.startSession();

    try {
      let updatedProduct: ProductDocument;

      await session.withTransaction(async () => {
        // Validate product ID
        if (!Types.ObjectId.isValid(productId)) {
          throw new BadRequestException('Invalid product ID');
        }

        // Find the product and verify ownership
        const product = await this.productModel
          .findById(productId)
          .populate('skus')
          .session(session);

        if (!product) {
          throw new NotFoundException('Product not found');
        }

        // Check ownership
        if (!product.userId.equals(userId)) {
          throw new BadRequestException(
            'You can only update your own products',
          );
        }

        // Get current SKUs (they should be populated from the query above)
        if (!product.skus || product.skus.length === 0) {
          throw new BadRequestException('Product has no SKUs to update');
        }

        // Cast to SkuDocument array since we populated them in the query
        const currentSkus = product.skus as unknown as SkuDocument[];

        // Create a map of current SKUs by their variant combination
        const currentSkuMap = new Map<string, SkuDocument>();
        currentSkus.forEach((sku) => {
          const variantKey = JSON.stringify(sku.variantCombination);
          currentSkuMap.set(variantKey, sku);
        });

        // Process each SKU update
        for (const skuUpdate of updateSkusDto.skus) {
          const variantKey = JSON.stringify(skuUpdate.variantCombination);
          const existingSku = currentSkuMap.get(variantKey);

          if (!existingSku) {
            throw new BadRequestException(
              `SKU with variant combination ${variantKey} not found in product`,
            );
          }

          // Update the SKU with new values
          const updateData: any = {};
          if (skuUpdate.price !== undefined) {
            updateData.price = skuUpdate.price;
          }
          if (skuUpdate.quantity !== undefined) {
            updateData.quantity = skuUpdate.quantity;
          }

          if (Object.keys(updateData).length > 0) {
            await this.skuModel
              .findByIdAndUpdate(existingSku._id, updateData, { session })
              .exec();
          }
        }

        // Refresh the product with updated SKUs
        updatedProduct = await this.productModel
          .findById(productId)
          .populate('skus')
          .session(session);
      });

      return updatedProduct;
    } finally {
      await session.endSession();
    }
  }

  private generateVariantCombinations(
    variants: Array<{ name: string; values: string[] }>,
  ): Record<string, string>[] {
    if (variants.length === 0) return [{}];

    const combinations: Record<string, string>[] = [];

    function generate(index: number, current: Record<string, string>) {
      if (index === variants.length) {
        combinations.push({ ...current });
        return;
      }

      const variant = variants[index];
      for (const value of variant.values) {
        current[variant.name] = value;
        generate(index + 1, current);
      }
    }

    generate(0, {});
    return combinations;
  }

  private calculatePurchasable(
    product: Product,
    skus: SKU[] | SkuDocument[] | Types.ObjectId[],
  ): boolean {
    if (product.status !== ProductStatus.PUBLISHED) {
      return false;
    }

    if (!skus || skus.length === 0) {
      return false;
    }

    // If skus are ObjectIds, we can't check quantity directly
    // This method should be called with populated SKUs
    if (skus.length > 0 && 'quantity' in skus[0]) {
      return (skus as (SKU | SkuDocument)[]).some((sku) => sku.quantity > 0);
    }

    // If we only have ObjectIds, assume not purchasable until populated
    return false;
  }

  private async validateCollectionExists(
    collectionId: string,
    session: ClientSession,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(collectionId)) {
      throw new BadRequestException('Invalid collection ID format');
    }

    const collection = await this.collectionModel
      .findById(collectionId)
      .session(session);

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (!collection.isActive) {
      throw new BadRequestException('Collection is not active');
    }
  }
}
