import { sql } from '@vercel/postgres';

export { sql };

/**
 * Initialize the subscriptions table if it doesn't exist.
 * Call this once during setup or let it auto-create on first use.
 */
export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      app_id VARCHAR(255) NOT NULL,
      app_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(email, app_id)
    )
  `;
  
  await sql`
    CREATE TABLE IF NOT EXISTS ranking_history (
      id SERIAL PRIMARY KEY,
      app_id VARCHAR(255) NOT NULL,
      rank INTEGER,
      recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
      UNIQUE(app_id, recorded_date)
    )
  `;
}

