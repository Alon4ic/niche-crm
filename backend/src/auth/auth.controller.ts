import { Body, Controller, Post, UseGuards, Get, Req, Res, UnauthorizedException } from "@nestjs/common";
import type { CookieOptions, Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { JwtPayload } from "./types/jwt-payload.interface";
import  { Throttle } from '@nestjs/throttler';

const REFRESH_COOKIE = "refresh_token"
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.COOKIE_SAMESITE as "lax" | "none" | "strict") ?? "lax",
  path: "/auth",
});

const setRefreshCookie = (res: Response, token: string) =>
  res.cookie(REFRESH_COOKIE, token, {
    ...cookieOptions(),
    maxAge: REFRESH_MAX_AGE_MS,
  });

const clearRefreshCookie = (res: Response) =>
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('registration-info')
  registrationInfo() {
    return { inviteRequired: !!process.env.REGISTRATION_INVITE_CODE?.trim() };
  }

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.register(dto);
    setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @Post("login")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true}) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @Post("refresh")
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedException("No refresh token");
    try {
      const { accessToken, refreshToken } = await this.authService.refresh(token);
      setRefreshCookie(res, refreshToken);
      return { accessToken };
    } catch (e) {
      clearRefreshCookie(res);
      throw e;
    }
  }

  @Post("logout")
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) await this.authService.logout(token);
    clearRefreshCookie(res);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }
}
