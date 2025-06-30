import { getJson } from "serpapi";

/**
 * Fetches the top charts for the Finance category from the App Store using SerpApi.
 * @returns A promise that resolves to a Map where the key is the app's numeric ID and the value is its rank.
 */
export async function fetchFinanceChartRanks(): Promise<Map<string, number>> {
  console.log("Fetching Top Free Finance chart from SerpApi...");

  if (!process.env.SERPAPI_API_KEY) {
    console.error("SERPAPI_API_KEY is not set in environment variables.");
    throw new Error("Server configuration error: SERPAPI_API_KEY is missing.");
  }

  try {
    const response = await getJson({
      api_key: process.env.SERPAPI_API_KEY,
      engine: "apple_app_store",
      term: "finance",
      category_id: "6015", // Finance category ID
      country: "us",
      num: "200", // Fetch top 200 free apps
    });

    const ranks = new Map<string, number>();
    const chartResults = response.organic_results || [];

    // Temporary logging to inspect the full API response
    console.log("Full SerpApi organic_results:", JSON.stringify(chartResults, null, 2));

    chartResults.forEach((app: any) => {
      const numericId = app.id;
      const rank = app.position;
      if (numericId && rank) {
        ranks.set(String(numericId), rank);
      }
    });

    if (ranks.size === 0) {
      console.warn(
        "Could not parse any ranks from SerpApi response. Full response:",
        JSON.stringify(response),
      );
    } else {
      console.log(
        `Successfully fetched and mapped ${ranks.size} apps from the chart.`,
      );
    }

    return ranks;
  } catch (error) {
    console.error("Error fetching chart from SerpApi:", error);
    return new Map<string, number>();
  }
}

// This function is no longer needed but is kept to avoid breaking imports.
export async function closeBrowser() {
  console.log("closeBrowser() is a no-op as Playwright is no longer used.");
} 