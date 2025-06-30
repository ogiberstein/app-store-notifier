# App Store Notifier - Project Status

## Project Overview

This is a Next.js application designed to send users daily email notifications about the Apple App Store rankings of their favorite applications.

Users can subscribe with their email address and select from a list of popular finance apps to monitor. A cron job runs daily to fetch the latest app rankings and sends a consolidated email update to each subscriber.

The application uses Supabase for the database to manage subscriptions and SerpApi for fetching App Store chart data.

### Key Files

-   `src/app/api/cron/sendEmails/route.ts`: The cron job endpoint that fetches ranks and sends emails.
-   `src/lib/fetchRank.ts`: Contains the `fetchFinanceChartRanks` function that calls the SerpApi service to get the top 200 free finance apps in the US.
-   `src/lib/email.ts`: Handles sending emails.
-   `src/lib/supabase.ts`: Supabase client for database interactions.
-   `src/components/AppList.tsx`: A React component that contains the hardcoded list of apps available for monitoring. This is where the app `name` and `bundleId` are stored.
-   `src/app/page.tsx`: The main landing page where users subscribe.

## Recent Work Summary

The primary goal of the recent work was to fix a bug where email notifications consistently showed all monitored apps as "Not Ranked".

1.  **Initial Investigation**: The root cause was identified as incorrect iOS `bundleId`s being used for the apps in `src/components/AppList.tsx`. The `bundleId` is used as the primary key to look up the rank, and the wrong IDs were causing the lookup to fail.
2.  **Fix 1 (Bundle IDs)**: The `bundleId`s for Coinbase, Crypto.com, and Kraken were corrected after looking them up via Apple's official App Store metadata service. This fixed the ranking issue for Coinbase and Crypto.com.
3.  **Fix 2 (UI)**: A minor UI bug was fixed where the email input text on the homepage was not legible in dark mode.
4.  **Fix 3 (Kraken App Name)**: Despite the correct `bundleId`, Kraken continued to show as "Not Ranked". The hypothesis was that the app's name was also a factor in the lookup. The name was updated in `AppList.tsx` to match the official name in the US App Store (`Kraken: Buy Stocks & Crypto`).

## Current Status

-   The fixes for Coinbase and Crypto.com are working correctly, and their ranks are appearing in the email notifications.
-   **The issue with Kraken persists.** It still shows as "Not Ranked" in the emails, even after correcting both its `bundleId` and its name.
-   All changes have been committed and pushed to the `main` branch.

## To Do List / Next Steps

The immediate priority is to solve the persistent ranking issue for Kraken.

-   **Investigate why Kraken's rank is not being found.**
    -   **Hypothesis:** The most likely reason for the failure is that the SerpApi service, which fetches the top 200 finance apps, is not returning an entry for Kraken with the bundle ID `com.kraken.invest.app`. It's possible the app is not in the top 200, or the service uses a different identifier.
    -   **Action Item:** Add comprehensive logging to the `fetchFinanceChartRanks` function in `src/lib/fetchRank.ts`. Specifically, log the full, stringified `response` from the `getJson` call to SerpApi. This will allow us to see the raw data and verify exactly which apps and `bundle_id`s are being returned, confirming whether Kraken is present or not.
    -   **Action Item:** If the above reveals Kraken is present but has a different `bundle_id`, update it. If it's not present at all, the application logic may need to be adjusted to handle cases where an app is not in the top 200, or a different data source may be needed.
-   **Re-enable and configure Row Level Security (RLS) in Supabase.**
    -   **Context:** RLS was previously disabled to simplify development. It needs to be properly configured to secure the database before the project is considered complete.
    -   **Action Item:** Review Supabase RLS policies and implement rules that ensure users can only access and manage their own subscriptions. This is critical for data privacy and security. 