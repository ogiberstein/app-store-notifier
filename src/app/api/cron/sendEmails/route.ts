import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchFinanceChartRanks } from '@/lib/fetchRank';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic'; // Prevent caching

// Helper to map app bundle IDs to their details.
async function getAppDetails(appId: string): Promise<{ name: string; numericId: string }> {
  // This map links the internal bundle IDs to the public App Store numeric IDs and a user-friendly name.
  const appDetailsMap: Record<string, { name: string; numericId: string }> = {
    'com.coinbase.android': { name: 'Coinbase', numericId: '886427730' },
    'app.phantom': { name: 'Phantom Wallet', numericId: '1598432977' },
    'co.mona.android': { name: 'Crypto.com', numericId: '1262148500' },
    'com.kraken.invest': { name: 'Kraken', numericId: '1481947260' },
  };
  return appDetailsMap[appId] || { name: appId, numericId: '' }; // Fallback for safety
}

export async function GET() {
  console.log('Cron job sendEmails started...');
  let emailsSentCount = 0;
  let errorsEncountered = 0;

  try {
    // 1. Fetch all app ranks for the Finance category once.
    const chartRanks = await fetchFinanceChartRanks();
    if (chartRanks.size === 0) {
      console.warn('Could not fetch chart ranks. Aborting cron job for now.');
      return NextResponse.json({ message: 'Failed to fetch chart ranks' }, { status: 500 });
    }

    // 2. Fetch all subscriptions from the database in a single query.
    const { data: allSubscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('email, app_id');

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      return NextResponse.json(
        { message: 'Error fetching subscriptions', error: subscriptionsError.message },
        { status: 500 }
      );
    }
    
    if (!allSubscriptions || allSubscriptions.length === 0) {
      console.log('No subscriptions found in the database.');
      return NextResponse.json({ message: 'No subscriptions found.' }, { status: 200 });
    }

    // 3. Group subscriptions by email to avoid N+1 queries.
    const subscriptionsByEmail: { [email: string]: string[] } = {};
    for (const subscription of allSubscriptions) {
      if (subscription.email && subscription.app_id) {
        if (!subscriptionsByEmail[subscription.email]) {
          subscriptionsByEmail[subscription.email] = [];
        }
        subscriptionsByEmail[subscription.email].push(subscription.app_id);
      }
    }

    console.log(`Found subscriptions for ${Object.keys(subscriptionsByEmail).length} distinct email(s) to process.`);

    // 4. Process each email.
    for (const email in subscriptionsByEmail) {
      console.log(`Processing email: ${email}`);
      const userAppIds = subscriptionsByEmail[email];
      
      const uniqueAppIdsForUser = Array.from(new Set(userAppIds));
      const appDetailsForEmail: { name: string; rank: string }[] = [];

      // 5. Look up rank for each unique subscribed app for the current user.
      for (const appId of uniqueAppIdsForUser) {
        if (!appId) continue;
        const { name, numericId } = await getAppDetails(appId);
        const rank = chartRanks.get(numericId); // Look up from our pre-fetched map.
        const rankText = rank ? `#${rank}` : 'Not Ranked';
        appDetailsForEmail.push({ name, rank: rankText });
      }
      
      if (appDetailsForEmail.length === 0) {
        console.log(`No app ranks to report for ${email}.`);
        continue;
      }
      
      // 6. Compile and send the email.
      let emailSubject = '📈 Your Daily App Rank Update';
      if (appDetailsForEmail.length === 1) {
        const singleApp = appDetailsForEmail[0];
        emailSubject = `📈 ${singleApp.name} is ${singleApp.rank} in Finance (US)`;
      }

      let emailHtmlBody = '<h1>Your Daily App Rank Update</h1><ul>';
      appDetailsForEmail.forEach(app => {
        emailHtmlBody += `<li><b>${app.name}:</b> ${app.rank} in Finance (US)</li>`;
      });
      emailHtmlBody += '</ul>';

      const unsubscribeLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(email)}`;
      emailHtmlBody += `<br><p style="font-size:12px;color:grey;">To unsubscribe from all notifications, <a href="${unsubscribeLink}">click here</a>.</p>`;
      
      try {
        await sendEmail({ to: email, subject: emailSubject, htmlBody: emailHtmlBody });
        console.log(`Email sent to ${email}`);
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Unhandled error in sendEmails cron job:', errorMessage);
    return NextResponse.json(
      { message: 'Cron job failed', error: errorMessage },
      { status: 500 }
    );
  } finally {
    // The browser is no longer used, so this is just for logging.
    console.log('Cron job finishing.');
  }
} 