import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from '../users/dto/login.dto';
import { RegisterDto } from '../users/dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.register(registerDto);

    // Remove password from response
    const { password, ...userWithoutPassword } = (user as any).toObject
      ? (user as any).toObject()
      : user;

    return {
      user: userWithoutPassword,
      message: 'User registered successfully',
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.validateUser(loginDto);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: (user as any)._id,
    };

    const accessToken = this.jwtService.sign(payload);

    // Remove password from response
    const { password, ...userWithoutPassword } = (user as any).toObject
      ? (user as any).toObject()
      : user;

    return {
      user: userWithoutPassword,
      accessToken,
      message: 'Login successful',
    };
  }

  async validateToken(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
