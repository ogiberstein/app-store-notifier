# App Store Notifier - Project Status

## Project Overview

This is a Next.js application designed to send users daily email notifications about the Apple App Store rankings of their favorite applications.

Users can subscribe with their email address and select from a list of popular finance apps to monitor. A cron job runs daily to fetch the latest app rankings and sends a consolidated email update to each subscriber.

The application uses **Vercel Postgres** for the database to manage subscriptions and SerpApi for fetching App Store chart data.

### Key Files

-   `src/app/api/cron/sendEmails/route.ts`: The cron job endpoint that fetches ranks and sends emails.
-   `src/lib/fetchRank.ts`: Contains the `fetchFinanceChartRanks` function that calls the SerpApi service to get the top 200 free finance apps in the US.
-   `src/lib/email.ts`: Handles sending emails.
-   `src/lib/db.ts`: Vercel Postgres client for database interactions.
-   `src/components/AppList.tsx`: A React component that contains the hardcoded list of apps available for monitoring. This is where the app `name` and `bundleId` are stored.
-   `src/app/page.tsx`: The main landing page where users subscribe.

## Recent Work Summary (December 2024)

### Ranking Bug Investigation — RESOLVED ✅

The primary goal of the recent work was to fix a bug where email notifications consistently showed all monitored apps as "Not Ranked".

1.  **Initial Investigation**: The root cause was identified as incorrect iOS `bundleId`s being used for the apps in `src/components/AppList.tsx`. The `bundleId` is used as the primary key to look up the rank, and the wrong IDs were causing the lookup to fail.
2.  **Fix 1 (Bundle IDs)**: The `bundleId`s for Coinbase, Crypto.com, and Kraken were corrected after looking them up via Apple's official App Store metadata service. This fixed the ranking issue for Coinbase.
3.  **Fix 2 (UI)**: A minor UI bug was fixed where the email input text on the homepage was not legible in dark mode.

### Kraken Investigation — RESOLVED ✅

After adding diagnostic logging to dump the full SerpApi response, we confirmed:

-   **Kraken is NOT in the top 200 free Finance apps** in the US App Store. The SerpApi response returns ~183 apps, and Kraken is not among them.
-   **Crypto.com (`co.mona.Monaco`) is also NOT in the top 200** — same situation as Kraken.
-   **Coinbase IS ranked** — confirmed at position #43 with bundle ID `com.vilcsak.bitcoin2`.

**Resolution**: Updated the display text from "Not Ranked" to "Below #200" to provide clearer messaging for apps outside the top 200.

## Current Status

| App | Bundle ID | Status |
|-----|-----------|--------|
| Coinbase | `com.vilcsak.bitcoin2` | ✅ Ranked (#43 as of Dec 2024) |
| Crypto.com | `co.mona.Monaco` | ⚠️ Below #200 |
| Kraken | `com.kraken.invest.app` | ⚠️ Below #200 |
| Polymarket | `com.polymarket.ios-app` | ✅ Ranked (#92 as of Dec 2024) |
| Phantom Wallet | `app.phantom` | ⚠️ Below #200 |

-   All core functionality is working: subscriptions, email delivery, ranking lookups.
-   Apps outside the top 200 now display "Below #200" instead of "Not Ranked".
-   All changes have been committed and pushed to the `main` branch.

## To Do List / Next Steps

### High Priority

-   [x] **Migrate from Supabase to Vercel Postgres** — Completed Dec 2024. Supabase free tier was pausing the project due to inactivity.

### Medium Priority

-   [ ] **Consider adding more apps to the monitoring list.** The current list only has 3 apps (Coinbase, Crypto.com, Kraken), and 2 of them are outside the top 200.
-   [ ] **Add historical tracking.** Store daily rankings in the database to show trends over time.

### Low Priority

-   [ ] **Improve email template.** The current HTML email is functional but basic.
-   [ ] **Add error alerting.** Set up notifications when the cron job fails.
