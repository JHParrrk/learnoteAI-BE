import { Injectable, UnauthorizedException, BadRequestException, ConflictException, InternalServerErrorException} from '@nestjs/common';
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
  //  이메일 정규화
  const normalizedEmail = email.toLowerCase();

  //  비밀번호 정책 (클라이언트 실수 → 400)
  if (password.length < 8) {
    throw new BadRequestException('비밀번호는 8자 이상이어야 합니다.');
  }

  //  이메일 중복 체크 (상태 충돌 → 409)
  const { data: existingUser } = await this.supabase
    .getClient()
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingUser) {
    throw new ConflictException('이미 사용 중인 이메일입니다.');
  }

  // 4비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 10);

  // 5 DB 저장
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
    // 여기까지 왔다는 건 서버 쪽 문제
    throw new InternalServerErrorException('회원가입 중 오류가 발생했습니다.');
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
  };
}


  //  로그인 검증 (LocalStrategy가 호출)
  async validateUser(email: string, password: string) {
  //  이메일 정규화 (로그인 시)
  email = email.toLowerCase();

  const { data: user } = await this.supabase
    .getClient()
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  // 이메일이 없을경우
  if (!user) return null;
  // 비밀번호 불일치할경우
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  return user;
}

  //  JWT 발급
  login(user: any) {
  const payload = { sub: user.id, email: user.email };

  return {
    access_token: this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET, 
    }),
  };
}
}