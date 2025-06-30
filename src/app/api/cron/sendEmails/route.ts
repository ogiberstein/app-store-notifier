import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchRank, closeBrowser } from '@/lib/fetchRank';
import { sendEmail } from '@/lib/email';

// Helper to map app IDs to their details. In a real-world scenario, this would likely be a database table.
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
    // 1. Fetch all distinct emails directly from the database
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

    // 2. Process each email
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

      const appDetailsForEmail: { name: string; rank: string }[] = [];

      // 3. Fetch rank for each subscribed app
      for (const sub of userSubscriptions) {
        const appId = sub.app_id;
        if (!appId) continue;

        try {
          const { name, numericId } = await getAppDetails(appId);
          if (!numericId) {
            console.warn(`No numeric ID found for app_id: ${appId}. Skipping.`);
            continue;
          }
          
          const rank = await fetchRank(numericId);
          const rankText = rank > 0 ? `#${rank}` : 'Not Ranked';
          appDetailsForEmail.push({ name, rank: rankText });

        } catch (rankError) {
          console.error(`Error fetching rank for ${appId} (email: ${email}):`, rankError);
          const { name } = await getAppDetails(appId); // Get name for error message
          appDetailsForEmail.push({ name, rank: 'Error fetching rank' });
        }
      }
      
      if (appDetailsForEmail.length === 0) {
        console.log(`No app ranks to report for ${email}.`);
        continue;
      }
      
      // 4. Compile and send the email
      let emailSubject = '📈 Your Daily App Rank Update';
      if (appDetailsForEmail.length === 1) {
        emailSubject = `📈 ${appDetailsForEmail[0].name} is ${appDetailsForEmail[0].rank}`;
      }

      let emailHtmlBody = '<h1>Your Daily App Rank Update</h1><ul>';
      appDetailsForEmail.forEach(app => {
        emailHtmlBody += `<li><b>${app.name}:</b> ${app.rank} in Finance (US)</li>`;
      });
      emailHtmlBody += '</ul>';

      const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const unsubscribeLink = `${appUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
      const donationLink = 'https://www.buymeacoffee.com/your-username'; // Replace with your actual link

      emailHtmlBody += `
        <br><hr>
        <div style="margin-top:20px; font-size:12px; color:grey;">
          <p>
            From the creator of 
            <a href="https://coinrule.com" target="_blank" rel="noopener noreferrer">Coinrule</a> & 
            <a href="https://vwape.com" target="_blank" rel="noopener noreferrer">VWAPE</a>.
          </p>
          <p>
            Want to give a tip? Send ETH or USDC to giberstein.eth on any reasonable EVM chain.
          </p>
          <p>
            Manage your subscriptions on our <a href="${appUrl}" target="_blank" rel="noopener noreferrer">website</a>.
          </p>
          <p>
            To unsubscribe from all notifications, <a href="${unsubscribeLink}">click here</a>.
          </p>
        </div>
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
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Unhandled error in sendEmails cron job:', errorMessage);
    return NextResponse.json(
      { message: 'Cron job failed', error: errorMessage },
      { status: 500 }
    );
  } finally {
    // The browser is now closed within each fetchRank call, so this is no longer needed.
    console.log('Cron job finishing.');
  }
} 