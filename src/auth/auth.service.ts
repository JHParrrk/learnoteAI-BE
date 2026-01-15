import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private supabase: SupabaseService,
    private jwtService: JwtService,
  ) {}

  // 회원가입
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

    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await this.supabase
      .getClient()
      .from('users')
      .insert({
        email: normalizedEmail,
        name,
        password: hashedPassword,
      })
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException('회원가입 중 오류가 발생했습니다.');
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
    };
  }

  async validateUser(email: string, password: string) {
    email = email.toLowerCase();

    const { data: user } = await this.supabase
      .getClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
  }

  login(user: any) {
    const payload = { sub: user.id, email: user.email };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
      }),
    };
  }
}
