import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

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
  const hashedPassword = await bcrypt.hash(password, 10);

  // ✅ 3. DB 저장
  const { data, error } = await this.supabase
    .getClient()
    .from('users')
    .insert({
      email,
      name,
      password: hashedPassword,
    })
    .select()
    .single();

  if (error) {
    throw new BadRequestException(error.message);
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
  };
}

  // ✅ 로그인 검증 (LocalStrategy가 호출)
  async validateUser(email: string, password: string) {
    const { data: user } = await this.supabase.getClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
  }

  // ✅ JWT 발급
  login(user: any) {
  const payload = { sub: user.id, email: user.email };

  return {
    access_token: this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET, // ⭐ 여기!
    }),
  };
}
}