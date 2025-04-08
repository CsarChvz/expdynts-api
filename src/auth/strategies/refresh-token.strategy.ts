import { Injectable, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { AuthJwtPayload } from '../types/auth-jwtPayload';
import { AuthService } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const jwtSecret = configService.get<string>('REFRESH_JWT_SECRET');

    if (!jwtSecret) {
      throw new NotFoundException('JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh'),
      secretOrKey: jwtSecret, // Obtiene el secret directamente
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: AuthJwtPayload) {
    const userId = payload.sub;
    const refreshToken = req.body.refresh;

    return this.authService.validateRefreshToken(userId, refreshToken);
  }
}
