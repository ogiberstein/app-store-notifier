# 📬 App Store Notifier — Architecture Guide

A lightweight notification app built using **Next.js** for the frontend and **Supabase** for backend/database. The app allows users (without authentication) to select App Store apps to monitor and receive daily emails at 3PM UTC with updated rankings.

---

## 🗂️ File + Folder Structure

/app-store-notifier
├── /app
│ ├── /api
│ │ ├── /subscriptions
│ │ │ ├── add.ts # Add app to subscription
│ │ │ ├── remove.ts # Remove app from subscription
│ │ ├── /unsubscribe
│ │ │ └── index.ts # Unsubscribe user by email
│ └── /cron
│ └── sendEmails.ts # Cron job to send daily emails
│
├── /components
│ ├── AppList.tsx # List of apps with checkboxes
│ └── EmailSuccess.tsx # Email sent confirmation
│
├── /lib
│ ├── supabase.ts # Supabase client init
│ ├── fetchRank.ts # Fetch app rank from App Store
│ └── email.ts # SendGrid/email handler
│
├── /pages
│ ├── index.tsx # Main UI page
│ └── unsubscribe.tsx # Unsubscribe confirmation page
│
├── /types
│ └── index.ts # Types for apps, subscriptions
│
├── .env.local # Environment variables
├── cron.config.ts # Cron task config (e.g. using cron-job.org or Upstash)
├── package.json
└── README.md

yaml
Copy
Edit

---

## 🧠 Application Flow & Component Roles

### 1. `index.tsx` (Homepage)
- Renders a UI for the user to:
  - Enter their email address
  - Select one or more apps via checkboxes (`AppList.tsx`)
- Submits their selected apps and email to Supabase
- Lightweight form state managed via React local state (`useState`)

### 2. `AppList.tsx`
- Displays a list of popular apps (fetched from static JSON or Supabase)
- Allows toggling checkboxes
- Emits selected values back to parent (`index.tsx`)

### 3. `/api/subscriptions/add.ts`
- Receives POST request with `{ email, appId }`
- Inserts a new record in the Supabase `subscriptions` table

### 4. `/api/subscriptions/remove.ts`
- Receives POST request with `{ email, appId }`
- Deletes a record from the `subscriptions` table

### 5. `/api/unsubscribe/index.ts`
- Handles unsubscribe links in emails
- Removes all app subscriptions for a given email

### 6. `/cron/sendEmails.ts`
- Triggered daily at 3PM UTC by external cron service (like Upstash, cron-job.org, or Vercel Cron)
- Fetches:
  - All subscribed emails
  - Their associated app list
  - App Store ranks via `fetchRank.ts`
- Compiles HTML content
- Sends email via `email.ts` (e.g., SendGrid or Resend)

---

## 🗃️ Supabase Schema

### `subscriptions` Table

| Field         | Type         | Description                                 |
|---------------|--------------|---------------------------------------------|
| id            | UUID         | Primary Key                                 |
| email         | Text         | User's email address                        |
| app_id        | Text         | App identifier (e.g. com.coinbase.exchange) |
| created_at    | Timestamptz  | Time of subscription                        |

### `apps` Table (optional, or can be static)

| Field         | Type | Description                    |
|---------------|------|--------------------------------|
| id            | Text | App identifier                 |
| name          | Text | Display name                   |
| store_url     | Text | App Store URL                  |

---

## 🧠 State Management

- **React Local State**: Checkbox selections & email input on frontend
- **Supabase**: Persistent state of subscriptions (email + app mappings)
- **Stateless Backend APIs**: REST-like endpoints that read/write Supabase data on request
- **No Sessions / Auth**: Lightweight design assumes users are identified by email only (no login)

---

## 🔗 External Services

| Service               | Purpose                                 |
|-----------------------|-----------------------------------------|
| **Supabase**          | Database, CRUD APIs, optional Auth      |
| **SendGrid/Resend**   | Email sending                           |
| **App Store API**     | Rank scraping via `fetchRank.ts`        |
| **Upstash / Cron-job**| Run `sendEmails.ts` daily at 3PM UTC    |

---

## 🔒 Security Considerations

- No login — minimal attack surface
- Email is the only identifier (unsubscribe via tokenized link)
- Use **rate-limiting** and input sanitization on all endpoints
- Add simple CAPTCHA if spam becomes an issue

---

## 📧 Sample Email Format

**Subject:** 📈 Daily App Rank Update for Coinbase  
**Body:**

Hello!

Here's your daily app store rank update:

Coinbase: #12 in Finance - US

To unsubscribe, click here: https://yourdomain.com/unsubscribe?email=user@example.com

yaml
Copy
Edit

---

## 🛠️ Deployment Stack

- **Frontend**: Next.js (App Router or Pages Router)
- **Backend**: Next.js API Routes
- **DB**: Supabase (PostgreSQL + REST API)
- **Email**: SendGrid, Resend, or similar
- **Scheduler**: Upstash Scheduler, or cron-job.org calling `sendEmails.ts`

---

## ✅ MVP Checklist

- [x] Email input + app selection UI
- [x] Subscriptions stored in Supabase
- [x] Fetch app ranks daily
- [x] Send email updates
- [x] Unsubscribe functionality
- [x] Cron job integration