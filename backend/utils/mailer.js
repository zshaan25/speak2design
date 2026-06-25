import nodemailer from 'nodemailer';

// ─── Lazy transporter ─────────────────────────────────────────────────────────
// We build the transporter on the first actual send, not at module load time.
// This guarantees env vars (loaded by 'dotenv/config' in server.js) are fully
// available, and lets you hot-swap credentials without restarting the server.

let _transporter = null;

const isSmtpConfigured = () =>
  !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!isSmtpConfigured()) return null;

  // Re-use cached transporter if credentials haven't changed.
  if (_transporter) return _transporter;

  // Gmail App Passwords are displayed with spaces (e.g. "abcd efgh ijkl mnop")
  // but SMTP auth requires them without spaces. Strip them automatically.
  const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465, // 465 = SSL, 587 = STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: smtpPass
    },
    // Avoids cert issues on some networks / VPNs
    tls: { rejectUnauthorized: false }
  });

  return _transporter;
};

// ─── Public API ───────────────────────────────────────────────────────────────
export const isMailConfigured = () => isSmtpConfigured();

export const sendPasswordResetEmail = async (to, resetLink) => {
  const transport = getTransporter();
  if (!transport) {
    console.warn('>>> [MAIL] SMTP not configured — skipping email send.');
    return false;
  }

  const from = process.env.SMTP_FROM || `Speak2Design <${process.env.SMTP_USER}>`;
  console.log(`>>> [MAIL] Sending password reset email to: ${to} via ${process.env.SMTP_HOST}`);

  try {
  await transport.sendMail({
    from,
    to,
    subject: 'Reset your Speak2Design password',
    text: `Click this link to reset your password (expires in 1 hour):\n\n${resetLink}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">

        <!-- Header -->
        <tr>
          <td style="background:#0052CC;padding:28px 32px">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px">🎙 Speak2Design</span>
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;font-weight:700">Reset your password</h2>
            <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6">
              We received a request to reset the password for your Speak2Design account
              associated with <strong>${to}</strong>.<br><br>
              Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px">
              <tr>
                <td style="border-radius:10px;background:#0052CC">
                  <a href="${resetLink}"
                     style="display:inline-block;padding:14px 28px;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px">
                    Reset Password →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Fallback link -->
            <p style="margin:0 0 24px;color:#94a3b8;font-size:12px">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetLink}" style="color:#0052CC;word-break:break-all">${resetLink}</a>
            </p>

            <!-- Divider -->
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px">

            <p style="margin:0;color:#94a3b8;font-size:12px">
              If you didn't request a password reset, you can safely ignore this email —
              your password will not change. For help, reply to this email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0">
            <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center">
              Speak2Design · Final Year Project F25-106 · University of Lahore
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
  });
  console.log(`>>> [MAIL] ✓ Email sent successfully to ${to}`);
  return true;
  } catch (err) {
    // Log the full SMTP error — check terminal output to see what went wrong.
    // Common causes: wrong App Password, 2FA not enabled, Gmail blocked the send.
    console.error('>>> [MAIL] ✗ SMTP send failed:');
    console.error('    Code   :', err.code);
    console.error('    Message:', err.message);
    console.error('    Host   :', process.env.SMTP_HOST);
    console.error('    User   :', process.env.SMTP_USER);
    // Reset cached transporter so the next attempt rebuilds it with fresh settings
    _transporter = null;
    throw err; // re-throw so authController logs it and returns devLink
  }
};
