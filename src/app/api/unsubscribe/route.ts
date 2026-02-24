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

    const normalizedEmail = email.toLowerCase().trim();

    // Get the list of apps before deleting
    const subscriptions = await sql`
      SELECT app_name FROM subscriptions WHERE email = ${normalizedEmail}
    `;
    
    const appNames = subscriptions.rows.map(row => row.app_name);

    if (appNames.length === 0) {
      return NextResponse.json({ message: 'No active subscriptions found for this email.' }, { status: 200 });
    }

    // Delete all subscriptions
    await sql`
      DELETE FROM subscriptions
      WHERE email = ${normalizedEmail}
    `;

    // Send confirmation email
    {
      const appList = appNames.join('<br>• ');
      
      const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://appstoreposition.com';
      
      const htmlBody = `
        <h1>Unsubscribe Successful</h1>
        <p>You will no longer receive notifications for the app store position of:</p>
        <p>• ${appList}</p>
        <br>
        <p style="font-size:12px;color:grey;">Changed your mind? Visit <a href="${siteUrl}">appstoreposition.com</a> to subscribe again.</p>
        <p style="font-size:12px;color:grey;">Want to track a different app? <a href="https://forms.gle/1tsh2DwPZP261ZQs8">Request it here</a>.</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;">
        <p style="font-size:11px;color:#999;">By the creator of <a href="https://coinrule.com" style="color:#6366f1;">Coinrule</a> & <a href="https://limits.trade" style="color:#6366f1;">Limits</a></p>
        <p style="font-size:11px;color:#999;">Want to give a tip? Send ETH or USDC to giberstein.eth on any reasonable EVM chain</p>
      `;

      try {
        await sendEmail({
          to: normalizedEmail,
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