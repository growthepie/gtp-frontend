import { NextRequest, NextResponse } from 'next/server';
import { isEmailWhitelisted, generateMagicLinkToken } from '@/lib/cloudfront-auth';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email domain is whitelisted
    if (!isEmailWhitelisted(email)) {
      return NextResponse.json(
        { error: 'This email domain is not authorized for access' },
        { status: 403 }
      );
    }

    // Generate magic link token
    const token = generateMagicLinkToken(email);

    // Build the verification URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${request.headers.get('host')}`;
    const verifyUrl = `${baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;

    // For development, we'll log the link. In production, send via email.
    if (process.env.NODE_ENV === 'development') {
      console.log('Magic link for', email, ':', verifyUrl);
      return NextResponse.json({
        success: true,
        message: 'Magic link logged to console (dev mode)'
      });
    }

    // Send email in production
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@growthepie.xyz',
      to: email,
      subject: 'Your Growth The Pie Access Link',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
              }
              .logo {
                text-align: center;
                margin-bottom: 30px;
              }
              .button {
                display: inline-block;
                padding: 14px 30px;
                background: linear-gradient(135deg, #FE5468 0%, #FFDF27 100%);
                color: #000;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                margin: 20px 0;
              }
              .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #666;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">
                <h1>Growth • The • Pie</h1>
              </div>

              <p>Hi there,</p>

              <p>You requested access to the protected Growth The Pie preview. Click the button below to sign in:</p>

              <div style="text-align: center;">
                <a href="${verifyUrl}" class="button">Access Growth The Pie</a>
              </div>

              <p style="font-size: 14px; color: #666;">
                Or copy and paste this link into your browser:
                <br>
                <code style="background: #f0f0f0; padding: 5px; border-radius: 3px; word-break: break-all;">
                  ${verifyUrl}
                </code>
              </p>

              <div class="footer">
                <p>This link will expire in 15 minutes for security reasons.</p>
                <p>If you didn't request this email, you can safely ignore it.</p>
              </div>
            </div>
          </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email'
    });

  } catch (error) {
    console.error('Magic link error:', error);
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    );
  }
}