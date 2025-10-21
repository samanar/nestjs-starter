import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { GoogleAuthGuard } from '../guards/google-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class GoogleAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth consent screen',
  })
  async googleAuth() {
    // Initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback handler' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with JWT token in query parameter',
  })
  @ApiResponse({ status: 401, description: 'Google authentication failed' })
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    // Find or create user from Google profile
    const user = await this.authService.findOrCreateGoogleUser(req.user);

    // Generate JWT token
    const authResponse = await this.authService.login(user);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return res.redirect(
      `${frontendUrl}/auth/callback?token=${authResponse.access_token}`,
    );
  }
}
