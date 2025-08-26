// Email Service for Sokogo Backend
// Supports multiple email providers: Nodemailer, SendGrid

const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.setupTransporter();
    }

    setupTransporter() {
        try {
            if (process.env.EMAIL_SERVICE === 'gmail') {
                this.transporter = nodemailer.createTransporter({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS // Use App Password for Gmail
                    }
                });
            } else if (process.env.EMAIL_SERVICE === 'sendgrid') {
                this.transporter = nodemailer.createTransporter({
                    host: 'smtp.sendgrid.net',
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'apikey',
                        pass: process.env.SENDGRID_API_KEY
                    }
                });
            } else if (process.env.SMTP_HOST) {
                // Custom SMTP configuration
                this.transporter = nodemailer.createTransporter({
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });
            } else {
                console.warn('⚠️ Email service not configured. Email features will be disabled.');
                return;
            }

            this.isConfigured = true;
            console.log('✅ Email service configured successfully');
        } catch (error) {
            console.error('❌ Email service configuration failed:', error.message);
        }
    }

    async sendEmail(to, subject, html, text = null) {
        if (!this.isConfigured) {
            console.warn('⚠️ Email service not configured. Cannot send email.');
            return { success: false, error: 'Email service not configured' };
        }

        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to,
                subject,
                html,
                text: text || this.htmlToText(html)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ Email sending failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Convert HTML to plain text (basic)
    htmlToText(html) {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    // Welcome email template
    async sendWelcomeEmail(user) {
        const subject = 'Welcome to Sokogo Classifieds!';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Welcome to Sokogo Classifieds!</h2>
                <p>Hi ${user.firstName} ${user.lastName},</p>
                <p>Thank you for joining Sokogo Classifieds! Your account has been created successfully.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Account Details:</h3>
                    <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Role:</strong> ${user.role}</p>
                </div>
                
                <p>You can now:</p>
                <ul>
                    <li>Browse thousands of classified listings</li>
                    <li>Post your own items for sale</li>
                    <li>Connect with buyers and sellers</li>
                </ul>
                
                <p>Happy trading!</p>
                <p>The Sokogo Team</p>
            </div>
        `;

        return await this.sendEmail(user.email, subject, html);
    }

    // Item posted notification
    async sendItemPostedEmail(user, item) {
        const subject = 'Your item has been posted successfully!';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Item Posted Successfully!</h2>
                <p>Hi ${user.firstName},</p>
                <p>Your item "<strong>${item.title}</strong>" has been posted successfully on Sokogo Classifieds.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Item Details:</h3>
                    <p><strong>Title:</strong> ${item.title}</p>
                    <p><strong>Category:</strong> ${item.category}</p>
                    <p><strong>Price:</strong> ${item.price} ${item.currency}</p>
                    <p><strong>Location:</strong> ${item.location?.city}, ${item.location?.district}</p>
                </div>
                
                <p>Your listing is now live and visible to potential buyers!</p>
                <p>The Sokogo Team</p>
            </div>
        `;

        return await this.sendEmail(user.email, subject, html);
    }

    // Password reset email
    async sendPasswordResetEmail(user, resetToken) {
        const subject = 'Reset Your Sokogo Password';
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Password Reset Request</h2>
                <p>Hi ${user.firstName},</p>
                <p>You requested to reset your password for your Sokogo account.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #2563eb; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                
                <p>If the button doesn't work, copy and paste this link:</p>
                <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
                
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request this, please ignore this email.</p>
                
                <p>The Sokogo Team</p>
            </div>
        `;

        return await this.sendEmail(user.email, subject, html);
    }

    // Contact inquiry email
    async sendContactInquiry(fromUser, toUser, item, message) {
        const subject = `Inquiry about: ${item.title}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">New Inquiry About Your Item</h2>
                <p>Hi ${toUser.firstName},</p>
                <p>Someone is interested in your item on Sokogo Classifieds!</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Item: ${item.title}</h3>
                    <p><strong>Price:</strong> ${item.price} ${item.currency}</p>
                    <p><strong>Category:</strong> ${item.category}</p>
                </div>
                
                <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Message from ${fromUser.firstName} ${fromUser.lastName}:</h3>
                    <p style="font-style: italic;">"${message}"</p>
                </div>
                
                <div style="background-color: #e5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Contact Information:</h3>
                    <p><strong>Name:</strong> ${fromUser.firstName} ${fromUser.lastName}</p>
                    <p><strong>Email:</strong> ${fromUser.email}</p>
                    <p><strong>Phone:</strong> ${fromUser.phoneNumber || 'Not provided'}</p>
                </div>
                
                <p>You can reply directly to this email to respond to the inquiry.</p>
                <p>The Sokogo Team</p>
            </div>
        `;

        return await this.sendEmail(toUser.email, subject, html);
    }

    // Test email configuration
    async testEmailConfig() {
        if (!this.isConfigured) {
            return { success: false, error: 'Email service not configured' };
        }

        try {
            await this.transporter.verify();
            return { success: true, message: 'Email configuration is valid' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
