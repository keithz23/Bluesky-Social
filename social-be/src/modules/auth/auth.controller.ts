import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  Res,
  Req,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
  ConflictException,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './services/auth.service';
import {
  ChangeDateOfBirthDto,
  ChangePasswordDto,
  ChangeUsernameDto,
  DeactivateAccountDto,
  DeleteAccountDto,
  Disable2FADto,
  Enable2FADto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  RequestUpdateEmailDto,
  ResetPasswordDto,
  Setup2FADto,
  UpdateAccountPrivacyDto,
  UpdateEmailDto,
  UpdateProfileDto,
  VerifyLogin2FADto,
} from './dto/requests';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request, Response } from 'express';
import { GoogleOAuthGuard } from 'src/common/guards/google-oauth.guard';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ImageValidationPipe } from 'src/common/pipes/file-validation.pipe';
import { IMAGE_UPLOAD } from 'src/common/constants/upload.constant';
import {
  accessTokenCookieOptions,
  cookieOptions,
  refreshTokenCookieOptions,
} from 'src/common/utils/cookie-option.util';
import {
  AuthSessionResponseDto,
  CurrentSessionResponseDto,
  CurrentUserResponseDto,
  Login2FAChallengeResponseDto,
  LoginResponse,
  SuccessResponseDto,
  RegisterResponseDto,
  GetActiveSessionsResponseDto,
} from './dto/responses';
import {
  ApiEnvelopeOneOfResponse,
  ApiEnvelopeResponse,
} from 'src/common/decorators/api-envelope-response.decorator';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthSessionService } from './services/auth-session.service';
import { AuthTwoFactorService } from './services/auth-two-factor.service';
import { AuthAccountService } from './services/auth-account.service';
import { AuthProfileService } from './services/auth-profile.service';
import { GoogleAuthUser } from './interfaces/auth.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly authPasswordService: AuthPasswordService,
    private readonly authSessionService: AuthSessionService,
    private readonly authTwoFactorService: AuthTwoFactorService,
    private readonly authAccountService: AuthAccountService,
    private readonly authProfileService: AuthProfileService,
    private readonly configService: ConfigService,
  ) {}

  // ============= PUBLIC ROUTES =============
  @Public()
  @Post('register')
  @Throttle({ default: { ttl: 3600, limit: 3 } })
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiEnvelopeResponse(RegisterResponseDto, {
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  async signup(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900, limit: 5 } })
  @ApiOperation({ summary: 'Login with username/email and password' })
  @ApiEnvelopeOneOfResponse(
    [AuthSessionResponseDto, Login2FAChallengeResponseDto],
    {
      description: 'Login successful',
    },
  )
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signin(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const result = await this.authService.login(loginDto, ipAddress, userAgent);

    if ('requires2FA' in result) {
      return result;
    }

    this.setAuthCookies(response, result);

    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiEnvelopeResponse(AuthSessionResponseDto, {
    description: 'Token refreshed successfully',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponseDto> {
    const refreshToken = this.getRefreshToken(request);
    if (!refreshToken) {
      this.clearAuthCookies(response);
      throw new UnauthorizedException('Refresh token not found');
    }

    try {
      const result = await this.authSessionService.refreshTokens(refreshToken);

      this.setAuthCookies(response, result);

      return result;
    } catch (error) {
      this.clearAuthCookies(response);
      throw error;
    }
  }

  // ============= SESSION ROUTES =============
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from current session' })
  @ApiEnvelopeResponse(SuccessResponseDto, {
    status: 200,
    description: 'Logged out successfully',
  })
  async signout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const refreshToken = this.getRefreshToken(request);
    const userId = this.getRequestUserId(request);

    if (refreshToken) {
      await this.authSessionService.logout(userId, refreshToken);
    }

    this.clearAuthCookies(response);

    return { message: 'Logged out successfully' };
  }

  @Post('signout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices/sessions' })
  @ApiEnvelopeResponse(SuccessResponseDto, {
    status: 200,
    description: 'Logged out from all devices',
  })
  async signoutAll(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    await this.authSessionService.logoutAll(userId);

    this.clearAuthCookies(response);

    return { message: 'Logged out from all devices' };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiEnvelopeResponse(CurrentSessionResponseDto, {
    description: 'User profile retrieved',
  })
  async getProfile(
    @CurrentUser('id') userId: string,
  ): Promise<CurrentSessionResponseDto> {
    return this.authProfileService.getProfile(userId);
  }

  // ============= PROFILE ROUTES =============
  @Patch('update-profile')
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
    ]),
  )
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiEnvelopeResponse(CurrentUserResponseDto, {
    description: 'Profile updated successfully',
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateProfileDto,
    @UploadedFiles(
      new ImageValidationPipe(
        IMAGE_UPLOAD.MAX_FILE_SIZE_BYTES,
        IMAGE_UPLOAD.MAX_PROFILE_IMAGES,
      ),
    )
    files: {
      avatar?: Express.Multer.File[];
      cover?: Express.Multer.File[];
    },
  ): Promise<CurrentUserResponseDto> {
    return this.authProfileService.updateProfile(
      userId,
      updateDto,
      files?.avatar,
      files?.cover,
    );
  }

  @Patch('account-privacy')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user account privacy' })
  @ApiResponse({
    status: 200,
    description: 'Account privacy updated successfully',
  })
  async updateAccountPrivacy(
    @CurrentUser('id') userId: string,
    @Body() updateAccountPrivacyDto: UpdateAccountPrivacyDto,
  ) {
    return this.authAccountService.updateAccountPrivacy(
      userId,
      updateAccountPrivacyDto,
    );
  }

  // ============= ACCOUNT SECURITY ROUTES =============
  @Post('request-update-password')
  @ApiBearerAuth()
  @HttpCode(200)
  async requestUpdatePassword(
    @CurrentUser('id') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    await this.authPasswordService.requestUpdatePassword(
      userId,
      userAgent,
      ipAddress,
    );

    return { message: 'Verification code has been sent to your email.' };
  }

  @Patch('change-username')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change username/display name' })
  async changeUsername(
    @Body() changeUsernameDto: ChangeUsernameDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.authProfileService.changeUsername(userId, changeUsernameDto);
  }

  @Patch('change-birthday')
  @ApiBearerAuth()
  async changeBirthDay(
    @CurrentUser('id') userId: string,
    @Body() changeDateOfBirthDto: ChangeDateOfBirthDto,
  ) {
    return this.authProfileService.changeDateOfBirth(
      userId,
      changeDateOfBirthDto,
    );
  }

  @Patch('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change account password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully. All sessions revoked.',
  })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const result = await this.authPasswordService.changePassword(
      userId,
      changePasswordDto,
    );

    this.clearAuthCookies(response);

    return result;
  }

  // ============= PASSWORD RECOVERY ROUTES =============
  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  async forgot(
    @Body() body: ForgotPasswordDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authPasswordService.requestPasswordReset(
      body.email,
      userAgent,
      ipAddress,
    );
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  async reset(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authPasswordService.resetPassword(resetPasswordDto);
    return { message: 'Password has been updated successfully.' };
  }

  // ============= ACCOUNT EMAIL ROUTES =============
  @Post('request-update-email')
  @ApiBearerAuth()
  @HttpCode(200)
  async requestUpdateEmail(
    @Body() requestUpdateEmail: RequestUpdateEmailDto,
    @CurrentUser('id') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    await this.authAccountService.requestUpdateEmail(
      userId,
      requestUpdateEmail.newEmail,
      userAgent,
      ipAddress,
    );

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  @Post('update-email')
  @ApiBearerAuth()
  @HttpCode(200)
  async updateEmail(
    @Body() updateEmailDto: UpdateEmailDto,
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authAccountService.updateEmail(
      updateEmailDto,
      userId,
    );

    this.clearAuthCookies(response);

    return result;
  }

  // ============= SESSION MANAGEMENT ROUTES =============
  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active sessions for current user' })
  @ApiEnvelopeOneOfResponse([GetActiveSessionsResponseDto], {
    status: 200,
    description: 'List of active sessions',
  })
  async getActiveSessions(@CurrentUser('id') userId: string) {
    return this.authSessionService.getActiveSessions(userId);
  }

  @Get('socket-token')
  getSocketToken(@CurrentUser('id') userId: string) {
    const token = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get('config.jwt.secret'),
        expiresIn: '1h',
      },
    );
    return { token };
  }

  @Delete('sessions/:sessionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiEnvelopeResponse(SuccessResponseDto, {
    status: 200,
    description: 'Session revoked successfully',
  })
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<{ message: string }> {
    return this.authSessionService.revokeSession(userId, sessionId);
  }

  // ============= EMAIL VERIFICATION & OAUTH ROUTES =============
  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('config.client.url');

    if (!token) {
      return res.redirect(
        `${frontendUrl}/login?status=error&message=Token_missing`,
      );
    }

    try {
      await this.authAccountService.verifyEmail(token);

      return res.redirect(
        `${frontendUrl}/login?status=success&message=Email_verified`,
      );
    } catch (error: unknown) {
      let errorMessage = 'Verification_failed';

      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }

      return res.redirect(
        `${frontendUrl}/login?status=error&message=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login page' })
  async googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async googleAuthRedirect(
    @Req() req: Request,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Res() response: Response,
  ) {
    const googleUser = req.user as GoogleAuthUser;
    const frontendUrl =
      this.configService.get<string>('config.client.url') ||
      'http://localhost:3000';

    try {
      const result = await this.authService.googleLogin(
        googleUser,
        ipAddress,
        userAgent,
      );

      this.setAuthCookies(response, result);

      response.redirect(frontendUrl);
    } catch (error) {
      console.error('Google login error:', error);

      if (error instanceof ConflictException) {
        const errorMessage = encodeURIComponent(
          'This email is already registered. Please sign in with your password.',
        );
        response.redirect(
          `${frontendUrl}/login?error=email_exists&message=${errorMessage}`,
        );
        return;
      } else if (error instanceof UnauthorizedException) {
        const errorMessage = encodeURIComponent('This account is not active');
        response.redirect(
          `${frontendUrl}/login?error=account_not_active&message=${errorMessage}`,
        );
        return;
      }

      const errorMessage = encodeURIComponent(
        'An error occurred during Google login. Please try again.',
      );
      response.redirect(
        `${frontendUrl}/login?error=google_login_failed&message=${errorMessage}`,
      );
    }
  }

  // ============= Two Factor =============

  @Post('request-enable-2fa')
  @ApiBearerAuth()
  @HttpCode(200)
  async requestEnable2FA(
    @Body() setup2FADto: Setup2FADto,
    @CurrentUser('id') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authTwoFactorService.requestEnable2FA(
      userId,
      setup2FADto,
      userAgent,
      ipAddress,
    );
  }

  @Post('enable-2fa')
  @ApiBearerAuth()
  @HttpCode(200)
  async enable2FA(
    @CurrentUser('id') userId: string,
    @Body() enable2FADto: Enable2FADto,
  ) {
    return this.authTwoFactorService.enable2FA(userId, enable2FADto);
  }

  @Public()
  @Post('verify-login-2fa')
  @HttpCode(200)
  @ApiEnvelopeResponse(AuthSessionResponseDto, {
    description: 'Two-factor login verified successfully',
  })
  async verifyLogin2FA(
    @Body() dto: VerifyLogin2FADto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authTwoFactorService.verifyLogin2FA(
      dto,
      userAgent,
      ipAddress,
    );

    this.setAuthCookies(response, result);

    return result;
  }

  @Post('request-disable-2fa')
  @ApiBearerAuth()
  @HttpCode(200)
  async requestDisable2FA(@CurrentUser('id') userId: string) {
    return this.authTwoFactorService.requestDisable2FA(userId);
  }

  @Post('disable-2fa')
  @ApiBearerAuth()
  @HttpCode(200)
  async disable2FA(
    @CurrentUser('id') userId: string,
    @Body() disable2FADto: Disable2FADto,
  ) {
    return this.authTwoFactorService.disable2FA(userId, disable2FADto);
  }

  // ============= ACCOUNT DEACTIVATION ROUTES =============

  @Post('request-deactivate-account')
  @ApiBearerAuth()
  @HttpCode(200)
  async requestDeactivateAccount(
    @CurrentUser('id') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    await this.authAccountService.requestDeactivateAccount(
      userId,
      userAgent,
      ipAddress,
    );

    return { message: 'Verification code has been sent to your email.' };
  }

  @Post('request-delete-account')
  @ApiBearerAuth()
  @HttpCode(200)
  async requestDeleteAccount(
    @CurrentUser('id') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    await this.authAccountService.requestDeleteAccount(
      userId,
      userAgent,
      ipAddress,
    );

    return { message: 'Verification code has been sent to your email.' };
  }

  @Post('delete-account')
  @ApiBearerAuth()
  @HttpCode(200)
  async deleteAccount(
    @CurrentUser('id') userId: string,
    @Body() deleteAccountDto: DeleteAccountDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authAccountService.deleteAccount(
      userId,
      deleteAccountDto,
    );

    this.clearAuthCookies(response);

    return result;
  }

  @Post('deactivate-account')
  @ApiBearerAuth()
  @HttpCode(200)
  async deactivateAccount(
    @CurrentUser('id') userId: string,
    @Body() deactivateAccountDto: DeactivateAccountDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authAccountService.deactivateAccount(
      userId,
      deactivateAccountDto,
    );

    this.clearAuthCookies(response);

    return result;
  }

  private setAuthCookies(
    response: Response,
    tokens: Pick<AuthSessionResponseDto, 'accessToken' | 'refreshToken'>,
  ) {
    response.cookie(
      'accessToken',
      tokens.accessToken,
      accessTokenCookieOptions,
    );
    response.cookie('refreshToken', tokens.refreshToken, {
      ...refreshTokenCookieOptions,
    });
  }

  private getRefreshToken(request: Request): string | undefined {
    const cookies = request.cookies as unknown;
    if (!cookies || typeof cookies !== 'object') return undefined;

    const refreshToken = (cookies as Record<string, unknown>).refreshToken;
    return typeof refreshToken === 'string' ? refreshToken : undefined;
  }

  private getRequestUserId(request: Request): string | undefined {
    const user = request.user as unknown;
    if (!user || typeof user !== 'object') return undefined;

    const userId = (user as Record<string, unknown>).id;
    return typeof userId === 'string' ? userId : undefined;
  }

  private clearAuthCookies(response: Response) {
    response.clearCookie('accessToken', cookieOptions);
    response.clearCookie('refreshToken', {
      ...cookieOptions,
      path: '/api/v1/auth',
    });
  }
}
