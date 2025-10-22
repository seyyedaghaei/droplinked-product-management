import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule, User, UserSchema, UserDocument } from '../users';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'your-super-secret-jwt-key-change-this-in-production',
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    {
      provide: JwtStrategy,
      useFactory: (
        userModel: Model<UserDocument>,
        configService: ConfigService,
      ) => {
        const secret =
          configService.get<string>('JWT_SECRET') ||
          'your-super-secret-jwt-key-change-this-in-production';
        return new JwtStrategy(userModel, secret);
      },
      inject: [getModelToken(User.name), ConfigService],
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
