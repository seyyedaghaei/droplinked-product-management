import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async seedAdminUser(): Promise<void> {
    try {
      // Check if admin user already exists
      const existingAdmin = await this.userModel
        .findOne({
          email: 'admin@droplinked.com',
        })
        .exec();

      if (existingAdmin) {
        this.logger.log('Admin user already exists');
        return;
      }

      // Create admin user
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);

      const adminUser = new this.userModel({
        email: 'admin@droplinked.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true,
        products: [],
        productCount: 0,
      });

      await adminUser.save();
      this.logger.log('Admin user created successfully');
      this.logger.log('Admin credentials:');
      this.logger.log('Email: admin@droplinked.com');
      this.logger.log('Password: admin123');
    } catch (error) {
      this.logger.error('Failed to seed admin user:', error);
      throw error;
    }
  }

  async seedTestUsers(): Promise<void> {
    try {
      const testUsers = [
        {
          email: 'user1@test.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User 1',
          role: UserRole.USER,
        },
        {
          email: 'user2@test.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User 2',
          role: UserRole.USER,
        },
      ];

      for (const userData of testUsers) {
        const existingUser = await this.userModel
          .findOne({
            email: userData.email,
          })
          .exec();

        if (!existingUser) {
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(
            userData.password,
            saltRounds,
          );

          const user = new this.userModel({
            ...userData,
            password: hashedPassword,
            isActive: true,
            products: [],
            productCount: 0,
          });

          await user.save();
          this.logger.log(`Test user created: ${userData.email}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to seed test users:', error);
      throw error;
    }
  }
}
