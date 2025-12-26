import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { fetchFinanceChartRanks } from '@/lib/fetchRank';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic'; // Prevent caching

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
    const result = await sql`
      SELECT email, app_id, app_name FROM subscriptions
    `;
    const allSubscriptions = result.rows;
    
    if (!allSubscriptions || allSubscriptions.length === 0) {
      console.log('No subscriptions found in the database.');
      return NextResponse.json({ message: 'No subscriptions found.' }, { status: 200 });
    }

    // 3. Group subscriptions by email to avoid N+1 queries.
    const subscriptionsByEmail: { [email: string]: { appId: string; appName: string }[] } = {};
    for (const subscription of allSubscriptions) {
      if (subscription.email && subscription.app_id && subscription.app_name) {
        if (!subscriptionsByEmail[subscription.email]) {
          subscriptionsByEmail[subscription.email] = [];
        }
        subscriptionsByEmail[subscription.email].push({ appId: subscription.app_id, appName: subscription.app_name });
      }
    }

    console.log(`Found subscriptions for ${Object.keys(subscriptionsByEmail).length} distinct email(s) to process.`);

    // 4. Process each email.
    for (const email in subscriptionsByEmail) {
      console.log(`Processing email: ${email}`);
      const userSubscriptions = subscriptionsByEmail[email];
      
      const appDetailsForEmail: { name: string; rank: string }[] = [];

      // 5. Look up rank for each unique subscribed app for the current user.
      for (const { appId, appName } of userSubscriptions) {
        const rank = chartRanks.get(appId); // Look up by bundle_id
        const rankText = rank ? `#${rank}` : 'Below #200';
        appDetailsForEmail.push({ name: appName, rank: rankText });
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