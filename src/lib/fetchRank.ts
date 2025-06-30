import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs';

// Apply the stealth plugin each time
chromium.use(stealthPlugin());

/**
 * Fetches the current App Store category rank for a given app ID.
 * This function is designed to be stateless for serverless environments.
 * @param appNumericId The numeric App Store ID of the app.
 * @returns A promise that resolves to the app's category rank, or -1 if not found.
 */
export async function fetchRank(appNumericId: string): Promise<number> {
  console.log(`Fetching rank for app ID: ${appNumericId}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    const appUrl = `https://apps.apple.com/us/app/id${appNumericId}`;
    await page.goto(appUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const rankElementLocator = page.locator('a.inline-list__item');
    await rankElementLocator.first().waitFor({ timeout: 20000 });

    const rankText = await rankElementLocator.first().textContent();
    
    if (rankText && rankText.includes('in')) {
      const rankMatch = rankText.match(/#(\d+)/);
      if (rankMatch && rankMatch[1]) {
        return parseInt(rankMatch[1], 10);
      }
    }

    console.log(`Could not parse rank for ${appNumericId}. Text found: ${rankText}`);
    return -1;
  } catch (error) {
    console.error(`Error fetching rank for ${appNumericId}:`, error);
    const screenshotPath = `/tmp/debug-screenshot-${appNumericId}.png`; // Use /tmp for serverless env
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved failure screenshot to ${screenshotPath}`);
    return -1;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    console.log(`Browser instance closed for app ID: ${appNumericId}`);
  }
}

// The global closeBrowser function is no longer needed for a stateless approach.
export async function closeBrowser() {
  // This function can be left empty or removed entirely.
  // Keeping it ensures that existing imports don't break immediately.
  console.log('closeBrowser() is a no-op in serverless mode.');
}
