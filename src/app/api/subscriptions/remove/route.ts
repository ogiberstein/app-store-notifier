import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, appId } = body;

    if (!email || !appId) {
      return NextResponse.json({ error: 'Email and appId are required' }, { status: 400 });
    }

    await sql`
      DELETE FROM subscriptions
      WHERE email = ${email} AND app_id = ${appId}
    `;

    return NextResponse.json({ message: 'Subscription removed successfully' }, { status: 200 });

  } catch (error) {
    console.error('Handler error during remove:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 