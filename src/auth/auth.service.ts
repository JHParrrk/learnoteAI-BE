import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from '../common/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private supabase: SupabaseService,
    private jwtService: JwtService,
  ) {}

  // ✅ 회원가입
  async signup(email: string, password: string, name: string) {
    // ✅ 1. 서버에서 이메일 정규화
    email = email.toLowerCase();

    // (선택) 비밀번호 최소 길이 검증
    if (password.length < 8) {
      throw new BadRequestException('비밀번호는 8자 이상이어야 합니다.');
    }

    // ✅ 2. 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ 3. DB 저장
    const result = await this.supabase
      .getClient()
      .from('users')
      .insert({
        email,
        name,
        password: hashedPassword,
      })
      .select()
      .single();

    if (result.error) {
      throw new BadRequestException(result.error.message);
    }

    const createdUser = result.data as User;

    return {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
    };
  }

  // ✅ 로그인 검증 (LocalStrategy가 호출)
  async validateUser(email: string, password: string): Promise<User | null> {
    const result = await this.supabase
      .getClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (result.error || !result.data) return null;

    const user = result.data as User;

    if (!user.password) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
  }

  // ✅ JWT 발급
  login(user: User) {
    const payload = { sub: user.id, email: user.email };

    return {
      accessToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET, // ⭐ 여기!
      }),
    };
  }
}
