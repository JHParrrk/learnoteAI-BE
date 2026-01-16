import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { SignupDto } from './dto/signup.dto';
import {
  RequestWithUser,
  RequestWithUserEntity,
} from './interfaces/request-with-user.interface';
import { ApiTags, ApiBody } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto.email, dto.password, dto.name);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  login(@Req() req: RequestWithUserEntity) {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  @ApiBody({ schema: { example: { refreshToken: 'string' } } })
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(@Req() req: RequestWithUser) {
    return { message: 'JWT works', user: req.user };
  }
}
