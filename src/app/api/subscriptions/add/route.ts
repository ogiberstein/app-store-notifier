import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, appId, appName } = body;

    if (!email || !appId || !appName) {
      return NextResponse.json({ error: 'Email, appId, and appName are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const result = await sql`
      INSERT INTO subscriptions (email, app_id, app_name)
      VALUES (${normalizedEmail}, ${appId}, ${appName})
      ON CONFLICT (email, app_id) DO NOTHING
      RETURNING *
    `;

    // Send confirmation email with all subscribed apps
    const allSubscriptions = await sql`
      SELECT app_name FROM subscriptions WHERE email = ${normalizedEmail}
    `;
    
    const appList = allSubscriptions.rows.map(row => row.app_name).join('<br>• ');
    
    const htmlBody = `
      <h1>Signup Successful! 🎉</h1>
      <p>You will now receive daily app store position notifications.</p>
      <p><strong>Your selected apps are:</strong></p>
      <p>• ${appList}</p>
      <br>
      <p style="font-size:12px;color:grey;">You can unsubscribe anytime by visiting <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://appstoreposition.com'}">appstoreposition.com</a></p>
    `;

    try {
      await sendEmail({
        to: normalizedEmail,
        subject: '✅ App Store Notifier - Subscription Confirmed',
        htmlBody,
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the subscription if email fails
    }

    return NextResponse.json({ message: 'Subscription added successfully', data: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Handler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
