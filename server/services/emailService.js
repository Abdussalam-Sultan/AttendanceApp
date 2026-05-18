import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[EmailService] SMTP credentials missing. Emails will not be sent.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const client = getTransporter();
  if (!client) return { success: false, error: "SMTP not configured" };

  try {
    const info = await client.sendMail({
      from: process.env.SMTP_FROM || '"DoorLog" <noreply@doorlog.com>',
      to,
      subject,
      text,
      html,
    });

    console.log(`[EmailService] Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[EmailService] Error sending email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Premium DoorLog Email Layout
 * - Clean SaaS look (Stripe/Notion vibe)
 * - Mobile responsive
 * - Modern buttons, pills, info cards
 */
const baseLayout = (content, previewText = "") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DoorLog Notification</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f6f7fb;
      font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
    }

    a {
      text-decoration: none;
    }

    .email-bg {
      padding: 50px 18px;
      background: #f6f7fb;
    }

    .card {
      max-width: 620px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 22px;
      overflow: hidden;
      border: 1px solid #e9edf5;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06);
    }

    .top-strip {
      height: 6px;
      background: linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899);
    }

    .header {
      padding: 34px 30px 20px;
      text-align: center;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-weight: 900;
      font-size: 20px;
      letter-spacing: -0.03em;
      color: #0f172a;
    }

    .brand-badge {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 12px 20px rgba(79, 70, 229, 0.25);
    }

    .brand-badge span {
      font-size: 18px;
      font-weight: 900;
      color: white;
      letter-spacing: -0.04em;
    }

    .subtext {
      margin-top: 12px;
      font-size: 14px;
      color: #64748b;
      line-height: 1.6;
    }

    .content {
      padding: 10px 34px 38px;
    }

    h2 {
      margin: 0;
      margin-top: 18px;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.03em;
      color: #0f172a;
    }

    p {
      font-size: 15px;
      line-height: 1.75;
      color: #334155;
      margin-top: 14px;
    }

    .divider {
      height: 1px;
      background: #eef2f7;
      margin: 26px 0;
    }

    .info-box {
      margin-top: 22px;
      background: #f8fafc;
      border-radius: 18px;
      padding: 20px 18px;
      border: 1px solid #eef2f7;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 10px;
      border-bottom: 1px solid #eef2f7;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .label {
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      width: 130px;
    }

    .value {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      flex: 1;
      text-align: right;
    }

    .cta-wrap {
      text-align: center;
      margin-top: 28px;
    }

    .button {
      display: inline-block;
      padding: 14px 26px;
      border-radius: 14px;
      font-weight: 800;
      font-size: 14px;
      color: white !important;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      box-shadow: 0 18px 30px rgba(79, 70, 229, 0.25);
    }

    .button:hover {
      opacity: 0.95;
    }

    .note {
      margin-top: 26px;
      font-size: 13px;
      color: #64748b;
      line-height: 1.7;
      background: #f8fafc;
      padding: 14px 16px;
      border-radius: 14px;
      border: 1px solid #eef2f7;
    }

    .warning {
      margin-top: 22px;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.7;
      color: #b91c1c;
      background: rgba(239, 68, 68, 0.08);
      padding: 14px 16px;
      border-radius: 14px;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }

    .footer {
      text-align: center;
      padding: 22px 20px 30px;
      font-size: 12px;
      color: #94a3b8;
      background: #fbfcfe;
      border-top: 1px solid #eef2f7;
    }

    .footer a {
      color: #64748b;
      font-weight: 600;
    }

    .status-pill {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.03em;
    }

    .pill-green {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
    }

    .pill-red {
      background: rgba(239, 68, 68, 0.12);
      color: #dc2626;
    }

    .pill-blue {
      background: rgba(59, 130, 246, 0.12);
      color: #2563eb;
    }

    @media (max-width: 600px) {
      .content {
        padding: 8px 20px 34px;
      }

      .header {
        padding: 28px 18px 16px;
      }

      h2 {
        font-size: 22px;
      }

      .value {
        text-align: left;
      }

      .info-row {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  </style>
</head>

<body>
  <div style="display:none;max-height:0px;overflow:hidden;">
    ${previewText}
  </div>

  <div class="email-bg">
    <div class="card">
      <div class="top-strip"></div>

      <div class="header">
        <div class="brand">
          <div class="brand-badge">
            <span>D</span>
          </div>
          DoorLog
        </div>
        <div class="subtext">
          Workforce Attendance and Access Management
        </div>
      </div>

      <div class="content">
        ${content}
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} DoorLog. All rights reserved.<br/>
        This is an automated notification. If you need help, contact support.
      </div>
    </div>
  </div>
</body>
</html>
`;

const appUrl = process.env.APP_URL || "http://localhost:3000";

export const emailTemplates = {
  verification: (user, token) => ({
    subject: "Verify your DoorLog account",
    html: baseLayout(
      `
        <h2>Verify your email</h2>
        <p>
          Hi <strong>${user.name}</strong>, welcome to DoorLog.
          Please confirm your email address to activate your account.
        </p>

        <div class="cta-wrap">
          <a href="${appUrl}/verify-email?token=${token}" class="button">
            Verify Email Address
          </a>
        </div>

        <div class="note">
          If you did not create an account with DoorLog, you can safely ignore this email.
        </div>
      `,
      "Verify your email address to activate your DoorLog account."
    ),
  }),

  welcome: (user) => ({
    subject: `Welcome to DoorLog, ${user.name}!`,
    html: baseLayout(
      `
        <h2>Welcome aboard 🎉</h2>
        <p>
          Your account is now active and ready to use.
          You can now log in and begin tracking attendance securely.
        </p>

        <div class="info-box">
          <div class="info-row">
            <div class="label">Employee ID</div>
            <div class="value">${user.employeeId || "Not Assigned"}</div>
          </div>
          <div class="info-row">
            <div class="label">Access Level</div>
            <div class="value">${user.role || "User"}</div>
          </div>
        </div>

        <div class="cta-wrap">
          <a href="${appUrl}" class="button">Go to Dashboard</a>
        </div>

        <div class="note">
          Tip: Keep your profile updated so your attendance records stay accurate.
        </div>
      `,
      "Your DoorLog account is now active."
    ),
  }),

  passwordChange: (user) => ({
    subject: "Security Alert: Password Updated",
    html: baseLayout(
      `
        <h2>Password changed</h2>
        <p>
          Hi <strong>${user.name}</strong>, this is a confirmation that your DoorLog password
          was successfully updated.
        </p>

        <div class="info-box">
          <div class="info-row">
            <div class="label">Account</div>
            <div class="value">${user.email}</div>
          </div>
          <div class="info-row">
            <div class="label">Time</div>
            <div class="value">${new Date().toLocaleString()}</div>
          </div>
          <div class="info-row">
            <div class="label">Status</div>
            <div class="value"><span class="status-pill pill-blue">SECURED</span></div>
          </div>
        </div>

        <div class="warning">
          If you did not make this change, contact your administrator or IT department immediately.
        </div>
      `,
      "Your DoorLog password was updated."
    ),
  }),

  passwordReset: (user, token) => ({
    subject: "Reset your DoorLog password",
    html: baseLayout(
      `
        <h2>Reset your password</h2>
        <p>
          Hi <strong>${user.name}</strong>, we received a request to reset your DoorLog password.
          Click the button below to choose a new one.
        </p>

        <div class="cta-wrap">
          <a href="${appUrl}/reset-password?token=${token}" class="button">
            Reset Password
          </a>
        </div>

        <div class="note">
          This link will expire in <strong>1 hour</strong>.
          If you did not request this reset, you can safely ignore this email.
        </div>
      `,
      "Reset your DoorLog password using the secure link."
    ),
  }),

  leaveRequest: (user, leave) => ({
    subject: `Leave Request Submitted: ${user.name}`,
    html: baseLayout(
      `
        <h2>Leave request pending</h2>
        <p>
          A new leave request has been submitted and requires review.
        </p>

        <div class="info-box">
          <div class="info-row">
            <div class="label">Employee</div>
            <div class="value">${user.name}</div>
          </div>
          <div class="info-row">
            <div class="label">Type</div>
            <div class="value">${leave.type}</div>
          </div>
          <div class="info-row">
            <div class="label">Duration</div>
            <div class="value">${leave.date}</div>
          </div>
          <div class="info-row">
            <div class="label">Reason</div>
            <div class="value">${leave.reason || "Not specified"}</div>
          </div>
        </div>

        <div class="cta-wrap">
          <a href="${appUrl}" class="button">Review Request</a>
        </div>

        <div class="note">
          Reviewing leave requests early helps keep schedules stable.
        </div>
      `,
      `New leave request from ${user.name}.`
    ),
  }),

  leaveStatusUpdate: (leave, status) => {
    const isApproved = status.toLowerCase() === "approved";

    return {
      subject: `Leave Request ${status}`,
      html: baseLayout(
        `
          <h2>Leave request update</h2>
          <p>
            Your leave request has been reviewed. See the updated status below.
          </p>

          <div class="info-box">
            <div class="info-row">
              <div class="label">Leave Type</div>
              <div class="value">${leave.type}</div>
            </div>
            <div class="info-row">
              <div class="label">Dates</div>
              <div class="value">${leave.date}</div>
            </div>
            <div class="info-row">
              <div class="label">Decision</div>
              <div class="value">
                <span class="status-pill ${isApproved ? "pill-green" : "pill-red"}">
                  ${status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div class="cta-wrap">
            <a href="${appUrl}" class="button">View Request</a>
          </div>

          <div class="note">
            If you believe this decision is incorrect, please contact HR or your supervisor.
          </div>
        `,
        `Your leave request was ${status}.`
      ),
    };
  },

  attendanceCorrection: (record) => ({
    subject: "Attendance Record Updated",
    html: baseLayout(
      `
        <h2>Attendance record corrected</h2>
        <p>
          An administrator has manually adjusted your attendance record for accuracy.
        </p>

        <div class="info-box">
          <div class="info-row">
            <div class="label">Date</div>
            <div class="value">${record.date}</div>
          </div>
          <div class="info-row">
            <div class="label">Status</div>
            <div class="value">${record.status}</div>
          </div>
          <div class="info-row">
            <div class="label">Check In</div>
            <div class="value">${record.checkIn || "N/A"}</div>
          </div>
          <div class="info-row">
            <div class="label">Check Out</div>
            <div class="value">${record.checkOut || "N/A"}</div>
          </div>
        </div>

        <div class="cta-wrap">
          <a href="${appUrl}" class="button">View Attendance</a>
        </div>

        <div class="note">
          If this update looks incorrect, report it immediately to your administrator.
        </div>
      `,
      `Your attendance record for ${record.date} was updated.`
    ),
  }),

  policyUpdate: () => ({
    subject: "System Policy Update",
    html: baseLayout(
      `
        <h2>Policy updates published</h2>
        <p>
          Important updates have been made to workplace attendance policies.
          These changes may affect check-ins, grace periods, or geolocation rules.
        </p>

        <div class="cta-wrap">
          <a href="${appUrl}" class="button">Review Policies</a>
        </div>

        <div class="note">
          Staying informed helps you avoid attendance penalties.
        </div>
      `,
      "Administration has updated attendance policies."
    ),
  }),

  announcement: (announcement) => ({
    subject: `Announcement: ${announcement.title}`,
    html: baseLayout(
      `
        <h2>${announcement.title}</h2>
        <p>
          A new internal announcement was posted in
          <strong>${announcement.category || "General"}</strong>.
        </p>

        <div class="info-box" style="line-height: 1.8;">
          ${announcement.content}
        </div>

        <div class="cta-wrap">
          <a href="${appUrl}" class="button">Open DoorLog</a>
        </div>

        <div class="note">
          Stay updated so you never miss important information.
        </div>
      `,
      announcement.title
    ),
  }),

  absenceAlert: (user, date) => ({
    subject: `Absence Warning: ${date}`,
    html: baseLayout(
      `
        <h2>Missing attendance entry</h2>
        <p>
          Hi <strong>${user.name}</strong>, our records show no attendance activity for your account on
          <strong>${date}</strong>.
        </p>

        <div class="warning">
          If this is incorrect, please submit a correction request immediately.
        </div>

        <div class="cta-wrap">
          <a href="${appUrl}" class="button">Submit Correction</a>
        </div>

        <div class="note">
          If you were absent, ensure your leave request is submitted to avoid penalties.
        </div>
      `,
      `Absence recorded for ${date}`
    ),
  }),
};