import { getJson } from 'serpapi';

// Define a type for the objects we expect in the SerpApi response
interface SerpApiAppResult {
  app_id: string;
  rank: number;
}

/**
 * Fetches the top charts for the Finance category from the App Store using SerpApi.
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
      engine: 'apple_app_store',
      term: 'finance', // Generic term is required, but chart/category take precedence
      chart: 'top_free_applications',
      category: '6015', // Finance category ID
      country: 'us',
    });

    const ranks = new Map<string, number>();
    const chartResults = response.organic_results || [];

    chartResults.forEach((app: SerpApiAppResult) => {
      // The numeric ID is in the `app_id` field, prefixed with 'id'
      const numericId = app.app_id?.replace('id', '');
      if (numericId && app.rank) {
        ranks.set(numericId, app.rank);
      }
    });

    if (ranks.size === 0) {
      console.warn('Could not parse any ranks from SerpApi response. Full response:', JSON.stringify(response));
    } else {
      console.log(`Successfully fetched and mapped ${ranks.size} apps from the chart.`);
    }
    
    return ranks;

  } catch (error) {
    console.error('Error fetching chart from SerpApi:', error);
    return new Map<string, number>();
  }
}

/**
 * Fetches the current App Store category rank for a given app ID using the SerpApi Apple App Store API.
 * This function is designed for serverless environments.
 * @param appNumericId The numeric App Store ID of the app.
 * @returns A promise that resolves to the app's category rank, or -1 if not found.
 */
export async function fetchRank(appNumericId: string): Promise<number> {
  console.log(`Fetching rank for app ID: ${appNumericId} using SerpApi`);

  if (!process.env.SERPAPI_API_KEY) {
    console.error('SERPAPI_API_KEY is not set in environment variables.');
    throw new Error('Server configuration error: SERPAPI_API_KEY is missing.');
  }

  try {
    const response = await getJson({
      api_key: process.env.SERPAPI_API_KEY,
      engine: 'apple_app_store',
      term: `id${appNumericId}`,
    });

    const rank = response.organic_results[0]?.rank;

    if (rank) {
      console.log(`Successfully fetched rank for ${appNumericId}: #${rank}`);
      return rank;
    } else {
      console.warn(`Could not find rank for ${appNumericId} in SerpApi response.`);
      return -1;
    }
  } catch (error) {
    console.error(`Error fetching rank for ${appNumericId} from SerpApi:`, error);
    return -1;
  }
}

// This function is no longer needed but is kept to avoid breaking imports.
export async function closeBrowser() {
  console.log('closeBrowser() is a no-op as Playwright is no longer used.');
}
