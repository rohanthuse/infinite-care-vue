interface Notification {
  id: string;
  type: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  data?: any;
}

interface EmailContent {
  subject: string;
  htmlContent: string;
}

export const generateNotificationEmailContent = (
  notification: Notification,
  userName: string
): EmailContent => {
  const siteUrl = Deno.env.get('SITE_URL') || 'https://med-infinite.care';
  
  // Base greeting
  const greeting = `<p style="font-size: 16px; color: #374151; margin-bottom: 16px;">Hi ${userName},</p>`;
  
  // Priority badge
  const priorityColors = {
    urgent: { bg: '#dc2626', text: '#ffffff' },
    high: { bg: '#ea580c', text: '#ffffff' },
    medium: { bg: '#eab308', text: '#ffffff' },
    low: { bg: '#6b7280', text: '#ffffff' }
  };
  
  const priorityColor = priorityColors[notification.priority as keyof typeof priorityColors] || priorityColors.medium;
  const priorityBadge = `
    <div style="display: inline-block; background-color: ${priorityColor.bg}; color: ${priorityColor.text}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px;">
      ${notification.priority} Priority
    </div>
  `;

  let subject = '';
  let content = '';
  let actionUrl = '';
  let actionText = '';

  // Generate content based on notification type
  switch (notification.type) {
    // BOOKING NOTIFICATIONS (High Priority for Carers)
    case 'booking':
      if (notification.message.includes('assigned')) {
        subject = '🚨 New Booking Assigned';
        actionUrl = `${siteUrl}/bookings`;
        actionText = 'View Booking';
        content = `
          <h2 style="color: #1e40af; font-size: 20px; margin-bottom: 16px;">New Booking Assignment</h2>
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
            ${notification.message}
          </p>
          <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af; font-weight: 600;">⏰ Action Required</p>
            <p style="margin: 8px 0 0 0; color: #374151;">Please review this booking and confirm your availability.</p>
          </div>
        `;
      } else if (notification.message.includes('rescheduled')) {
        subject = '📅 Booking Rescheduled';
        actionUrl = `${siteUrl}/bookings`;
        actionText = 'View Updated Booking';
        content = `
          <h2 style="color: #1e40af; font-size: 20px; margin-bottom: 16px;">Booking Schedule Changed</h2>
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
            ${notification.message}
          </p>
          <p style="font-size: 14px; color: #6b7280;">Please check the new timing and update your schedule accordingly.</p>
        `;
      } else if (notification.message.includes('overdue')) {
        subject = '⚠️ Overdue Booking Alert';
        actionUrl = `${siteUrl}/bookings`;
        actionText = 'View Overdue Bookings';
        content = `
          <h2 style="color: #dc2626; font-size: 20px; margin-bottom: 16px;">Overdue Booking Detected</h2>
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
            ${notification.message}
          </p>
          <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
            <p style="margin: 0; color: #dc2626; font-weight: 600;">⚠️ Urgent Action Required</p>
            <p style="margin: 8px 0 0 0; color: #374151;">This booking requires immediate attention.</p>
          </div>
        `;
      } else if (notification.message.includes('unassigned')) {
        subject = '🚨 Unassigned Bookings Require Staff Allocation';
        actionUrl = `${siteUrl}/bookings`;
        actionText = 'Assign Staff';
        content = `
          <h2 style="color: #ea580c; font-size: 20px; margin-bottom: 16px;">Staff Assignment Needed</h2>
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
            ${notification.message}
          </p>
          <div style="background-color: #fff7ed; padding: 16px; border-radius: 8px; border-left: 4px solid #ea580c; margin: 20px 0;">
            <p style="margin: 0; color: #ea580c; font-weight: 600;">Action Required</p>
            <p style="margin: 8px 0 0 0; color: #374151;">Please assign qualified staff to these bookings as soon as possible.</p>
          </div>
        `;
      }
      break;

    // STAFF/SYSTEM NOTIFICATIONS (High Priority for Administrators)
    case 'staff':
      if (notification.message.includes('service report')) {
        subject = '📋 New Service Report Submitted';
        actionUrl = `${siteUrl}/service-reports`;
        actionText = 'Review Report';
        content = `
          <h2 style="color: #1e40af; font-size: 20px; margin-bottom: 16px;">Service Report Pending Review</h2>
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
            ${notification.message}
          </p>
          <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #374151;">Please review and approve or request revisions for this service report.</p>
          </div>
        `;
      } else if (notification.message.includes('approved')) {
        subject = '✅ Service Report Approved';
        actionUrl = `${siteUrl}/service-reports`;
        actionText = 'View Report';
        content = `
          <h2 style="color: #16a34a; font-size: 20px; margin-bottom: 16px;">Report Approved</h2>
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
            ${notification.message}
          </p>
        `;
      } else if (notification.message.includes('rejected')) {
        subject = '❌ Service Report Requires Revision';
        actionUrl = `${siteUrl}/service-reports`;
        actionText = 'View Feedback';
        content = `
          <h2 style="color: #dc2626; font-size: 20px; margin-bottom: 16px;">Revision Requested</h2>
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
            ${notification.message}
          </p>
          <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
            <p style="margin: 0; color: #374151;">Please review the feedback and submit a revised report.</p>
          </div>
        `;
      } else if (notification.message.includes('document expiring')) {
        subject = '📄 Staff Document Expiring Soon';
        actionUrl = `${siteUrl}/staff`;
        actionText = 'View Documents';
        content = `
          <h2 style="color: #ea580c; font-size: 20px; margin-bottom: 16px;">Document Expiration Alert</h2>
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
            ${notification.message}
          </p>
          <div style="background-color: #fff7ed; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #374151;">Please ensure these documents are renewed before expiration to maintain compliance.</p>
          </div>
        `;
      } else if (notification.message.includes('training')) {
        subject = '🎓 Training Alert';
        actionUrl = `${siteUrl}/training`;
        actionText = 'View Training';
        content = `
          <h2 style="color: #7c3aed; font-size: 20px; margin-bottom: 16px;">Training Notification</h2>
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
            ${notification.message}
          </p>
        `;
      }
      break;

    // CLIENT NOTIFICATIONS
    case 'client':
      if (notification.message.includes('care plan')) {
        subject = '📋 Care Plan Update';
        actionUrl = `${siteUrl}/care-plans`;
        actionText = 'View Care Plan';
        content = `
          <h2 style="color: #1e40af; font-size: 20px; margin-bottom: 16px;">Care Plan Notification</h2>
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
            ${notification.message}
          </p>
        `;
      } else if (notification.message.includes('compliance')) {
        subject = '⚠️ Client Compliance Alert';
        actionUrl = `${siteUrl}/clients`;
        actionText = 'View Client Profile';
        content = `
          <h2 style="color: #dc2626; font-size: 20px; margin-bottom: 16px;">Compliance Issue Detected</h2>
          <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
            ${notification.message}
          </p>
          <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #374151;">Please review and address this compliance concern.</p>
          </div>
        `;
      }
      break;

    // MEDICATION NOTIFICATIONS
    case 'medication':
      subject = '💊 Medication Alert';
      actionUrl = `${siteUrl}/medications`;
      actionText = 'View Medications';
      content = `
        <h2 style="color: #7c3aed; font-size: 20px; margin-bottom: 16px;">Medication Notification</h2>
        <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
          ${notification.message}
        </p>
        <div style="background-color: #faf5ff; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #374151;">Please ensure proper medication administration and documentation.</p>
        </div>
      `;
      break;

    // APPOINTMENT NOTIFICATIONS
    case 'appointment':
      subject = '📅 Appointment Notification';
      actionUrl = `${siteUrl}/appointments`;
      actionText = 'View Appointments';
      content = `
        <h2 style="color: #1e40af; font-size: 20px; margin-bottom: 16px;">Appointment Update</h2>
        <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
          ${notification.message}
        </p>
      `;
      break;

    // DEMO REQUEST (For Administrators)
    case 'demo_request':
      subject = '🎯 New Demo Request Received';
      actionUrl = `${siteUrl}/demo-requests`;
      actionText = 'View Request';
      content = `
        <h2 style="color: #16a34a; font-size: 20px; margin-bottom: 16px;">New Demo Request</h2>
        <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
          ${notification.message}
        </p>
        <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #374151;">Please follow up with this potential client within 24 hours.</p>
        </div>
      `;
      break;

    // MESSAGE NOTIFICATIONS
    case 'message':
      subject = '💬 New Message';
      actionUrl = `${siteUrl}/messages`;
      actionText = 'View Message';
      content = `
        <h2 style="color: #1e40af; font-size: 20px; margin-bottom: 16px;">New Message Received</h2>
        <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
          ${notification.message}
        </p>
      `;
      break;

    // SYSTEM NOTIFICATIONS
    case 'system':
      subject = '🔔 System Alert';
      actionUrl = siteUrl;
      actionText = 'Go to Dashboard';
      content = `
        <h2 style="color: #dc2626; font-size: 20px; margin-bottom: 16px;">System Notification</h2>
        <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
          ${notification.message}
        </p>
      `;
      break;

    // DEFAULT CASE
    default:
      subject = `${notification.title}`;
      actionUrl = siteUrl;
      actionText = 'View Details';
      content = `
        <h2 style="color: #1e40af; font-size: 20px; margin-bottom: 16px;">${notification.title}</h2>
        <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
          ${notification.message}
        </p>
      `;
  }

  // Add action button if URL is provided
  const actionButton = actionUrl ? `
    <div style="margin: 32px 0;">
      <a href="${actionUrl}" class="button" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        ${actionText}
      </a>
    </div>
  ` : '';

  // Combine all content
  const htmlContent = `
    ${greeting}
    ${priorityBadge}
    ${content}
    ${actionButton}
    <p style="font-size: 14px; color: #6b7280; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
      <strong>Need help?</strong> Contact your administrator or visit our support page.
    </p>
  `;

  return {
    subject,
    htmlContent
  };
};
