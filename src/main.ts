import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS 설정
  app.enableCors({
    origin: true, // 모든 도메인 허용
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // 쿠키나 인증 헤더 허용 시 필요
  });

  // 요청 로깅 추가
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('LearnoteAI API')
    .setDescription('API documentation for LearnoteAI')
    .setVersion('1.0')
    .addTag('dashboard', 'Endpoints related to user dashboard')
    .addTag('notes', 'Endpoints related to user notes')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
