// import { Resend } from 'resend'; // Example import for Resend

// const resend = new Resend(process.env.RESEND_API_KEY);
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
    console.warn(
      'RESEND_API_KEY not found in .env.local. Email sending is mocked.'
    );
  }
  if (!emailFromAddress) {
    console.warn(
      'EMAIL_FROM_ADDRESS not found in .env.local. Email sending is mocked.'
    );
  }

  console.log('---- Sending Email (Mock) ----');
  console.log(`To: ${to}`);
  console.log(`From: ${emailFromAddress || 'fallback@example.com'}`); // Fallback for mock
  console.log(`Subject: ${subject}`);
  console.log(`HTML Body: ${htmlBody.substring(0, 200)}...`); // Log a snippet
  console.log('-------------------------------');

  // // Example using Resend (uncomment and configure when ready)
  // try {
  //   if (!emailFromAddress) {
  //     throw new Error('EMAIL_FROM_ADDRESS is not configured in .env.local');
  //   }
  //   const { data, error } = await resend.emails.send({
  //     from: emailFromAddress, // e.g., 'App Store Notifier <onboarding@resend.dev>'
  //     to: [to],
  //     subject: subject,
  //     html: htmlBody,
  //   });

  //   if (error) {
  //     console.error('Error sending email via Resend:', error);
  //     throw error; // Re-throw to be caught by caller if needed
  //   }

  //   console.log('Email sent successfully via Resend:', data);
  //   return;
  // } catch (error) {
  //   console.error('Failed to send email:', error);
  //   // Fallback or re-throw, depending on desired error handling
  //   // For now, if RESEND_API_KEY is set, we re-throw to indicate a real problem.
  //   if (process.env.RESEND_API_KEY) {
  //       throw error;
  //   }
  //   // If no API key, we assume mock mode was intended, so just log and continue.
  // }
  
  // Simulate a short delay for mock sending
  await new Promise(resolve => setTimeout(resolve, 300)); 
} 