import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, name: string, otp: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 20px;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          border-radius: 10px 10px 0 0;
        }
        .header h1 {
          color: white;
          margin: 0;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 5px;
          text-align: center;
          background: white;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
          border: 2px dashed #2563eb;
          color: #2563eb;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ShopHub</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Thank you for registering with ShopHub! Please verify your email address to complete your registration.</p>
          
          <div class="otp-code">
            ${otp}
          </div>
          
          <p>Enter this verification code on the website to verify your email address.</p>
          <p>This code will expire in <strong>5 minutes</strong>.</p>
          
          <p>If you didn't create an account with ShopHub, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2026 ShopHub. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hello ${name},
    
    Thank you for registering with ShopHub! Please verify your email address using the code below:
    
    Verification Code: ${otp}
    
    This code will expire in 5 minutes.
    
    If you didn't create an account with ShopHub, you can safely ignore this email.
    
    © 2026 ShopHub
  `;

  await transporter.sendMail({
    from: `"ShopHub" <${process.env.EMAIL_FROM || 'noreply@shophub.com'}>`,
    to: email,
    subject: 'Verify Your Email Address - ShopHub',
    text,
    html,
  });
}