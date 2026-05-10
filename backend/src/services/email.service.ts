import nodemailer from "nodemailer";

interface VerificationEmailPayload {
  email: string;
  name?: string;
  token: string;
  baseUrl: string;
}

export async function sendVerificationEmail(payload: VerificationEmailPayload) {
  const from = process.env.EMAIL_FROM || "no-reply@mathvision.ai";
  const verifyLink = `${payload.baseUrl.replace(/\/$/, "")}/auth/verify?token=${encodeURIComponent(
    payload.token
  )}`;

  if (!process.env.SMTP_HOST) {
    // eslint-disable-next-line no-console
    console.warn("SMTP is not configured. Verification link:", verifyLink);
    return { verifyLink };
  }

  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  const message = {
    from,
    to: payload.email,
    subject: "Verify your MathVision account",
    html: `
      <p>Hi${payload.name ? ` ${payload.name}` : ""},</p>
      <p>Thanks for signing up for MathVision. Please verify your email address by clicking the link below:</p>
      <p><a href="${verifyLink}">Verify my email</a></p>
      <p>If you did not request this, you can safely ignore this message.</p>
    `,
  };

  const result = await transporter.sendMail(message);
  return { verifyLink, messageId: result.messageId };
}
