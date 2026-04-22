import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role, SignupPortal, SystemRole, User } from '@prisma/client';

export interface CreateUserParams {
  email: string;
  plainPassword: string;
  firstName?: string;
  lastName?: string;
  signupPortal: SignupPortal;
  systemRole: SystemRole;
  role: Role;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: CreateUserParams): Promise<User> {
    const { email, plainPassword, firstName, lastName, signupPortal, systemRole, role } = params;
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);
    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        signupPortal,
        systemRole,
        role,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  // ── Password reset ────────────────────────────────────────────────────────

  async setPasswordResetToken(
    id: number,
    tokenHash: string,
    expiry: Date,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordResetToken: tokenHash, passwordResetExpiry: expiry },
    });
  }

  async findByPasswordResetToken(tokenHash: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { passwordResetToken: tokenHash },
    });
  }

  async clearPasswordResetToken(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordResetToken: null, passwordResetExpiry: null },
    });
  }

  // ── Email verification ────────────────────────────────────────────────────

  async setEmailVerifyToken(
    id: number,
    tokenHash: string,
    expiry: Date,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { emailVerifyToken: tokenHash, emailVerifyExpiry: expiry },
    });
  }

  async findByEmailVerifyToken(tokenHash: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { emailVerifyToken: tokenHash },
    });
  }

  async markEmailVerified(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });
  }
}
