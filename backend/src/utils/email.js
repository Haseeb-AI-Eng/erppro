const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_PORT === '465',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { rejectUnauthorized: false }
});

// Email template wrapper with ShineERP branding
const emailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 40px 30px; text-align: center; }
    .logo { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 1px; }
    .logo-subtitle { font-size: 12px; opacity: 0.9; margin-top: 5px; font-weight: 300; letter-spacing: 2px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; line-height: 1.6; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 15px; }
    .highlight-box { background: linear-gradient(135deg, #f0f4ff 0%, #f9f5ff 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #6366f1; margin: 20px 0; }
    .highlight-box strong { color: #4f46e5; }
    .highlight-box p { margin: 8px 0; color: #374151; }
    .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 15px; }
    .button:hover { opacity: 0.9; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
    .info-item { background: #f9fafb; padding: 15px; border-radius: 6px; }
    .info-label { font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 14px; color: #1f2937; font-weight: 600; margin-top: 5px; }
    .footer { background-color: #f3f4f6; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer-text { color: #6b7280; font-size: 12px; line-height: 1.6; }
    .footer-text a { color: #6366f1; text-decoration: none; }
    .divider { height: 1px; background: #e5e7eb; margin: 20px 0; }
    .alert { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 6px; color: #991b1b; font-size: 14px; }
    .success { background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; border-radius: 6px; color: #15803d; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">✨ ShineERP</div>
      <div class="logo-subtitle">Intelligent Workforce Management</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p class="footer-text">
        © 2026 ShineERP. All rights reserved.<br>
        Questions? <a href="mailto:support@shineerp.com">Contact Support</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({ from: `"ShineERP" <${process.env.SMTP_USER}>`, to, subject, html });
  } catch (err) {
    console.error('Email error:', err.message || err);
  }
};

const sendWelcomeEmail = (employee, orgName, password) => sendEmail({
  to: employee.email,
  subject: `Welcome to ${orgName} - ShineERP`,
  html: emailTemplate(`
    <div class="greeting">
      Welcome to <strong>${orgName}</strong>, <strong>${employee.name}</strong>! 👋
    </div>
    
    <div class="section">
      <p style="color: #6b7280; line-height: 1.6;">
        Your account has been successfully created. You're now ready to access all the powerful features of ShineERP to manage your workforce efficiently.
      </p>
    </div>

    <div class="section-title">Your Login Credentials</div>
    <div class="highlight-box">
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Email Address</div>
          <div class="info-value">${employee.email}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Temporary Password</div>
          <div class="info-value" style="font-family: monospace; word-break: break-all;">${password}</div>
        </div>
      </div>
    </div>

    <div class="alert">
      ⚠️ <strong>Important:</strong> Please change your password immediately after logging in. This temporary password is for your security.
    </div>

    <div class="section" style="text-align: center; margin-top: 30px;">
      <a href="${process.env.APP_URL || 'https://shineerp.com'}" class="button">
        Go to ShineERP Dashboard
      </a>
    </div>

    <div class="divider"></div>
    
    <div class="section" style="font-size: 13px; color: #6b7280;">
      <p><strong>Need help?</strong> Check out our <a href="#" style="color: #6366f1;">Getting Started Guide</a> or reach out to your HR team.</p>
    </div>
  `)
});

const sendOrgSignupEmail = (organization, ownerName) => sendEmail({
  to: organization.email,
  subject: `Welcome to ShineERP, ${organization.name}`,
  html: emailTemplate(`
    <div class="greeting">
      Welcome to ShineERP, <strong>${ownerName || organization.name}</strong>! 🎉
    </div>
    
    <div class="section">
      <p style="color: #6b7280; line-height: 1.6;">
        Your organization <strong>${organization.name}</strong> has been successfully registered on ShineERP. You're all set to start managing your workforce with our intelligent ERP system.
      </p>
    </div>

    <div class="section-title">Organization Details</div>
    <div class="highlight-box">
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Company Name</div>
          <div class="info-value">${organization.name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Organization Code</div>
          <div class="info-value" style="font-family: monospace; font-size: 16px;">${organization.code}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${organization.email}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Industry</div>
          <div class="info-value">${organization.industry || 'N/A'}</div>
        </div>
      </div>
    </div>

    <div class="success">
      ✓ Your registration is complete and your account is active. You can now log in immediately!
    </div>

    <div class="section" style="text-align: center; margin-top: 30px;">
      <a href="${process.env.APP_URL || 'https://shineerp.com'}" class="button">
        Access ShineERP
      </a>
    </div>

    <div class="divider"></div>

    <div class="section">
      <div style="font-size: 13px; color: #6b7280;">
        <p><strong>What's next?</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Complete your organization profile</li>
          <li>Add team members and set up roles</li>
          <li>Configure your organization settings</li>
        </ul>
      </div>
    </div>
  `)
});

const sendAdminOrgAlert = (organization) => sendEmail({
  to: process.env.SUPER_ADMIN_EMAIL,
  subject: `New Organization Registered: ${organization.name}`,
  html: emailTemplate(`
    <div class="greeting">
      New Organization Signup 📊
    </div>
    
    <div class="section">
      <p style="color: #6b7280; line-height: 1.6;">
        A new organization has registered on ShineERP. Here are the details:
      </p>
    </div>

    <div class="section-title">Organization Information</div>
    <div class="highlight-box">
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Organization Name</div>
          <div class="info-value">${organization.name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Code</div>
          <div class="info-value" style="font-family: monospace;">${organization.code}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${organization.email}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Industry</div>
          <div class="info-value">${organization.industry || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Company Size</div>
          <div class="info-value">${organization.size || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Phone</div>
          <div class="info-value">${organization.phone || 'N/A'}</div>
        </div>
      </div>
    </div>

    <div class="section" style="text-align: center; margin-top: 30px;">
      <a href="${process.env.ADMIN_URL || 'https://shineerp.com/admin'}" class="button">
        Review in Admin Panel
      </a>
    </div>
  `)
});

const sendPayslipEmail = (employee, payroll) => sendEmail({
  to: employee.email,
  subject: `Your Payslip for ${payroll.month}/${payroll.year} - ShineERP`,
  html: emailTemplate(`
    <div class="greeting">
      Your Payslip is Ready 💰
    </div>
    
    <div class="section">
      <p style="color: #6b7280; line-height: 1.6;">
        Hi <strong>${employee.name}</strong>, your salary for <strong>${payroll.month}/${payroll.year}</strong> has been processed and is ready for review.
      </p>
    </div>

    <div class="section-title">Salary Breakdown</div>
    <div class="highlight-box">
      <div style="font-size: 13px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0; font-weight: 600; color: #4f46e5;">Basic Salary</td>
            <td style="padding: 8px 0; text-align: right; color: #1f2937;">₹${payroll.basicSalary}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0;">Working Days</td>
            <td style="padding: 8px 0; text-align: right;">${payroll.workingDays}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0;">Present Days</td>
            <td style="padding: 8px 0; text-align: right;">${payroll.presentDays}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0;">Absent Days</td>
            <td style="padding: 8px 0; text-align: right;">${payroll.absentDays}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0;">Overtime Hours</td>
            <td style="padding: 8px 0; text-align: right;">${payroll.overtimeHours}h</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0; color: #16a34a; font-weight: 600;">Overtime Pay</td>
            <td style="padding: 8px 0; text-align: right; color: #16a34a; font-weight: 600;">₹${payroll.overtimePay}</td>
          </tr>
          <tr style="border-bottom: 2px solid #e5e7eb;">
            <td style="padding: 8px 0; color: #dc2626;">Deductions</td>
            <td style="padding: 8px 0; text-align: right; color: #dc2626;">-₹${payroll.deductions}</td>
          </tr>
          <tr style="border-bottom: 2px solid #e5e7eb;">
            <td style="padding: 8px 0; color: #dc2626;">Tax</td>
            <td style="padding: 8px 0; text-align: right; color: #dc2626;">-₹${payroll.tax}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 700; font-size: 15px; color: #4f46e5;">Net Salary</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 15px; color: #4f46e5;">₹${payroll.netSalary}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="success">
      ✓ Your salary has been successfully processed. Payment should reflect in your account shortly.
    </div>

    <div class="section" style="text-align: center; margin-top: 30px;">
      <a href="${process.env.APP_URL || 'https://shineerp.com'}/payroll" class="button">
        View Full Payslip
      </a>
    </div>

    <div class="divider"></div>

    <div class="section" style="font-size: 13px; color: #6b7280;">
      <p>If you notice any discrepancies in your payslip, please contact your HR team immediately.</p>
    </div>
  `)
});

module.exports = { sendEmail, sendWelcomeEmail, sendPayslipEmail, sendOrgSignupEmail, sendAdminOrgAlert };
