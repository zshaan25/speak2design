import nodemailer from 'nodemailer';

// Build a transporter only when SMTP is configured. When it isn't, the app falls
// back to returning the reset link directly (dev/demo mode) so the flow still works.
const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  : null;

export const isMailConfigured = () => smtpConfigured;

export const sendPasswordResetEmail = async (to, resetLink) => {
  if (!transporter) return false;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || `Speak2Design <${process.env.SMTP_USER}>`,
    to,
    subject: 'Reset your Speak2Design password',
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#0052CC;margin:0 0 8px">Speak2Design</h2>
        <p style="color:#334155">We received a request to reset your password. Click below to choose a new one. This link expires in 1 hour.</p>
        <p style="margin:24px 0">
          <a href="${resetLink}" style="background:#0052CC;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold">Reset Password</a>
        </p>
        <p style="color:#94a3b8;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
      </div>`
  });
  return true;
};
