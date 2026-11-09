import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import {JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtPayload } from "./types/jwt-payload.interface";
import { createHash, timingSafeEqual } from 'crypto';
import { ForbiddenException } from '@nestjs/common';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 7;

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    )  {}

    async register(dto: RegisterDto) {
        this.assertInviteCode(dto.inviteCode)
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const passwordHash = await argon2.hash(dto.password);

        const tenant = await this.prisma.tenant.create({
            data: {
                name: dto.tenantName,
                users: {
                    create: {
                        email: dto.email,
                        passwordHash,
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                        role: 'OWNER',
                    },
                },
            },
            include: { users: true },
        });
        const user = tenant.users[0];
        return this.issueTokens(user.id, tenant.id, user.role);
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } })

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.issueTokens(user.id, user.tenantId, user.role);
    }

    async refresh(refreshToken: string) {
        const tokenHash = this.hashToken(refreshToken);

        const stored = await this.prisma.refreshToken.findFirst({
            where: { tokenHash, revokedAt: null, expiresAt: {gt: new Date() } },
            include: { user: true },
        });

        if (!stored) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() },
        });

        return this.issueTokens(
          stored.user.id,
          stored.user.tenantId,
          stored.user.role,
        );
    }

    async logout(refreshToken: string) {
        const tokenHash = this.hashToken(refreshToken);
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                tenant: { select: { id: true, name: true } },
            },
        });
        if (!user) {
            throw new UnauthorizedException();
        }
        return user;
    }

    private async issueTokens(userId: string, tenantId: string, role: string) {
        const payload: JwtPayload = { sub: userId, tenantId, role };
         const accessToken = this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });
         const refreshToken = crypto.randomBytes(40).toString('hex');

         await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: this.hashToken(refreshToken),
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
            },
         });

         return { accessToken, refreshToken}
    }

    private hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    private assertInviteCode(provided?: string) {
        const required = process.env.REGISTRATION_INVITE_CODE?.trim();
        if (!required) return;

        const sha = (s: string) => createHash('sha256').update(s).digest();
        const ok = timingSafeEqual(sha(provided ?? ''), sha(required));
        if (!ok) {
            throw new ForbiddenException({
                code: 'INVALID_INVITE_CODE',
                message: 'Invalid invite code',
            });
        }
    }
}