import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyWaitlistPromotion } from '@/lib/novu';

export async function POST() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Get user's locale
  const { data: profile } = await supabase
    .from('profiles')
    .select('locale')
    .eq('id', user.id)
    .single();

  try {
    await notifyWaitlistPromotion(
      user.id,
      profile?.locale || 'en',
      'Test Event - Beach BBQ',
      'test-event'
    );

    return NextResponse.json({ success: true, message: 'Notification sent!' });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
