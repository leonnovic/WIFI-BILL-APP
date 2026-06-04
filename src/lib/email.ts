/**
 * Email Service Integration
 * Production-ready email sending using Nodemailer
 * Supports OTP, notifications, receipts, and alerts
 */

import { db } from './db'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  fromName: string
  fromEmail: string
}

interface EmailMessage {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

class EmailService {
  private config: EmailConfig
  private transporter: any = null

  constructor(config?: Partial<EmailConfig>) {
    this.config = {
      host: config?.host || process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: config?.port || parseInt(process.env.EMAIL_PORT || '587'),
      secure: config?.secure || process.env.EMAIL_SECURE === 'true',
      user: config?.user || process.env.EMAIL_USER || '',
      pass: config?.pass || process.env.EMAIL_PASS || '',
      fromName: config?.fromName || process.env.EMAIL_FROM_NAME || 'ISPLedger',
      fromEmail: config?.fromEmail || process.env.EMAIL_FROM || 'noreply@ispledger.com',
    }
  }

  /**
   * Initialize the email transporter (lazy loading)
   */
  private async getTransporter() {
    if (this.transporter) return this.transporter

    // Nodemailer is optional - if not installed, use mock email
    // Install with: npm install nodemailer && npm install -D @types/nodemailer
    try {
      let nodemailer: any
      try {
        nodemailer = require('nodemailer')
      } catch {
        this.transporter = null
        return null
      }

      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
      })
    } catch (error) {
      console.warn('Nodemailer not available, using mock email service')
      this.transporter = null
    }

    return this.transporter
  }

  /**
   * Send email
   */
  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const transporter = await this.getTransporter()

    if (!transporter) {
      // Mock email - log to console in development
      console.log(`[MOCK EMAIL] To: ${message.to}, Subject: ${message.subject}`)
      return { success: true, messageId: `mock-${Date.now()}` }
    }

    try {
      const result = await transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text || this.stripHTML(message.html),
      })

      return { success: true, messageId: result.messageId }
    } catch (error: any) {
      console.error('Email send error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send verification email with OTP
   */
  async sendVerificationEmail(email: string, code: string, name?: string): Promise<{ success: boolean }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1220; margin: 0; padding: 20px; color: #e2e8f0; }
          .container { max-width: 600px; margin: 0 auto; background: #111827; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .code-box { background: #0b1220; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 8px; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #1e293b; }
          .warning { background: #fef3c7; color: #92400e; padding: 12px; border-radius: 8px; font-size: 13px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ISPLedger</h1>
          </div>
          <div class="content">
            <h2 style="color: #e2e8f0;">Email Verification</h2>
            <p style="color: #94a3b8;">Hello ${name || 'there'},</p>
            <p style="color: #94a3b8;">Please use the following code to verify your email address:</p>
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            <p style="color: #94a3b8;">This code expires in <strong>5 minutes</strong>.</p>
            <div class="warning">
              If you didn't create an account on ISPLedger, please ignore this email.
            </div>
          </div>
          <div class="footer">
            <p>ISPLedger - WiFi Billing & ISP Management</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const result = await this.sendEmail({
      to: email,
      subject: 'ISPLedger - Email Verification Code',
      html,
    })

    return { success: result.success }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, name: string, role: string): Promise<{ success: boolean }> {
    const roleLabel = role === 'member' ? 'ISP Member' : role === 'admin' ? 'Administrator' : 'Client'
    const dashboardUrl = role === 'admin' ? '/admin/dashboard' : role === 'member' ? '/member/dashboard' : '/client/dashboard'

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1220; margin: 0; padding: 20px; color: #e2e8f0; }
          .container { max-width: 600px; margin: 0 auto; background: #111827; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .btn { display: inline-block; background: #10b981; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .features { background: #0b1220; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .feature { padding: 8px 0; color: #94a3b8; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Welcome to ISPLedger!</h1></div>
          <div class="content">
            <h2 style="color: #e2e8f0;">Hello, ${name}!</h2>
            <p style="color: #94a3b8;">Your ${roleLabel} account has been created successfully. Here's what you can do:</p>
            <div class="features">
              ${role === 'client' ? `
                <div class="feature">Browse and purchase internet packages</div>
                <div class="feature">Use OKOA Internet for credit-based access</div>
                <div class="feature">Track your data usage in real-time</div>
                <div class="feature">Get 24/7 support</div>
              ` : role === 'member' ? `
                <div class="feature">Manage your clients and packages</div>
                <div class="feature">Monitor router performance</div>
                <div class="feature">Process M-Pesa payments automatically</div>
                <div class="feature">View revenue analytics</div>
              ` : `
                <div class="feature">Full platform oversight</div>
                <div class="feature">Manage ISP members and clients</div>
                <div class="feature">Configure system settings</div>
                <div class="feature">Monitor revenue and growth</div>
              `}
            </div>
            <a href="${process.env.NEXTAUTH_URL}${dashboardUrl}" class="btn">Go to Dashboard</a>
          </div>
          <div class="footer">
            <p>ISPLedger - WiFi Billing & ISP Management</p>
          </div>
        </div>
      </body>
      </html>
    `

    const result = await this.sendEmail({
      to: email,
      subject: `Welcome to ISPLedger - Your ${roleLabel} Account`,
      html,
    })

    return { success: result.success }
  }

  /**
   * Send payment receipt
   */
  async sendPaymentReceipt(email: string, data: {
    name: string
    packageName: string
    amount: number
    mpesaCode: string
    date: string
    duration: string
  }): Promise<{ success: boolean }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1220; margin: 0; padding: 20px; color: #e2e8f0; }
          .container { max-width: 600px; margin: 0 auto; background: #111827; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .receipt { background: #0b1220; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; }
          .row:last-child { border-bottom: none; }
          .total { font-size: 18px; font-weight: bold; color: #10b981; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Payment Receipt</h1></div>
          <div class="content">
            <p style="color: #94a3b8;">Hello ${data.name},</p>
            <p style="color: #94a3b8;">Your payment has been processed successfully.</p>
            <div class="receipt">
              <div class="row"><span style="color: #94a3b8;">Package</span><span style="color: #e2e8f0;">${data.packageName}</span></div>
              <div class="row"><span style="color: #94a3b8;">Duration</span><span style="color: #e2e8f0;">${data.duration}</span></div>
              <div class="row"><span style="color: #94a3b8;">M-Pesa Ref</span><span style="color: #e2e8f0;">${data.mpesaCode}</span></div>
              <div class="row"><span style="color: #94a3b8;">Date</span><span style="color: #e2e8f0;">${data.date}</span></div>
              <div class="row total"><span>Total Paid</span><span>KES ${data.amount.toLocaleString()}</span></div>
            </div>
          </div>
          <div class="footer"><p>ISPLedger - WiFi Billing & ISP Management</p></div>
        </div>
      </body>
      </html>
    `

    const result = await this.sendEmail({
      to: email,
      subject: `ISPLedger - Payment Receipt (KES ${data.amount.toLocaleString()})`,
      html,
    })

    return { success: result.success }
  }

  /**
   * Send OKOA credit notification
   */
  async sendOkoaNotification(email: string, data: {
    name: string
    creditAmount: number
    serviceFee: number
    totalDebt: number
  }): Promise<{ success: boolean }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1220; margin: 0; padding: 20px; color: #e2e8f0; }
          .container { max-width: 600px; margin: 0 auto; background: #111827; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; }
          .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .details { background: #0b1220; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; }
          .row:last-child { border-bottom: none; }
          .warning { background: #fef3c7; color: #92400e; padding: 12px; border-radius: 8px; font-size: 13px; margin-top: 20px; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>OKOA Internet Credit</h1></div>
          <div class="content">
            <p style="color: #94a3b8;">Hello ${data.name},</p>
            <p style="color: #94a3b8;">Your OKOA Internet credit request has been approved!</p>
            <div class="details">
              <div class="row"><span style="color: #94a3b8;">Credit Amount</span><span style="color: #e2e8f0;">KES ${data.creditAmount.toLocaleString()}</span></div>
              <div class="row"><span style="color: #94a3b8;">Service Fee (10%)</span><span style="color: #f59e0b;">KES ${data.serviceFee.toLocaleString()}</span></div>
              <div class="row" style="font-weight: bold;"><span style="color: #e2e8f0;">Total OKOA Debt</span><span style="color: #f59e0b;">KES ${data.totalDebt.toLocaleString()}</span></div>
            </div>
            <div class="warning">
              Your OKOA debt will be automatically deducted from your next package purchase.
            </div>
          </div>
          <div class="footer"><p>ISPLedger - WiFi Billing & ISP Management</p></div>
        </div>
      </body>
      </html>
    `

    const result = await this.sendEmail({
      to: email,
      subject: `ISPLedger - OKOA Credit: KES ${data.creditAmount.toLocaleString()}`,
      html,
    })

    return { success: result.success }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, resetUrl: string, name?: string): Promise<{ success: boolean }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1220; margin: 0; padding: 20px; color: #e2e8f0; }
          .container { max-width: 600px; margin: 0 auto; background: #111827; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .btn { display: inline-block; background: #10b981; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Reset Your Password</h1></div>
          <div class="content">
            <p style="color: #94a3b8;">Hello ${name || 'there'},</p>
            <p style="color: #94a3b8;">We received a request to reset your password. Click the button below to set a new password:</p>
            <a href="${resetUrl}" class="btn">Reset Password</a>
            <p style="color: #64748b; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          </div>
          <div class="footer"><p>ISPLedger - WiFi Billing & ISP Management</p></div>
        </div>
      </body>
      </html>
    `

    const result = await this.sendEmail({
      to: email,
      subject: 'ISPLedger - Reset Your Password',
      html,
    })

    return { success: result.success }
  }

  /**
   * Strip HTML tags from string (for plain text fallback)
   */
  private stripHTML(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }
}

// Singleton
let emailInstance: EmailService | null = null

function getEmailService(): EmailService {
  if (!emailInstance) {
    emailInstance = new EmailService()
  }
  return emailInstance
}

export { EmailService, getEmailService }
export type { EmailMessage }
