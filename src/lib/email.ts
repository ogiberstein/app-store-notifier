import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.EMAIL_FROM_ADDRESS;

interface EmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  // from?: string; // Usually set globally or derived from EMAIL_FROM_ADDRESS
}

/**
 * Sends an email.
 * FOR MVP: This function currently logs to the console instead of sending a real email.
 * TODO: Uncomment and configure a real email provider like Resend, SendGrid, etc.
 * 
 * @param params - The email parameters.
 * @param params.to - The recipient's email address.
 * @param params.subject - The subject of the email.
 * @param params.htmlBody - The HTML content of the email.
 */
export async function sendEmail({
  to,
  subject,
  htmlBody,
}: EmailParams): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set in environment variables.');
    throw new Error('Server configuration error: RESEND_API_KEY is missing.');
  }
  if (!fromEmail) {
    console.error('EMAIL_FROM_ADDRESS is not set in environment variables.');
    throw new Error('Server configuration error: EMAIL_FROM_ADDRESS is missing.');
  }

  try {
    const { data, error } = await resend.emails.send({
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