import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import {
  RequestWithUser,
  RequestWithUserEntity,
} from './interfaces/request-with-user.interface';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 회원가입
  @Post('signup')
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully signed up.',
    schema: {
      example: {
        id: 1,
        email: 'test@test.com',
        name: 'tester',
      },
    },
  })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto.email, dto.password, dto.name);
  }

  // 로그인
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in.',
    schema: {
      example: {
        access_token: 'jwt-token-example',
      },
    },
  })
  login(@Body() dto: LoginDto, @Req() req: RequestWithUserEntity) {
    return this.authService.login(req.user);
  }

  // JWT 테스트
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiResponse({
    status: 200,
    description: 'JWT validation successful.',
    schema: {
      example: {
        message: 'JWT works',
        user: {
          userId: 1,
          email: 'test@test.com',
        },
      },
    },
  })
  getMe(@Req() req: RequestWithUser) {
    return {
      message: 'JWT works',
      user: req.user,
    };
  }
}
