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
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CookieOptions, Request, Response } from 'express';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleOAuthGuard } from 'src/common/guards/google-oauth.guard';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { UpdateEmailDto } from './dto/update-email.dto';
import { RequestUpdateEmail } from './dto/request-update-email.dto';
import { ChangeUsernameDto } from './dto/change-username.dto';
import { ChangeDateOfBirthDto } from './dto/change-dob.dto';
import { DeactivateAccountDto } from './dto/deactivate-account-dto';

// ─── Cookie Options ───────────────────────────────────────────────────────────

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/',
  ...(isProduction ? { domain: '.th-red.app' } : {}),
};

const accessTokenCookieOptions = {
  ...cookieOptions,
  maxAge: 15 * 60 * 1000, // 15 mins
};

const refreshTokenCookieOptions = {
  ...cookieOptions,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ─────────────────────────────────────────────────────────────────────────────

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ============= PUBLIC ROUTES =============

  @Public()
  @Post('register')
  @Throttle({ default: { ttl: 3600, limit: 3 } })
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  async signup(@Body() registerDto: RegisterDto): Promise<User> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900, limit: 5 } })
  @ApiOperation({ summary: 'Login with username/email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signin(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto, ipAddress, userAgent);

    this.setAuthCookies(response, result);

    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authService.refreshTokens(refreshToken);

    this.setAuthCookies(response, result);

    return result;
  }

  @Public()
  @Get('check-username')
  @ApiOperation({ summary: 'Check if username is available' })
  @ApiQuery({ name: 'username', example: 'johndoe' })
  @ApiResponse({
    status: 200,
    description: 'Username availability status',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean', example: true },
      },
    },
  })
  async checkUsername(
    @Query('username') username: string,
  ): Promise<{ available: boolean }> {
    return this.authService.checkUsername(username);
  }

  @Public()
  @Get('check-email')
  @ApiOperation({ summary: 'Check if email is available' })
  @ApiQuery({ name: 'email', example: 'john@example.com' })
  @ApiResponse({
    status: 200,
    description: 'Email availability status',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean', example: true },
      },
    },
  })
  async checkEmail(
    @Query('email') email: string,
  ): Promise<{ available: boolean }> {
    return this.authService.checkEmail(email);
  }

  // ============= SESSION ROUTES =============

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async signout(
    @CurrentUser('id') userId: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const refreshToken = request.cookies['refreshToken'];

    if (refreshToken) {
      await this.authService.logout(userId, refreshToken);
    }

    this.clearAuthCookies(response);

    return { message: 'Logged out successfully' };
  }

  @Post('signout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices/sessions' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices' })
  async signoutAll(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    await this.authService.logoutAll(userId);

    this.clearAuthCookies(response);

    return { message: 'Logged out from all devices' };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
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
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateProfileDto,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      cover?: Express.Multer.File[];
    },
  ) {
    return this.authService.updateProfile(
      userId,
      updateDto,
      files?.avatar,
      files?.cover,
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
    await this.authService.requestUpdatePassword(userId, userAgent, ipAddress);

    return { message: 'Verification code has been sent to your email.' };
  }

  @Patch('change-username')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change username/display name' })
  async changeUsername(
    @Body() changeUsernameDto: ChangeUsernameDto,
    @CurrentUser('id') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.changeUsername(
      userId,
      changeUsernameDto,
      userAgent,
      ipAddress,
    );
  }

  @Patch('change-birthday')
  @ApiBearerAuth()
  async changeBirthDay(
    @CurrentUser('id') userId: string,
    @Body() changeDateOfBirthDto: ChangeDateOfBirthDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.changeBirthday(
      userId,
      changeDateOfBirthDto,
      userAgent,
      ipAddress,
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
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const result = await this.authService.changePassword(
      userId,
      changePasswordDto,
      userAgent,
      ipAddress,
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
    await this.authService.requestPasswordReset(
      body.email,
      userAgent,
      ipAddress,
    );

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  async reset(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    await this.authService.resetPassword(
      resetPasswordDto,
      userAgent,
      ipAddress,
    );
    return { message: 'Password has been updated successfully.' };
  }

  // ============= ACCOUNT EMAIL ROUTES =============

  @Post('request-update-email')
  @ApiBearerAuth()
  @HttpCode(200)
  async requestUpdateEmail(
    @Body() requestUpdateEmail: RequestUpdateEmail,
    @CurrentUser('id') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    await this.authService.requestUpdateEmail(
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
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.updateEmail(
      updateEmailDto,
      userId,
      userAgent,
      ipAddress,
    );

    this.clearAuthCookies(response);

    return result;
  }

  // ============= SESSION MANAGEMENT ROUTES =============

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active sessions for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of active sessions',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userAgent: { type: 'string' },
          ipAddress: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getActiveSessions(@CurrentUser('id') userId: string) {
    return this.authService.getActiveSessions(userId);
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
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<{ message: string }> {
    return this.authService.revokeSession(userId, sessionId);
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
      await this.authService.verifyEmail(token);

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
        errorMessage = String((error as any).message);
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
    const googleUser = req.user;
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
      }

      const errorMessage = encodeURIComponent(
        'An error occurred during Google login. Please try again.',
      );
      response.redirect(
        `${frontendUrl}/login?error=google_login_failed&message=${errorMessage}`,
      );
    }
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
    await this.authService.requestDeactivateAccount(
      userId,
      userAgent,
      ipAddress,
    );

    return { message: 'Verification code has been sent to your email.' };
  }

  @Post('deactivate-account')
  @ApiBearerAuth()
  @HttpCode(200)
  async deactivateAccount(
    @CurrentUser('id') userId: string,
    @Body() deactivateAccountDto: DeactivateAccountDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.deactivateAccount(
      userId,
      deactivateAccountDto,
      userAgent,
      ipAddress,
    );

    this.clearAuthCookies(response);

    return result;
  }

  private setAuthCookies(
    response: Response,
    tokens: Pick<AuthResponseDto, 'accessToken' | 'refreshToken'>,
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

  private clearAuthCookies(response: Response) {
    response.clearCookie('accessToken', cookieOptions);
    response.clearCookie('refreshToken', {
      ...cookieOptions,
      path: '/api/v1/auth',
    });
  }
}
