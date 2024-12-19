import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    console.log('Finding user:', loginDto.username);
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
    });

    if (!user) {
      console.log('User not found:', loginDto.username);
      throw new UnauthorizedException('用户不存在');
    }

    console.log('Comparing passwords');
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', loginDto.username);
      throw new UnauthorizedException('密码错误');
    }

    console.log('Generating token for user:', user.id);
    const token = this.jwtService.sign({ userId: user.id });
    const result = {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
    console.log('Login successful:', result);
    return result;
  }

  async register(registerDto: RegisterDto) {
    console.log('Checking existing username:', registerDto.username);
    const existingUser = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      console.log('Username already exists:', registerDto.username);
      throw new BadRequestException('用户名已存在');
    }

    if (registerDto.email) {
      console.log('Checking existing email:', registerDto.email);
      const existingEmail = await this.userRepository.findOne({
        where: { email: registerDto.email },
      });
      if (existingEmail) {
        console.log('Email already exists:', registerDto.email);
        throw new BadRequestException('邮箱已被使用');
      }
    }

    console.log('Hashing password');
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.userRepository.create({
      username: registerDto.username,
      password: hashedPassword,
      email: registerDto.email,
    });

    console.log('Saving new user');
    await this.userRepository.save(user);

    console.log('Generating token for new user:', user.id);
    const token = this.jwtService.sign({ userId: user.id });
    const result = {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
    console.log('Registration successful:', result);
    return result;
  }
} 