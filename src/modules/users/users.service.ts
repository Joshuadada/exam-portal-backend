import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async create(createUserDto: any) {
    // Check if user already exists
    const existingUser = await this.repository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = await this.repository.create({
      ...createUserDto,
      password_hash,
    });

    return user;
  }

  async findByEmail(email: string) {
    return this.repository.findByEmail(email);
  }

  async findById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async validatePassword(user: any, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  async updatePassword(userId: string, newPassword: string) {
    const password_hash = await bcrypt.hash(newPassword, 10);
    return this.repository.updatePassword(userId, password_hash);
  }
}
