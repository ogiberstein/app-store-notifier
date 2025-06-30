import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchFinanceChartRanks } from '@/lib/fetchRank';
import { sendEmail } from '@/lib/email';

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

    // 2. Fetch all distinct emails from the database.
    const { data: distinctEmails, error: subscriptionsError } = await supabase
      .from('distinct_emails')
      .select('email');

    if (subscriptionsError) {
      console.error('Error fetching distinct emails:', subscriptionsError);
      return NextResponse.json(
        { message: 'Error fetching distinct emails', error: subscriptionsError.message },
        { status: 500 }
      );
    }
    
    if (!distinctEmails || distinctEmails.length === 0) {
      console.log('No subscribed emails found.');
      return NextResponse.json({ message: 'No subscribed emails found.' }, { status: 200 });
    }

    console.log(`Found ${distinctEmails.length} distinct email(s) to process.`);

    // 3. Process each email.
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
        continue; // Skip to the next email
      }

      if (!userSubscriptions || userSubscriptions.length === 0) {
        console.log(`No subscriptions found for ${email}, skipping.`);
        continue;
      }
      
      const uniqueAppIdsForUser = [...new Set(userSubscriptions.map(sub => sub.app_id))];
      const appDetailsForEmail: { name: string; rank: string }[] = [];

      // 4. Look up rank for each unique subscribed app for the current user.
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
      
      // 5. Compile and send the email.
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
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
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