import { fetchRank } from './src/lib/fetchRank';
import { sendEmail } from './src/lib/email';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from the same directory as this script.
// This is a more robust way to ensure the correct file is loaded.
const envPath = path.resolve(__dirname, '.env.local');
dotenv.config({ path: envPath });

console.log(`Attempting to load .env file from: ${envPath}`);
console.log(`RESEND_API_KEY loaded: ${!!process.env.RESEND_API_KEY}`);
console.log(`EMAIL_FROM_ADDRESS loaded: ${process.env.EMAIL_FROM_ADDRESS}`);
console.log(`TEST_EMAIL_TO loaded: ${!!process.env.TEST_EMAIL_TO}`);


async function runTests() {
  console.log('Starting manual tests...');

  // --- Test 1: Fetch App Rank ---
  try {
    console.log('\n--- Testing fetchRank with Playwright ---');
    const appId = '886427730'; // Coinbase
    console.log(`Fetching rank for app ID: ${appId}`);
    const rank = await fetchRank(appId);
    
    if (rank > 0) {
      console.log(`✅ Success! Rank for app ${appId} is #${rank}.`);
    } else {
      console.warn(`⚠️ Warning: fetchRank returned ${rank}. The app might be unranked or a scraper error occurred. Check screenshot and logs.`);
    }
  } catch (error) {
    console.error('❌ Error during fetchRank test:', error);
  }


  // --- Test 2: Send Email ---
  try {
    console.log('\n--- Testing sendEmail ---');
    const testEmail = process.env.TEST_EMAIL_TO;

    if (!testEmail || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM_ADDRESS) {
      console.warn('⚠️ Skipping sendEmail test: One or more environment variables (RESEND_API_KEY, EMAIL_FROM_ADDRESS, TEST_EMAIL_TO) are not set in your .env.local file.');
      return;
    }

    console.log(`Attempting to send a test email to: ${testEmail}`);
    
    await sendEmail({
      to: testEmail,
      subject: 'Test Email from App Store Notifier',
      htmlBody: '<h1>Hello!</h1><p>This is a test email to confirm that the email sending service is working correctly.</p>',
    });

    console.log(`✅ Success! A test email has been sent to ${testEmail}. Please check your inbox.`);

  } catch (error) {
    console.error('❌ Error during sendEmail test:', error);
  } finally {
    console.log('\nManual tests finished.');
  }
}

runTests(); 