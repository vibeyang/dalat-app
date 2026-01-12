import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/invite/[token] - Get invitation details (public)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const supabase = await createClient();
  const { token } = await params;

  // Get invitation with event details
  const { data: invitation, error } = await supabase
    .from('event_invitations')
    .select(`
      id,
      email,
      name,
      status,
      rsvp_status,
      claimed_by,
      responded_at,
      events (
        id,
        slug,
        title,
        description,
        image_url,
        location_name,
        address,
        google_maps_url,
        starts_at,
        ends_at,
        timezone,
        status
      ),
      profiles:invited_by (
        display_name,
        username,
        avatar_url
      )
    `)
    .eq('token', token)
    .single();

  if (error || !invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  // Mark as viewed if first time
  if (invitation.status === 'sent') {
    await supabase
      .from('event_invitations')
      .update({ status: 'viewed', viewed_at: new Date().toISOString() })
      .eq('token', token);
  }

  // Check if event is still valid
  const event = invitation.events as unknown as {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    image_url: string | null;
    location_name: string | null;
    address: string | null;
    google_maps_url: string | null;
    starts_at: string;
    ends_at: string | null;
    timezone: string;
    status: string;
  };

  if (!event || event.status === 'cancelled') {
    return NextResponse.json({ error: 'Event is no longer available' }, { status: 410 });
  }

  const inviter = invitation.profiles as unknown as {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };

  return NextResponse.json({
    invitation: {
      id: invitation.id,
      name: invitation.name,
      status: invitation.status,
      rsvp_status: invitation.rsvp_status,
      responded_at: invitation.responded_at,
      claimed_by: invitation.claimed_by,
    },
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      description: event.description,
      image_url: event.image_url,
      location_name: event.location_name,
      address: event.address,
      google_maps_url: event.google_maps_url,
      starts_at: event.starts_at,
      ends_at: event.ends_at,
      timezone: event.timezone,
    },
    inviter: {
      name: inviter?.display_name || inviter?.username || 'Someone',
      avatar_url: inviter?.avatar_url,
    },
  });
}
