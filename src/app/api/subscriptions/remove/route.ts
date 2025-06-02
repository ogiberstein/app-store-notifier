import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, appId } = body;

    if (!email || !appId) {
      return NextResponse.json({ error: 'Email and appId are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .match({ email: email, app_id: appId });

    if (error) {
      console.error('Supabase error during remove:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if any row was actually deleted by trying to select what was supposed to be deleted.
    // This is an optional step, as .delete() doesn't directly return the count of deleted rows easily without .select() before it or specific headers.
    // For simplicity, we assume success if no error, but in a real app, you might want more robust checks.
    
    // Supabase delete operation doesn't throw an error if no rows match the criteria, it just deletes 0 rows.
    // To confirm deletion, you would typically check the `count` if using a version that returns it or do a select query.
    // However, for this task, we'll assume success if no error is thrown by Supabase.

    return NextResponse.json({ message: 'Subscription removed successfully' }, { status: 200 });

  } catch (error) {
    console.error('Handler error during remove:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 