import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { RolePermissionMatrix } from '../constants/permissions';

export interface JwtPayload {
  sub: number;
  email: string;
  systemRole?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret || secret === 'your-super-secret-jwt-key-change-in-production') {
      throw new Error(
        'JWT_SECRET is not set or is using the default placeholder. Set a strong secret in .env before starting.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedException('Account not found or disabled');
    // Strip all sensitive / internal fields before attaching to req.user
    const {
      passwordHash: _ph,
      passwordResetToken: _prt,
      passwordResetExpiry: _pre,
      emailVerifyToken: _evt,
      emailVerifyExpiry: _eve,
      ...result
    } = user;
    return {
      ...result,
      permissions: RolePermissionMatrix[result.systemRole] ?? [],
    };
  }
}
