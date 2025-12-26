import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await sql`
      DELETE FROM subscriptions
      WHERE email = ${email}
    `;

    return NextResponse.json({ message: 'Successfully unsubscribed' }, { status: 200 });

  } catch (error) {
    console.error('Handler error during unsubscribe:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 