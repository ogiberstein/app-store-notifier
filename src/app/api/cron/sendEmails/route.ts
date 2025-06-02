import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchRank } from '@/lib/fetchRank';
import { sendEmail } from '@/lib/email';

// Helper to get app name - in a real app, this might come from an 'apps' table or a more sophisticated lookup
async function getAppName(appId: string): Promise<string> {
  // For now, derive a generic name. Later, this could query an 'apps' table or use a lookup service.
  // This is a simplified version of what might be in architecture.md's optional 'apps' table.
  const knownApps: Record<string, string> = {
    'com.binance.dev': 'Binance',
    'com.coinbase.android': 'Coinbase',
    'app.phantom': 'Phantom Wallet',
    'co.mona.android': 'Crypto.com - Buy Bitcoin, ETH',
    'com.kraken.invest': 'Kraken - Buy & Sell Crypto',
  };
  return knownApps[appId] || appId; // Fallback to appId if name not known
}

export async function GET() {
  console.log('Cron job sendEmails started...');
  let emailsSentCount = 0;
  let errorsEncountered = 0;

  try {
    // 1. Fetch all subscriptions and then get distinct emails in code
    const { data: allSubscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('email');

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      return NextResponse.json(
        { message: 'Error fetching subscriptions', error: subscriptionsError.message },
        { status: 500 }
      );
    }

    if (!allSubscriptions || allSubscriptions.length === 0) {
      console.log('No subscriptions found at all.');
      return NextResponse.json({ message: 'No subscriptions found.' }, { status: 200 });
    }
    
    // Get distinct emails using a Set
    const distinctEmails = Array.from(new Set(allSubscriptions.map(sub => sub.email))).map(email => ({ email }));

    if (distinctEmails.length === 0) {
      console.log('No subscribed emails found after filtering.'); // Should not happen if allSubscriptions had items
      return NextResponse.json({ message: 'No subscribed emails found.' }, { status: 200 });
    }

    console.log(`Found ${distinctEmails.length} distinct email(s) to process.`);

    // 2. For each email, fetch their app list and send individual emails
    for (const { email } of distinctEmails) {
      if (!email) continue;

      console.log(`Processing email: ${email}`);
      const { data: userSubscriptions, error: userSubscriptionsError } = await supabase
        .from('subscriptions')
        .select('app_id')
        .eq('email', email);

      if (userSubscriptionsError) {
        console.error(`Error fetching subscriptions for ${email}:`, userSubscriptionsError);
        errorsEncountered++;
        continue; // Skip to next email
      }

      if (!userSubscriptions || userSubscriptions.length === 0) {
        console.log(`No subscriptions found for ${email}, skipping.`);
        continue;
      }

      let emailHtmlBody = 'Hello!\n\nHere\'s your daily app store rank update:\n\n';
      let emailSubject = '📈 Daily App Rank Update'; // Generic subject, will be personalized if only one app
      const appDetailsForEmail: { name: string; rank: number | string }[] = [];

      // 3. For each app_id, fetch its rank
      for (const sub of userSubscriptions) {
        const appId = sub.app_id;
        if (!appId) continue;

        try {
          const rank = await fetchRank(appId);
          const appName = await getAppName(appId);
          appDetailsForEmail.push({ name: appName, rank });
          emailHtmlBody += `${appName}: #${rank} in its category (mocked data)\n`; // TODO: Add real category and region
        } catch (rankError) {
          console.error(`Error fetching rank for ${appId} for email ${email}:`, rankError);
          const appName = await getAppName(appId);
          appDetailsForEmail.push({ name: appName, rank: 'Error fetching rank' });
          emailHtmlBody += `${appName}: Error fetching rank\n`;
        }
      }
      
      // Personalize subject if only one app
      if (appDetailsForEmail.length === 1) {
        emailSubject = `📈 Daily App Rank Update for ${appDetailsForEmail[0].name}`;
      }

      // Add unsubscribe link (placeholder domain for now)
      const unsubscribeLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(email)}`;
      emailHtmlBody += `\nTo unsubscribe from all notifications, click here: ${unsubscribeLink}`;
      
      // 4. Compile and send email
      try {
        console.log(`Attempting to send email to ${email} with ${appDetailsForEmail.length} app(s) update.`);
        await sendEmail({
          to: email,
          subject: emailSubject,
          htmlBody: emailHtmlBody.replace(/\n/g, '<br>'), // Simple newline to <br> for HTML
        });
        console.log(`Email ostensibly sent to ${email}`);
        emailsSentCount++;
      } catch (emailError) {
        console.error(`Error sending email to ${email}:`, emailError);
        errorsEncountered++;
      }
    }

    const summaryMessage = `Cron job completed. Emails sent: ${emailsSentCount}. Errors: ${errorsEncountered}.`;
    console.log(summaryMessage);
    return NextResponse.json({ message: summaryMessage }, { status: 200 });

  } catch (error) {
    console.error('Unhandled error in sendEmails cron job:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { message: 'Cron job failed', error: errorMessage },
      { status: 500 }
    );
  }
} 