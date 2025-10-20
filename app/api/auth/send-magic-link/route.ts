import { NextRequest, NextResponse } from 'next/server';
import { isEmailWhitelisted, generateMagicLinkToken } from '@/lib/cloudfront-auth';
import { BASE_URL } from '@/lib/helpers';
import { Resend } from 'resend';

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
    const verifyUrl = `${BASE_URL}/api/auth/verify?token=${encodeURIComponent(token)}`;

    // For development, we'll log the link. In production, send via email.
    if (process.env.NODE_ENV === 'development') {
      console.log('Magic link for', email, ':', verifyUrl);
      // return NextResponse.json({
      //   success: true,
      //   message: 'Magic link logged to console (dev mode)'
      // });
    }

    // Send email in production
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: parseInt(process.env.SMTP_PORT || '587'),
    //   secure: process.env.SMTP_SECURE === 'true',
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS
    //   }
    // });

    const friendlyDomain = BASE_URL.split('//')[1];

    // Initialize Resend
    const resendApiKey = process.env.AUTH_RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'Resend API key is not set' },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    const mailOptions = {
      from: 'growthepie.com <noreply@auth.growthepie.com>',
      to: email,
      subject: `Your ${friendlyDomain} Access Link`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;700&display=swap" rel="stylesheet">
            <style>
              body {
                font-family: 'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #B5C4C3;
                background-color: #1F2726;
                margin: 0;
                padding: 0;
              }
              .text {
                color: #B5C4C3 !important;
              }
              .wrapper {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: #2A3433;
                border-radius: 10px;
                padding: 40px;
                border: 1px solid #364240;
              }
              .logo {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo img {
                max-width: 200px;
              }
              .button {
                display: inline-block;
                padding: 14px 30px;
                background: linear-gradient(135deg, #FE5468 0%, #FFDF27 100%);
                color: #000 !important;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                margin: 20px 0;
                font-family: 'Raleway', sans-serif;
              }
              .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #5F7775; /* forest-600 */
                text-align: center;
              }
              p {
                font-size: 16px;
                margin: 1em 0;
              }
              a {
                color: #4CFF7E;
              }
              .link-code {
                background: #1B2524;
                padding: 8px 12px;
                border-radius: 5px;
                word-break: break-all;
                font-family: 'Source Code Pro', monospace;
                color: #9FB2B0 !important;
                font-size: 13px;
                display: block;
                margin-top: 5px;
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="logo">
                  <img src="https://www.growthepie.com/logo_full.png" alt="${friendlyDomain} logo">
                </div>
                <p class="text">Click the button below to sign in:</p>

                <div style="text-align: center;">
                  <a href="${verifyUrl}" class="button">Access ${friendlyDomain}</a>
                </div>

                <p style="font-size: 14px; color: #88A09D; /* forest-400 */">
                  Or copy and paste this link into your browser:
                  <br>
                  <code class="link-code">
                    ${verifyUrl}
                  </code>
                </p>
              </div>
            </div>
          </body>
        </html>
      `
    };

    const { data, error } = await resend.emails.send(mailOptions);

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log('Resend email sent successfully', data);

    // Send Discord notification for magic link generation
    const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
    // if (discordWebhook) {
    //   try {
    //     fetch(discordWebhook, {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //       body: JSON.stringify({
    //         content: `🔗 **Magic link sent** → \`${email}\` (${process.env.NEXT_PUBLIC_VERCEL_ENV || 'local'})`
    //       })
    //     }).catch(e => console.error('Discord webhook failed:', e));
    //   } catch (e) {
    //     console.error("Failed to send Discord notification:", e);
    //   }
    // }

    return NextResponse.json({
      success: true,
      message: `Magic link sent to your email, ${email}. Link: ${verifyUrl}`
    });

  } catch (error) {
    console.error('Magic link error:', error);
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    );
  }
}