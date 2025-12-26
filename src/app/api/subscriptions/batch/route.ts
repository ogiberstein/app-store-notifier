import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { sendEmail } from '@/lib/email';

interface AppToSubscribe {
  appId: string;
  appName: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, apps } = body as { email: string; apps: AppToSubscribe[] };

    if (!email || !apps || apps.length === 0) {
      return NextResponse.json({ error: 'Email and at least one app are required' }, { status: 400 });
    }

    // Insert all subscriptions
    let successCount = 0;
    for (const app of apps) {
      try {
        await sql`
          INSERT INTO subscriptions (email, app_id, app_name)
          VALUES (${email}, ${app.appId}, ${app.appName})
          ON CONFLICT (email, app_id) DO NOTHING
        `;
        successCount++;
      } catch (err) {
        console.error(`Failed to insert subscription for ${app.appName}:`, err);
      }
    }

    // Get all subscriptions for this user to include in confirmation email
    const allSubscriptions = await sql`
      SELECT app_name FROM subscriptions WHERE email = ${email}
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
        to: email,
        subject: '✅ App Store Notifier - Subscription Confirmed',
        htmlBody,
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the subscription if email fails
    }

    return NextResponse.json({ 
      message: `Successfully subscribed to ${successCount} app(s)`, 
      successCount 
    }, { status: 200 });
  } catch (error) {
    console.error('Handler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

