import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthAccountService } from './account/auth-account.service';
import {
  ChangePasswordDto,
  DeactivateAccountDto,
  DeleteAccountDto,
  Disable2FADto,
  Enable2FADto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  Setup2FADto,
  UpdateEmailDto,
  VerifyLogin2FADto,
} from './dto/requests';
import {
  AuthSessionResponseDto,
  CurrentSessionResponseDto,
  Enable2FAResponseDto,
  GetActiveSessionsResponseDto,
  LoginResponse,
  RegisterResponseDto,
  RequestPasswordResetResponseDto,
  SuccessResponseDto,
} from './dto/responses';
import { AuthIdentityService } from './identity/auth-identity.service';
import { GoogleAuthUser } from './interfaces/auth.interface';
import { AuthPasswordService } from './password/auth-password.service';
import { AuthSessionService } from './session/auth-session.service';
import { AuthTwoFactorService } from './two-factor/auth-two-factor.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly identityService: AuthIdentityService,
    private readonly sessionService: AuthSessionService,
    private readonly passwordService: AuthPasswordService,
    private readonly twoFactorService: AuthTwoFactorService,
    private readonly accountService: AuthAccountService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  register(dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.identityService.register(dto);
  }

  login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResponse> {
    return this.identityService.login(dto, ipAddress, userAgent);
  }

  googleLogin(
    user: GoogleAuthUser,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthSessionResponseDto> {
    return this.identityService.googleLogin(user, ipAddress, userAgent);
  }

  getCurrentSession(userId: string): Promise<CurrentSessionResponseDto> {
    return this.sessionService.getCurrentSession(userId);
  }

  getActiveSessions(userId: string): Promise<GetActiveSessionsResponseDto[]> {
    return this.sessionService.getActiveSessions(userId);
  }

  revokeSession(
    userId: string,
    sessionId: string,
  ): Promise<SuccessResponseDto> {
    return this.sessionService.revokeSession(userId, sessionId);
  }

  refreshTokens(refreshToken: string): Promise<AuthSessionResponseDto> {
    return this.sessionService.refreshTokens(refreshToken);
  }

  logout(
    userId: string | undefined,
    refreshToken: string,
  ): Promise<SuccessResponseDto> {
    return this.sessionService.logout(userId, refreshToken);
  }

  logoutAll(userId: string): Promise<SuccessResponseDto> {
    return this.sessionService.logoutAll(userId);
  }

  requestUpdatePassword(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    return this.passwordService.requestUpdatePassword(
      userId,
      userAgent,
      ipAddress,
    );
  }

  changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<SuccessResponseDto> {
    return this.passwordService.changePassword(userId, dto);
  }

  requestPasswordReset(
    email: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RequestPasswordResetResponseDto> {
    return this.passwordService.requestPasswordReset(
      email,
      userAgent,
      ipAddress,
    );
  }

  resetPassword(dto: ResetPasswordDto): Promise<void> {
    return this.passwordService.resetPassword(dto);
  }

  verifyLogin2FA(
    dto: VerifyLogin2FADto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthSessionResponseDto> {
    return this.twoFactorService.verifyLogin2FA(dto, userAgent, ipAddress);
  }

  requestEnable2FA(
    userId: string,
    dto: Setup2FADto,
    userAgent?: string,
    ipAddress?: string,
  ): ReturnType<AuthTwoFactorService['requestEnable2FA']> {
    return this.twoFactorService.requestEnable2FA(
      userId,
      dto,
      userAgent,
      ipAddress,
    );
  }

  enable2FA(userId: string, dto: Enable2FADto): Promise<Enable2FAResponseDto> {
    return this.twoFactorService.enable2FA(userId, dto);
  }

  requestDisable2FA(userId: string): Promise<SuccessResponseDto> {
    return this.twoFactorService.requestDisable2FA(userId);
  }

  disable2FA(userId: string, dto: Disable2FADto): Promise<SuccessResponseDto> {
    return this.twoFactorService.disable2FA(userId, dto);
  }

  requestUpdateEmail(
    userId: string,
    newEmail: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    return this.accountService.requestUpdateEmail(
      userId,
      newEmail,
      userAgent,
      ipAddress,
    );
  }

  updateEmail(
    dto: UpdateEmailDto,
    userId: string,
  ): Promise<SuccessResponseDto> {
    return this.accountService.updateEmail(dto, userId);
  }

  requestDeactivateAccount(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    return this.accountService.requestDeactivateAccount(
      userId,
      userAgent,
      ipAddress,
    );
  }

  requestDeleteAccount(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    return this.accountService.requestDeleteAccount(
      userId,
      userAgent,
      ipAddress,
    );
  }

  deleteAccount(
    userId: string,
    dto: DeleteAccountDto,
  ): Promise<SuccessResponseDto> {
    return this.accountService.deleteAccount(userId, dto);
  }

  deactivateAccount(
    userId: string,
    dto: DeactivateAccountDto,
  ): Promise<SuccessResponseDto> {
    return this.accountService.deactivateAccount(userId, dto);
  }

  verifyEmail(token: string): ReturnType<AuthAccountService['verifyEmail']> {
    return this.accountService.verifyEmail(token);
  }

  createSocketToken(userId: string): { token: string } {
    return {
      token: this.jwtService.sign(
        { sub: userId },
        {
          secret: this.configService.get<string>('config.jwt.secret'),
          expiresIn: '1h',
        },
      ),
    };
  }

  getClientUrl(): string {
    return (
      this.configService.get<string>('config.client.url') ??
      'http://localhost:3000'
    );
  }
}
