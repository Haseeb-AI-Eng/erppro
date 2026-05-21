const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_PORT === '465',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({ from: `"ERP System" <${process.env.SMTP_USER}>`, to, subject, html });
  } catch (err) {
    console.error('Email error:', err.message || err);
  }
};

const sendWelcomeEmail = (employee, orgName, password) => sendEmail({
  to: employee.email,
  subject: `Welcome to ${orgName} - ERP System`,
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <h2 style="color:#6366f1">Welcome to ${orgName}!</h2>
    <p>Hello <strong>${employee.name}</strong>,</p>
    <p>Your ERP account has been created. Here are your login details:</p>
    <div style="background:#f3f4f6;padding:16px;border-radius:8px">
      <p><strong>Email:</strong> ${employee.email}</p>
      <p><strong>Password:</strong> ${password}</p>
    </div>
    <p>Please login and change your password immediately.</p>
  </div>`
});

const sendOrgSignupEmail = (organization, ownerName) => sendEmail({
  to: organization.email,
  subject: `Welcome to ShineERP, ${organization.name}`,
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <h2 style="color:#6366f1">Organization Signup Confirmed</h2>
    <p>Hello ${ownerName || 'Team'},</p>
    <p>Your organization <strong>${organization.name}</strong> has been successfully registered on ShineERP.</p>
    <div style="background:#f3f4f6;padding:16px;border-radius:8px">
      <p><strong>Company Email:</strong> ${organization.email}</p>
      <p><strong>Organization Code:</strong> ${organization.code}</p>
      <p>You can now log in using your registered email and password.</p>
    </div>
    <p>If you did not request this registration, please contact support immediately.</p>
  </div>`
});

const sendAdminOrgAlert = (organization) => sendEmail({
  to: process.env.SUPER_ADMIN_EMAIL,
  subject: `New Organization Registered: ${organization.name}`,
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <h2 style="color:#6366f1">New Organization Signup</h2>
    <p>A new organization has registered on ShineERP.</p>
    <div style="background:#f3f4f6;padding:16px;border-radius:8px">
      <p><strong>Name:</strong> ${organization.name}</p>
      <p><strong>Email:</strong> ${organization.email}</p>
      <p><strong>Code:</strong> ${organization.code}</p>
      <p><strong>Industry:</strong> ${organization.industry}</p>
      <p><strong>Size:</strong> ${organization.size}</p>
    </div>
  </div>`
});

const sendPayslipEmail = (employee, payroll) => sendEmail({
  to: employee.email,
  subject: `Your Payslip for ${payroll.month}/${payroll.year}`,
  html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <h2 style="color:#6366f1">Your Payslip is Ready</h2>
    <p>Hello <strong>${employee.name}</strong>,</p>
    <p>Your salary for <strong>${payroll.month}/${payroll.year}</strong> has been marked as paid.</p>
    <div style="background:#f3f4f6;padding:16px;border-radius:8px">
      <p><strong>Basic Salary:</strong> ${payroll.basicSalary}</p>
      <p><strong>Working Days:</strong> ${payroll.workingDays}</p>
      <p><strong>Present Days:</strong> ${payroll.presentDays}</p>
      <p><strong>Absent Days:</strong> ${payroll.absentDays}</p>
      <p><strong>Overtime Hours:</strong> ${payroll.overtimeHours}</p>
      <p><strong>Overtime Pay:</strong> ${payroll.overtimePay}</p>
      <p><strong>Deductions:</strong> ${payroll.deductions}</p>
      <p><strong>Tax:</strong> ${payroll.tax}</p>
      <p><strong>Net Salary:</strong> ${payroll.netSalary}</p>
    </div>
    <p>If you have any questions, please contact your HR team.</p>
  </div>`
});

module.exports = { sendEmail, sendWelcomeEmail, sendPayslipEmail, sendOrgSignupEmail, sendAdminOrgAlert };
