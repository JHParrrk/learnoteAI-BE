import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 회원가입
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(
      dto.email,
      dto.password,
      dto.name,
    );
  }

  // 로그인
  @UseGuards(AuthGuard('local'))
  @Post('login')
  login(@Body() dto: LoginDto, @Request() req) {
    // dto는 Validation용, 실제 인증은 local strategy가 함
    return this.authService.login(req.user);
  }

  // JWT 테스트
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(@Request() req) {
    return {
      message: 'JWT works',
      user: req.user,
    };
  }
}




