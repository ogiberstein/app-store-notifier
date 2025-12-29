import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { fetchFinanceChartRanks } from '@/lib/fetchRank';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic'; // Prevent caching

// Helper function to format position change
function formatPositionChange(
  todayRank: number | null, 
  compareRank: number | null, 
  label: string
): string {
  // If not ranked today, no change to show
  if (todayRank === null) {
    return '';
  }
  
  // If wasn't ranked in comparison period but ranked today = NEW
  if (compareRank === null) {
    return ` <span style="color: #22c55e; font-weight: bold;">(NEW ${label})</span>`;
  }
  
  // Calculate the change (lower rank number = better position)
  const change = compareRank - todayRank;
  
  if (change === 0) {
    return ` <span style="color: #6b7280;">(— ${label})</span>`;
  } else if (change > 0) {
    // Moved up (e.g., from #50 to #40 = +10 positions)
    return ` <span style="color: #22c55e; font-weight: bold;">(↑${change} ${label})</span>`;
  } else {
    // Moved down (e.g., from #40 to #50 = -10 positions)
    return ` <span style="color: #ef4444; font-weight: bold;">(↓${Math.abs(change)} ${label})</span>`;
  }
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

    // 2. Fetch yesterday's rankings for daily comparison
    const yesterdayResult = await sql`
      SELECT app_id, rank FROM ranking_history 
      WHERE recorded_date = CURRENT_DATE - INTERVAL '1 day'
    `;
    const yesterdayRanks = new Map<string, number>();
    for (const row of yesterdayResult.rows) {
      if (row.app_id && row.rank) {
        yesterdayRanks.set(row.app_id, row.rank);
      }
    }
    console.log(`Loaded ${yesterdayRanks.size} rankings from yesterday for daily comparison.`);

    // 2b. Fetch last week's rankings for weekly comparison
    const lastWeekResult = await sql`
      SELECT app_id, rank FROM ranking_history 
      WHERE recorded_date = CURRENT_DATE - INTERVAL '7 days'
    `;
    const lastWeekRanks = new Map<string, number>();
    for (const row of lastWeekResult.rows) {
      if (row.app_id && row.rank) {
        lastWeekRanks.set(row.app_id, row.rank);
      }
    }
    console.log(`Loaded ${lastWeekRanks.size} rankings from last week for weekly comparison.`);

    // 3. Save today's rankings for tomorrow's comparison
    // Get all unique app_ids from subscriptions to know which apps to save
    const subscribedAppsResult = await sql`
      SELECT DISTINCT app_id FROM subscriptions
    `;
    
    for (const row of subscribedAppsResult.rows) {
      const appId = row.app_id;
      const rank = chartRanks.get(appId);
      
      // Save the rank (or null if not in top 200)
      await sql`
        INSERT INTO ranking_history (app_id, rank, recorded_date)
        VALUES (${appId}, ${rank || null}, CURRENT_DATE)
        ON CONFLICT (app_id, recorded_date) DO UPDATE SET rank = ${rank || null}
      `;
    }
    console.log(`Saved today's rankings for ${subscribedAppsResult.rows.length} tracked apps.`);

    // 4. Fetch all subscriptions from the database in a single query.
    const result = await sql`
      SELECT email, app_id, app_name FROM subscriptions
    `;
    const allSubscriptions = result.rows;
    
    if (!allSubscriptions || allSubscriptions.length === 0) {
      console.log('No subscriptions found in the database.');
      return NextResponse.json({ message: 'No subscriptions found.' }, { status: 200 });
    }

    // 5. Group subscriptions by email to avoid N+1 queries.
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

    // 6. Process each email.
    for (const email in subscriptionsByEmail) {
      console.log(`Processing email: ${email}`);
      const userSubscriptions = subscriptionsByEmail[email];
      
      const appDetailsForEmail: { name: string; rank: string; dailyChange: string; weeklyChange: string }[] = [];

      // 7. Look up rank for each unique subscribed app for the current user.
      for (const { appId, appName } of userSubscriptions) {
        const todayRank = chartRanks.get(appId) || null;
        const yesterdayRank = yesterdayRanks.get(appId) || null;
        const lastWeekRank = lastWeekRanks.get(appId) || null;
        
        const rankText = todayRank ? `#${todayRank}` : 'Below #200';
        // Only show position changes if currently ranked
        const dailyChangeText = todayRank ? formatPositionChange(todayRank, yesterdayRank, 'Daily') : '';
        const weeklyChangeText = todayRank ? formatPositionChange(todayRank, lastWeekRank, 'Weekly') : '';
        
        appDetailsForEmail.push({ name: appName, rank: rankText, dailyChange: dailyChangeText, weeklyChange: weeklyChangeText });
      }
      
      if (appDetailsForEmail.length === 0) {
        console.log(`No app ranks to report for ${email}.`);
        continue;
      }
      
      // 8. Compile and send the email.
      let emailSubject = '📈 Your Daily App Rank Update';
      if (appDetailsForEmail.length === 1) {
        const singleApp = appDetailsForEmail[0];
        emailSubject = `📈 ${singleApp.name} is ${singleApp.rank} in Finance (US)`;
      }

      let emailHtmlBody = '<h1>Your Daily App Rank Update</h1><ul style="list-style: none; padding: 0;">';
      appDetailsForEmail.forEach(app => {
        emailHtmlBody += `<li style="margin: 10px 0; font-size: 16px;"><b>${app.name}:</b> ${app.rank} in Finance (US)${app.dailyChange}${app.weeklyChange}</li>`;
      });
      emailHtmlBody += '</ul>';

      const unsubscribeLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://appstoreposition.com'}/unsubscribe?email=${encodeURIComponent(email)}`;
      const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://appstoreposition.com';
      
      emailHtmlBody += `
        <br>
        <p style="font-size:12px;color:grey;">Did someone forward this email to you? <a href="${siteUrl}">Set up your own alerts here</a>.</p>
        <p style="font-size:12px;color:grey;">Want to track a different app? <a href="https://forms.gle/1tsh2DwPZP261ZQs8">Request it here</a>.</p>
        <p style="font-size:12px;color:grey;">To unsubscribe from all notifications, <a href="${unsubscribeLink}">click here</a>.</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;">
        <p style="font-size:11px;color:#999;">By the creator of <a href="https://coinrule.com" style="color:#6366f1;">Coinrule</a> & <a href="https://limits.trade" style="color:#6366f1;">Limits</a></p>
        <p style="font-size:11px;color:#999;">Want to give a tip? Send ETH or USDC to giberstein.eth on any reasonable EVM chain</p>
      `;
      
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
    console.log('Cron job finishing.');
  }
} 