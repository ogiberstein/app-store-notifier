# 🛠️ App Store Notifier MVP — Step-by-Step Build Plan

This plan breaks the MVP into **granular, testable tasks**, with each task focused on a single concern. Use this as a task queue for an engineering LLM or incremental dev process.

---

## 🔧 SETUP PHASE

### 1. Initialize Next.js App
- **Start**: Run `npx create-next-app@latest app-store-notifier`
- **End**: A new Next.js app is created with the default home page rendering successfully in the browser.

### 2. Set up Supabase project
- **Start**: Create a project in [Supabase](https://supabase.com/)
- **End**: You have the project URL and anon/public keys saved.

### 3. Install dependencies
- **Start**: Add `@supabase/supabase-js`, `dotenv`, and `axios`
- **End**: Packages are installed and listed in `package.json`

```bash
npm install @supabase/supabase-js dotenv axios
```

---

## 🧠 BACKEND API: DATABASE + ROUTES

### 4. Create `lib/supabase.ts` for client setup
- **Start**: Create the file
- **End**: `createClient` exports a usable Supabase client

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 5. Create Supabase `subscriptions` table
- **Start**: Go to Supabase dashboard → Table editor
- **End**: Table `subscriptions` exists with fields:
  - `id` (UUID, primary key)
  - `email` (text)
  - `app_id` (text)
  - `created_at` (timestamp)

### 6. Create `/api/subscriptions/add.ts`
- **Start**: Create an API route
- **End**: It inserts `{ email, appId }` into Supabase and returns success/failure

### 7. Create `/api/subscriptions/remove.ts`
- **Start**: Create an API route
- **End**: It deletes `{ email, appId }` from Supabase and returns result

### 8. Create `/api/unsubscribe/index.ts`
- **Start**: Create an API route
- **End**: It deletes all rows in `subscriptions` for given `email`

---

## 🎨 FRONTEND: UI & LOGIC

### 9. Build static app list in `AppList.tsx`
- **Start**: Create a checkbox list of 5 apps with hardcoded names/IDs
- **End**: The component emits selected app IDs to a parent via `onChange`

### 10. Create email + checkbox form in `index.tsx`
- **Start**: Implement email input + import `AppList`
- **End**: Selecting apps + entering email populates local React state

### 11. Add "Subscribe" button + connect to `add.ts`
- **Start**: On click, POST each selected app + email to `api/subscriptions/add`
- **End**: User receives a success message upon completion

### 12. Add "Unsubscribe" link in UI (for test)
- **Start**: Add a button that POSTs to `/api/unsubscribe` with the user's email
- **End**: Subscriptions for the email are removed

---

## 📩 EMAIL DELIVERY

### 13. Create `lib/fetchRank.ts`
- **Start**: Hardcode fetching logic using iTunes RSS or scraping (mocked return OK)
- **End**: A function `fetchRank(appId: string): Promise<number>` returns fake data

### 14. Create `lib/email.ts` with send logic
- **Start**: Add SendGrid/Resend logic using API key
- **End**: Function `sendEmail(to: string, body: string)` sends a test email

### 15. Create `/cron/sendEmails.ts`
- **Start**: Add API route that:
  - Fetches all distinct emails
  - Gets their app list
  - Calls `fetchRank()` and `sendEmail()`
- **End**: Running the route manually sends the correct emails

---

## 🕒 CRON + UNSUBSCRIBE UI

### 16. Create `unsubscribe.tsx` page
- **Start**: Parse `email` from query string
- **End**: Calls `api/unsubscribe` and displays confirmation message

### 17. Add unsubscribe link in email body
- **Start**: Modify `email.ts` to include:
  `https://yourdomain.com/unsubscribe?email=user@example.com`
- **End**: Link works and calls unsubscribe flow

### 18. Set up Cron (e.g., with Upstash)
- **Start**: Use Upstash scheduler or cron-job.org to call `/api/cron/sendEmails` daily
- **End**: Emails are triggered automatically at 3PM UTC

---

## ✅ FINAL POLISH

### 19. Improve error handling + feedback on UI
- **Start**: Add error + loading states for API requests
- **End**: User sees helpful messages on success/failure

### 20. Deploy to Vercel (or similar)
- **Start**: Push repo and connect to Vercel
- **End**: Production version is live with env variables set

---

## ⚠️ OUTSTANDING TO-DO ITEMS

### 21. Fix Supabase RLS Policy for `subscriptions` Table
- **Issue**: The Row Level Security policy for allowing anonymous inserts into the `subscriptions` table is not working as expected. The API route `/api/subscriptions/add` only functions correctly when RLS is disabled on the table.
- **Goal**: Configure the RLS policy correctly so that anonymous users (via the `anon` key) can insert into the `subscriptions` table while RLS is enabled. This likely involves ensuring the policy target role is exclusively `anon` and the `WITH CHECK` expression is `true`.

---

## ✨ FUTURE ENHANCEMENTS

### FE1. Implement App Search Functionality
- **Goal**: Allow users to search for any app in the App Store and add it to their subscription list, instead of relying on a fixed static list.
- **Components**:
  - UI: Add a search input field on the main page.
  - Backend: Create a new API route (e.g., `/api/search-apps`) that takes a search term.
  - API Integration: This backend route will call an external App Store search API (e.g., iTunes Search API or a third-party service) to fetch app results.
  - UI Update: Display search results dynamically and allow users to select apps to add to the `AppList` component or directly to their selections.
- **Considerations**: API rate limits, error handling for external API calls, UI for displaying search results and loading states.

### FE2. Marketing & Community
- **Goal**: Increase visibility and user engagement.
- **Tasks**:
    - **Website Content**: Insert "by the creator of Coinrule & VWAPE" on the main page, with links to both websites.
    - **Email Content**:
        - Include "by the creator of Coinrule & VWAPE" in the notification emails, with links.
        - Add a link to the app's website in the email.
        - Include a suggestion to "forward this email to friends who might find it useful."
    - **Monetization/Support**: Add a donation link (e.g., Buy Me A Coffee, PayPal) to both the website and the notification emails.
