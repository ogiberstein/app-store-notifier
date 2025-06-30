import { getJson } from 'serpapi';

interface AppRank {
  rank: number;
  id: string;
}

/**
 * Fetches the top charts for a given category from the App Store using SerpApi.
 * @returns A promise that resolves to a Map where the key is the app's numeric ID and the value is its rank.
 */
export async function fetchFinanceChartRanks(): Promise<Map<string, number>> {
  console.log('Fetching Top Free Finance chart from SerpApi...');

  if (!process.env.SERPAPI_API_KEY) {
    console.error('SERPAPI_API_KEY is not set in environment variables.');
    throw new Error('Server configuration error: SERPAPI_API_KEY is missing.');
  }

  try {
    const response = await getJson({
      api_key: process.env.SERPAPI_API_KEY,
      engine: 'apple_app_store_charts',
      chart: 'top_free_applications',
      category: '6015', // Finance category ID
      country: 'us',
    });

    const ranks = new Map<string, number>();
    const chartResults = response.charts?.free_applications?.results || [];

    chartResults.forEach((app: AppRank) => {
      if (app.id) {
        ranks.set(app.id, app.rank);
      }
    });

    console.log(`Successfully fetched and mapped ${ranks.size} apps from the chart.`);
    return ranks;

  } catch (error) {
    console.error('Error fetching chart from SerpApi:', error);
    // Return an empty map on error to prevent the whole job from failing.
    return new Map<string, number>();
  }
}

/**
 * @deprecated This function is inefficient. Use fetchFinanceChartRanks instead.
 */
export async function fetchRank(appNumericId: string): Promise<number> {
  // This function remains to prevent build errors if it's imported elsewhere,
  // but it should not be used in the new cron job logic.
  console.warn(`DEPRECATED: fetchRank called for ${appNumericId}. Switch to chart-based fetching.`);
  return -1;
}

// This function is no longer needed but is kept to avoid breaking imports. It does nothing.
export async function closeBrowser() {
  console.log('closeBrowser() is a no-op as Playwright is no longer used.');
}
