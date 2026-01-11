import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface BulkEventInput {
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string;
  location_name?: string;
  address?: string;
  organizer_id?: string;
  skip?: boolean;
}

interface BulkEventRequest {
  extraction_id?: string;
  events: BulkEventInput[];
}

function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function generateSlug(title: string): string {
  const base = sanitizeSlug(title);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Role check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "contributor"].includes(profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body: BulkEventRequest = await request.json();
  const { extraction_id, events } = body;

  if (!events || !Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: "No events provided" }, { status: 400 });
  }

  // Filter out skipped events
  const eventsToCreate = events.filter((e) => !e.skip);

  if (eventsToCreate.length === 0) {
    return NextResponse.json({ error: "All events were skipped" }, { status: 400 });
  }

  try {
    // Prepare events for insertion
    const eventInserts = eventsToCreate.map((event) => ({
      slug: generateSlug(event.title),
      title: event.title,
      description: event.description || null,
      starts_at: event.starts_at,
      ends_at: event.ends_at || null,
      location_name: event.location_name || null,
      address: event.address || null,
      organizer_id: event.organizer_id || null,
      created_by: user.id,
      status: "published" as const,
      timezone: "Asia/Ho_Chi_Minh",
    }));

    // Insert events
    const { data: createdEvents, error: insertError } = await supabase
      .from("events")
      .insert(eventInserts)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create events: " + insertError.message },
        { status: 500 }
      );
    }

    // Update extraction log if provided
    if (extraction_id) {
      const skippedCount = events.filter((e) => e.skip).length;
      await supabase
        .from("extraction_logs")
        .update({
          published_count: createdEvents?.length ?? 0,
          skipped_count: skippedCount,
          status: "completed",
        })
        .eq("id", extraction_id);
    }

    return NextResponse.json({
      success: true,
      created_count: createdEvents?.length ?? 0,
      events: createdEvents,
    });
  } catch (error) {
    console.error("Bulk create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create events" },
      { status: 500 }
    );
  }
}
