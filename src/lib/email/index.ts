import fs from 'fs';
import path from 'path';

/**
 * Email template configuration for Supabase
 *
 * To use these templates with Supabase:
 * 1. Go to Supabase Dashboard > Authentication > Email Templates
 * 2. Select the template you want to customize (Confirm signup, Magic Link, etc.)
 * 3. Copy the HTML from the template files in src/lib/email/templates/
 * 4. Paste into the Supabase template editor
 * 5. Replace placeholders:
 *    - {{VERIFICATION_URL}} → {{ .ConfirmationURL }}
 *    - {{RESET_PASSWORD_URL}} → {{ .ConfirmationURL }}
 *    - {{REQUEST_TIME}} → {{ .Timestamp }}
 *    - {{REQUEST_IP}} → Use Supabase variables if available
 *    - {{USER_AGENT}} → Use Supabase variables if available
 */

export const EMAIL_TEMPLATES = {
  VERIFY_EMAIL: 'verify-email.html',
  RESET_PASSWORD: 'reset-password.html',
} as const;

/**
 * Read email template file
 */
export function getEmailTemplate(templateName: keyof typeof EMAIL_TEMPLATES): string {
  const templatePath = path.join(process.cwd(), 'src', 'lib', 'email', 'templates', EMAIL_TEMPLATES[templateName]);

  try {
    return fs.readFileSync(templatePath, 'utf-8');
  } catch (error) {
    console.error(`Failed to read email template: ${templateName}`, error);
    throw new Error(`Email template not found: ${templateName}`);
  }
}

/**
 * Replace placeholders in email template
 */
export function replaceEmailPlaceholders(
  template: string,
  replacements: Record<string, string>
): string {
  let result = template;

  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }

  return result;
}

/**
 * Configuration guide for Supabase Email Templates
 */
export const SUPABASE_EMAIL_SETUP_GUIDE = `
# Supabase Email Templates Setup Guide

## 1. Verify Email Template (Confirm signup)

1. Go to: Supabase Dashboard > Authentication > Email Templates > Confirm signup
2. Replace the HTML with content from: src/lib/email/templates/verify-email.html
3. Update placeholders:
   - {{VERIFICATION_URL}} → {{ .ConfirmationURL }}
   - {{SITE_URL}} → {{ .SiteURL }}

## 2. Reset Password Template

1. Go to: Supabase Dashboard > Authentication > Email Templates > Reset Password
2. Replace the HTML with content from: src/lib/email/templates/reset-password.html
3. Update placeholders:
   - {{RESET_PASSWORD_URL}} → {{ .ConfirmationURL }}
   - {{REQUEST_TIME}} → {{ .Timestamp }}
   - {{REQUEST_IP}} → (May need custom implementation)
   - {{USER_AGENT}} → (May need custom implementation)

## 3. Email Redirect Configuration

Set the redirect URL in Supabase:
1. Go to: Authentication > URL Configuration
2. Set Site URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}
3. Add Redirect URLs:
   - ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback
   - ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/verify-email

## 4. Email Provider Setup

Make sure your email provider is configured:
1. Go to: Authentication > Providers > Email
2. Enable email provider
3. Configure SMTP settings (or use Supabase's default)

## Available Supabase Variables

- {{ .ConfirmationURL }} - The confirmation/verification URL
- {{ .Token }} - The email confirmation token
- {{ .TokenHash }} - Hashed token
- {{ .SiteURL }} - Your site URL
- {{ .Email }} - User's email address
- {{ .Timestamp }} - Timestamp of the request
`;

/**
 * Helper to generate verification page URL
 */
export function getVerificationPageUrl(email: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${baseUrl}/verify-email?email=${encodeURIComponent(email)}`;
}

/**
 * Helper to get auth callback URL
 */
export function getAuthCallbackUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${baseUrl}/auth/callback`;
}
