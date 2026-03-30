/**
 * Mail service utility
 *
 * Handles sending transactional emails via Maileroo API,
 * including password reset emails and generic mail requests.
 */

const MAILEROO_API_KEY = process.env.MAILEROO_API_KEY;
const MAILEROO_BASE_URL = process.env.MAILEROO_BASE_URL;
const DEFAULT_FROM = process.env.MAILEROO_FROM;
if (!MAILEROO_API_KEY) {
  console.warn("MAILEROO_API_KEY is not set, Maileroo emails will fail.");
}

export type MailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
};

export type MailResult = {
  ok: boolean;
  status: number;
  body: unknown;
};

/**
 * Sends an email using the Maileroo API.
 *
 * Handles API request construction, authentication, and response parsing.
 *
 * @param options - Email options including recipient, subject, and content
 * @returns Result object containing success status, HTTP status, and response body
 */
export async function sendMail(options: MailOptions): Promise<MailResult> {
  const { to, subject, text, html, from } = options;

  if (!MAILEROO_API_KEY) {
    return {
      ok: false,
      status: 500,
      body: "Missing Maileroo API key",
    };
  }

  const payload = {
    from: { "address": from ?? DEFAULT_FROM },
    to: [{ "address": to }],
    subject,
    text,
    html,
  };

  const response = await fetch(MAILEROO_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MAILEROO_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch (err) {
    body = await response.text();
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

/**
 * Sends a password reset email to a user.
 *
 * Generates both text and HTML email content and sends it via the Maileroo service.
 * Logs an error if the email fails to send.
 *
 * @param params - Email details including recipient, optional name, and reset URL
 * @returns Result of the email send operation
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  name?: string;
  resetUrl: string;
}) {
  const { to, name, resetUrl } = params;
  const subject = "Reset your password";
  const safeName = name ?? "there";

  const text = `Hi ${safeName},\n\n` +
    `We received a request to reset your password. Click the link below to set a new password:\n\n` +
    `${resetUrl}\n\n` +
    `If you didn\'t request this, you can safely ignore this email. This link will expire in 1 hour.\n\n` +
    `Thanks,\n` +
    `The Time Manage Team`;

  const html = `<p>Hi ${safeName},</p>` +
    `<p>We received a request to reset your password. Click the link below to set a new password:</p>` +
    `<p><a href="${resetUrl}">${resetUrl}</a></p>` +
    `<p>If you didn\'t request this, you can safely ignore this email. This link will expire in 1 hour.</p>` +
    `<p>Thanks,<br/>The Time Manage Team</p>`;

  const result = await sendMail({
    to,
    subject,
    text,
    html,
  });

  if (!result.ok) {
    console.error("Failed to send password reset email", result);
  }

  return result;
}
