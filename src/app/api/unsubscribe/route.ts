import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get the list of apps before deleting
    const subscriptions = await sql`
      SELECT app_name FROM subscriptions WHERE email = ${email}
    `;
    
    const appNames = subscriptions.rows.map(row => row.app_name);

    // Delete all subscriptions
    await sql`
      DELETE FROM subscriptions
      WHERE email = ${email}
    `;

    // Send confirmation email if there were subscriptions to remove
    if (appNames.length > 0) {
      const appList = appNames.join('<br>• ');
      
      const htmlBody = `
        <h1>Unsubscribe Successful</h1>
        <p>You will no longer receive notifications for the app store position of:</p>
        <p>• ${appList}</p>
        <br>
        <p style="font-size:12px;color:grey;">Changed your mind? Visit <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://appstoreposition.com'}">appstoreposition.com</a> to subscribe again.</p>
      `;

      try {
        await sendEmail({
          to: email,
          subject: '👋 App Store Notifier - Unsubscribed',
          htmlBody,
        });
      } catch (emailError) {
        console.error('Failed to send unsubscribe confirmation email:', emailError);
        // Don't fail the unsubscribe if email fails
      }
    }

    return NextResponse.json({ message: 'Successfully unsubscribed' }, { status: 200 });

  } catch (error) {
    console.error('Handler error during unsubscribe:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 