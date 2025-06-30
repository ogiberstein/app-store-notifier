import { getJson } from 'serpapi';

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
      country: 'us', // Assuming US store, can be parameterized if needed
    });

    const rank = response.app_store_app?.rank;

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

// This function is no longer needed but is kept to avoid breaking imports. It does nothing.
export async function closeBrowser() {
  console.log('closeBrowser() is a no-op as Playwright is no longer used.');
}
