interface EmailTemplateProps {
  title: string;
  previewText: string;
  content: string;
  footerText?: string;
}

export const generateMedInfiniteEmailHTML = (props: EmailTemplateProps): string => {
  const { title, previewText, content, footerText } = props;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 32px; text-align: center; }
        .logo-text { color: #ffffff; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: -0.5px; }
        .tagline { color: #e0e7ff; font-size: 14px; margin: 8px 0 0 0; }
        .content { padding: 40px 32px; }
        .footer { background-color: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { font-size: 12px; color: #6b7280; margin: 8px 0; }
        .footer-link { color: #2563eb; text-decoration: none; }
        .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 20px 0; }
        .button:hover { background-color: #1e40af; }
      </style>
    </head>
    <body>
      <div style="display: none; max-height: 0; overflow: hidden;">${previewText}</div>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <h1 class="logo-text">Med-Infinite</h1>
          <p class="tagline">Healthcare Management System</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          ${content}
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p class="footer-text"><strong>Med-Infinite Healthcare Management</strong></p>
          <p class="footer-text">
            <a href="https://med-infinite.care" class="footer-link">www.med-infinite.care</a>
          </p>
          <p class="footer-text" style="margin-top: 16px;">
            ${footerText || 'This is an automated email. Please do not reply directly to this message.'}
          </p>
          <p class="footer-text" style="color: #9ca3af;">
            © ${new Date().getFullYear()} Med-Infinite. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};
