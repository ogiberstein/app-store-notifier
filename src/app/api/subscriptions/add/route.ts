import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, appId, appName } = body;

    if (!email || !appId || !appName) {
      return NextResponse.json({ error: 'Email, appId, and appName are required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO subscriptions (email, app_id, app_name)
      VALUES (${email}, ${appId}, ${appName})
      ON CONFLICT (email, app_id) DO NOTHING
      RETURNING *
    `;

    return NextResponse.json({ message: 'Subscription added successfully', data: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Handler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
