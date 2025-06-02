import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .match({ email: email });

    if (error) {
      console.error('Supabase error during unsubscribe:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // As with the remove endpoint, Supabase delete doesn't error if no rows match.
    // We assume success if no error is thrown by Supabase.
    return NextResponse.json({ message: 'Successfully unsubscribed' }, { status: 200 });

  } catch (error) {
    console.error('Handler error during unsubscribe:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 