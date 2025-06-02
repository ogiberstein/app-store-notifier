import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const emailFromAddress = process.env.EMAIL_FROM_ADDRESS;

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
    console.error('RESEND_API_KEY not found. Cannot send emails.');
    // Optionally, throw an error or return early if preferred
    // For now, we'll log and attempt to proceed, which will likely fail at resend.emails.send()
    // but this makes the error more explicit if the key is missing.
    throw new Error('RESEND_API_KEY is not configured.');
  }
  if (!emailFromAddress) {
    console.error('EMAIL_FROM_ADDRESS not found. Cannot send emails.');
    throw new Error('EMAIL_FROM_ADDRESS is not configured.');
  }

  try {
    console.log(`Attempting to send email to: ${to} from: ${emailFromAddress}`);
    const { data, error } = await resend.emails.send({
      from: emailFromAddress, // Your verified Resend 'From' address
      to: [to], // Must be an array
      subject: subject,
      html: htmlBody,
    });

    if (error) {
      console.error(`Error sending email to ${to} via Resend:`, error);
      // Log the full error object for more details if possible
      console.error('Resend error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to send email via Resend: ${error.message}`);
    }

    console.log(`Email sent successfully to ${to} via Resend. ID: ${data?.id}`);
  } catch (error: any) {
    console.error(`General error when trying to send email to ${to}:`, error);
    // Log additional details if it's a Resend-specific error structure not caught above
    if (error.response && error.response.data) {
      console.error('Catch block error details:', JSON.stringify(error.response.data, null, 2));
    }
    // Re-throw the error so the caller (e.g., the cron job) knows it failed.
    throw new Error(`Failed to send email: ${error.message}`);
  }
} 