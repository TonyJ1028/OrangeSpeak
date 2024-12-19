import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '用户登录' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 201, 
    description: '登录成功',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'JWT token' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '用户ID' },
            username: { type: 'string', description: '用户名' },
            email: { type: 'string', description: '电子邮箱' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: '登录失败' })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      console.log('Login attempt:', loginDto);
      const result = await this.authService.login(loginDto);
      console.log('Login result:', result);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw new HttpException({
        status: HttpStatus.UNAUTHORIZED,
        error: error.message,
        details: error.stack,
      }, HttpStatus.UNAUTHORIZED);
    }
  }

  @ApiOperation({ summary: '用户注册' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: '注册成功',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'JWT token' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '用户ID' },
            username: { type: 'string', description: '用户名' },
            email: { type: 'string', description: '电子邮箱' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '注册失败' })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      console.log('Register attempt:', registerDto);
      const result = await this.authService.register(registerDto);
      console.log('Register result:', result);
      return result;
    } catch (error) {
      console.error('Register error:', error);
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        error: error.message,
        details: error.stack,
      }, HttpStatus.BAD_REQUEST);
    }
  }
} 