import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email, appId } = req.body;

    if (!email || !appId) {
      return res.status(400).json({ error: 'Email and appId are required' });
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([{ email, app_id: appId }]);

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ message: 'Subscription added successfully', data });
    } catch (error) {
      console.error('Handler error:', error);
      // Check if error is an instance of Error to access message property
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return res.status(500).json({ error: errorMessage });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 