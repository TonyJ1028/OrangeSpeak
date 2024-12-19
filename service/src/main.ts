import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 配置 API 前缀
  app.setGlobalPrefix('api');
  
  // 配置 Swagger
  const config = new DocumentBuilder()
    .setTitle('OrangeSpeak API')
    .setDescription('OrangeSpeak 应用程序的 API 文档')
    .setVersion('1.0')
    .addTag('auth', '认证相关接口')
    .addTag('channels', '频道相关接口')
    .addTag('messages', '消息相关接口')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  // 将swagger文档保存为JSON文件
  fs.writeFileSync('./swagger.json', JSON.stringify(document, null, 2));
  
  // 设置swagger UI
  SwaggerModule.setup('api-docs', app, document);

  // 配置 CORS
  app.enableCors();
  
  // 配置全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  await app.listen(3000);
  console.log('Server is running on http://localhost:3000');
  console.log('API documentation is available at http://localhost:3000/api-docs');
  console.log('Swagger JSON has been generated at ./swagger.json');
}

bootstrap(); 