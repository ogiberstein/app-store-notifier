import { Resend } from 'resend';

let resend: Resend | null = null;

// This function ensures the Resend client is only created after env vars are loaded,
// and only when it's actually needed.
const getResendClient = () => {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set in environment variables.');
      throw new Error('Server configuration error: RESEND_API_KEY is missing.');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

interface EmailParams {
  to: string;
  subject: string;
  htmlBody: string;
}

/**
 * Sends an email using Resend.
 *
 * @param params - The email parameters.
 */
export async function sendEmail({
  to,
  subject,
  htmlBody,
}: EmailParams): Promise<void> {
  const resendClient = getResendClient(); // Get the client on-demand
  const fromEmail = process.env.EMAIL_FROM_ADDRESS; // Get the from address on-demand

  if (!fromEmail) {
    console.error('EMAIL_FROM_ADDRESS is not set in environment variables.');
    throw new Error('Server configuration error: EMAIL_FROM_ADDRESS is missing.');
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: htmlBody,
    });

    if (error) {
      console.error(`Resend API Error: ${error.message}`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log(`Email sent successfully to ${to}. ID: ${data?.id}`);
  } catch (exception) {
    console.error('An unexpected error occurred while sending email:', exception);
    throw new Error('An unexpected error occurred while trying to send email.');
  }
} 