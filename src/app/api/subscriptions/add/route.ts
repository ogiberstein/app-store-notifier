import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, appId } = body;

    if (!email || !appId) {
      return NextResponse.json({ error: 'Email and appId are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{ email, app_id: appId }])
      .select(); // Add .select() to get the inserted data back

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Subscription added successfully', data }, { status: 200 });
  } catch (error) {
    console.error('Handler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
