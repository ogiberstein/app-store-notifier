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
}: EmailParams) {
  const resendClient = getResendClient(); // Get the client on-demand

  try {
    const { data, error } = await resendClient.emails.send({
      from: 'App Store Notifier <noreply@appstorereposition.com>',
      to,
      subject,
      html: htmlBody,
    });

    if (error) {
      console.error('Resend API returned an error:', error);
      throw new Error(`Failed to send email. Resend error: ${error.message}`);
    }

    console.log(`Email sent successfully to ${to}. ID: ${data?.id}`);
    return data;
  } catch (e) {
    const error = e as Error;
    console.error(`An exception occurred in sendEmail function for recipient ${to}:`, error.message);
    throw error; // Re-throw the error to be caught by the cron job
  }
} 