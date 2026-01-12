import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyEventInvitation } from '@/lib/novu';
import type { Locale, InviteQuotaCheck } from '@/lib/types';

interface InviteRequest {
  emails: Array<{ email: string; name?: string }>;
}

// POST /api/events/[slug]/invitations - Send invitations
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient();
  const { slug } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Get the event by slug
  const { data: event } = await supabase
    .from('events')
    .select('id, title, slug, description, starts_at, location_name, created_by')
    .eq('slug', slug)
    .single();

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Only event creator can send invitations
  if (event.created_by !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const body: InviteRequest = await request.json();
  const { emails } = body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: 'emails array required' }, { status: 400 });
  }

  // Check quota before sending
  const { data: quotaCheck } = await supabase.rpc('check_invite_quota', {
    p_user_id: user.id,
    p_count: emails.length,
  }) as { data: InviteQuotaCheck | null };

  if (!quotaCheck?.allowed) {
    return NextResponse.json({
      error: 'Quota exceeded',
      reason: quotaCheck?.reason,
      remaining_daily: quotaCheck?.remaining_daily,
      remaining_weekly: quotaCheck?.remaining_weekly,
    }, { status: 429 });
  }

  // Get inviter profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username, locale')
    .eq('id', user.id)
    .single();

  const inviterName = profile?.display_name || profile?.username || 'Someone';
  const locale = (profile?.locale as Locale) || 'en';

  const results: Array<{ email: string; success: boolean; error?: string; token?: string }> = [];

  // Process each email
  for (const { email, name } of emails) {
    const normalizedEmail = email.toLowerCase().trim();

    // Create invitation record
    const { data: invitation, error: insertError } = await supabase
      .from('event_invitations')
      .insert({
        event_id: event.id,
        invited_by: user.id,
        email: normalizedEmail,
        name: name || null,
        status: 'pending',
      })
      .select('id, token, claimed_by')
      .single();

    if (insertError) {
      // Handle duplicate
      if (insertError.code === '23505') {
        results.push({ email, success: false, error: 'Already invited' });
      } else {
        results.push({ email, success: false, error: insertError.message });
      }
      continue;
    }

    // Save to contacts
    await supabase.rpc('upsert_organizer_contact', {
      p_owner_id: user.id,
      p_email: normalizedEmail,
      p_name: name || null,
    });

    // Send email via Novu
    try {
      await notifyEventInvitation(
        normalizedEmail,
        name || null,
        locale,
        event.title,
        event.slug,
        event.description,
        event.starts_at,
        event.location_name,
        inviterName,
        invitation.token
      );

      // Update status to sent
      await supabase
        .from('event_invitations')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', invitation.id);

      results.push({ email, success: true, token: invitation.token });
    } catch (error) {
      console.error('Failed to send invite email:', error);
      results.push({ email, success: false, error: 'Failed to send email' });
    }
  }

  // Increment quota for successful sends
  const successCount = results.filter(r => r.success).length;
  if (successCount > 0) {
    await supabase.rpc('increment_invite_quota', {
      p_user_id: user.id,
      p_count: successCount,
    });
  }

  return NextResponse.json({
    success: true,
    results,
    sent: successCount,
    failed: results.length - successCount,
  });
}

// GET /api/events/[slug]/invitations - List invitations for event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient();
  const { slug } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Get the event by slug
  const { data: event } = await supabase
    .from('events')
    .select('id, created_by')
    .eq('slug', slug)
    .single();

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Only event creator can view invitations
  if (event.created_by !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Get invitations with counts
  const [{ data: invitations }, { data: counts }] = await Promise.all([
    supabase
      .from('event_invitations')
      .select('id, email, name, status, rsvp_status, claimed_by, sent_at, responded_at, created_at')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false }),
    supabase.rpc('get_invitation_counts', { p_event_id: event.id }),
  ]);

  return NextResponse.json({
    invitations: invitations || [],
    counts: counts || {},
  });
}
