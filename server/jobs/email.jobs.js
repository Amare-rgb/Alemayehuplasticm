
const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

// Create transporter
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport(emailConfig);
  }
  return transporter;
};

/**
 * Send verification email
 */
const sendVerificationEmail = async (email, name, otp) => {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@genesisagri.com',
      to: email,
      subject: 'Verify Your Email - Genesis Agri',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2d7d3a; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .otp-code { 
              font-size: 32px; 
              font-weight: bold; 
              color: #2d7d3a; 
              text-align: center;
              padding: 20px;
              background: white;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌾 Genesis Agri</h1>
            </div>
            <div class="content">
              <h2>Welcome ${name}!</h2>
              <p>Thank you for registering with Genesis Agri. Please verify your email address by entering the code below:</p>
              <div class="otp-code">${otp}</div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Genesis Agri. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, name, resetToken) => {
  try {
    const transporter = getTransporter();
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@genesisagri.com',
      to: email,
      subject: 'Password Reset - Genesis Agri',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2d7d3a; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .btn {
              display: inline-block;
              padding: 12px 30px;
              background: #2d7d3a;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌾 Genesis Agri</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="btn">Reset Password</a>
              </div>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Genesis Agri. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order confirmation email
 */
const sendOrderConfirmationEmail = async (email, name, orderId, items, total) => {
  try {
    const transporter = getTransporter();
    
    // Build order items HTML
    let itemsHtml = '';
    items.forEach(item => {
      itemsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
        </tr>
      `;
    });
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@genesisagri.com',
      to: email,
      subject: `Order Confirmation #${orderId} - Genesis Agri`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2d7d3a; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .order-table th { background: #2d7d3a; color: white; padding: 10px; }
            .order-table td { padding: 10px; border-bottom: 1px solid #ddd; }
            .total { text-align: right; font-size: 18px; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌾 Genesis Agri</h1>
            </div>
            <div class="content">
              <h2>Thank you for your order, ${name}!</h2>
              <p>Your order has been confirmed and is being processed.</p>
              <p><strong>Order #:</strong> ${orderId}</p>
              
              <h3>Order Summary</h3>
              <table class="order-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold;">Total:</td>
                    <td style="text-align: right; font-weight: bold;">$${total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              
              <p>You can track your order status in your account dashboard.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Genesis Agri. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send order confirmation email to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email (for new users)
 */
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@genesisagri.com',
      to: email,
      subject: 'Welcome to Genesis Agri!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2d7d3a; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .btn {
              display: inline-block;
              padding: 12px 30px;
              background: #2d7d3a;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌾 Welcome to Genesis Agri!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Thank you for joining Genesis Agri - your trusted agricultural marketplace.</p>
              <p>Here's what you can do:</p>
              <ul>
                <li>🌱 Browse agricultural products</li>
                <li>🛒 Shop for farm supplies</li>
                <li>📦 Track your orders</li>
                <li>💬 Connect with sellers</li>
              </ul>
              <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" class="btn">Start Shopping</a>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Genesis Agri. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Send email to seller about new order
 */
const sendNewOrderNotificationEmail = async (sellerEmail, sellerName, orderId, items, total) => {
  try {
    const transporter = getTransporter();
    
    // Build order items HTML
    let itemsHtml = '';
    items.forEach(item => {
      itemsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
        </tr>
      `;
    });
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@genesisagri.com',
      to: sellerEmail,
      subject: `New Order Received #${orderId} - Genesis Agri`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2d7d3a; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .order-table th { background: #2d7d3a; color: white; padding: 10px; }
            .order-table td { padding: 10px; border-bottom: 1px solid #ddd; }
            .total { text-align: right; font-size: 18px; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌾 Genesis Agri</h1>
            </div>
            <div class="content">
              <h2>New Order Received, ${sellerName}!</h2>
              <p>You have received a new order.</p>
              <p><strong>Order #:</strong> ${orderId}</p>
              
              <h3>Order Details</h3>
              <table class="order-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold;">Total:</td>
                    <td style="text-align: right; font-weight: bold;">$${total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              
              <p>Please log in to your seller dashboard to process this order.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Genesis Agri. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ New order notification sent to seller ${sellerEmail}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send new order notification to ${sellerEmail}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Send status update email
 */
const sendOrderStatusUpdateEmail = async (email, name, orderId, status) => {
  try {
    const transporter = getTransporter();
    
    const statusMessages = {
      PENDING: 'Your order has been received and is pending processing.',
      PROCESSING: 'Your order is being processed.',
      SHIPPED: 'Your order has been shipped!',
      DELIVERED: 'Your order has been delivered!',
      CANCELLED: 'Your order has been cancelled.',
    };
    
    const statusColors = {
      PENDING: '#f0ad4e',
      PROCESSING: '#5bc0de',
      SHIPPED: '#5cb85c',
      DELIVERED: '#2d7d3a',
      CANCELLED: '#d9534f',
    };
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@genesisagri.com',
      to: email,
      subject: `Order #${orderId} Status Update - Genesis Agri`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2d7d3a; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .status-badge {
              display: inline-block;
              padding: 8px 20px;
              background: ${statusColors[status] || '#666'};
              color: white;
              border-radius: 5px;
              font-weight: bold;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌾 Genesis Agri</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Your order <strong>#${orderId}</strong> status has been updated.</p>
              <p>Current Status: <span class="status-badge">${status}</span></p>
              <p>${statusMessages[status] || 'Your order status has been updated.'}</p>
              <p>Track your order in your account dashboard.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Genesis Agri. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Order status update email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send order status update email to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendWelcomeEmail,
  sendNewOrderNotificationEmail,
  sendOrderStatusUpdateEmail,
  getTransporter,
};