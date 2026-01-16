import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../common/entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private supabase: SupabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(email: string, password: string, name: string) {
    const normalizedEmail = email.toLowerCase();
    if (password.length < 8) {
      throw new BadRequestException('비밀번호는 8자 이상이어야 합니다.');
    }

    const { data: existingUser } = await this.supabase
      .getClient()
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUser)
      throw new ConflictException('이미 사용 중인 이메일입니다.');

    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await this.supabase
      .getClient()
      .from('users')
      .insert({ email: normalizedEmail, name, password: hashedPassword })
      .select()
      .single<User>();

    if (error || !data) {
      throw new InternalServerErrorException('회원가입 중 오류 발생');
    }
    return { id: data.id, email: data.email, name: data.name };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const { data: user } = await this.supabase
      .getClient()
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle<User>();

    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
        },
      );

      const accessToken = await this.jwtService.signAsync(
        { sub: payload.sub, email: payload.email },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
        },
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }
  }
}
