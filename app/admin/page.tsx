import Link from "next/link";
import { Building2, Sparkles, Calendar, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

async function getStats() {
  const supabase = await createClient();

  const [organizersResult, eventsResult, usersResult] = await Promise.all([
    supabase.from("organizers").select("id", { count: "exact", head: true }),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  return {
    organizers: organizersResult.count ?? 0,
    events: eventsResult.count ?? 0,
    users: usersResult.count ?? 0,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    {
      title: "Organizers",
      value: stats.organizers,
      icon: Building2,
      href: "/admin/organizers",
      description: "Manage venues and organizations",
    },
    {
      title: "AI Extract",
      value: null,
      icon: Sparkles,
      href: "/admin/extract",
      description: "Extract events from posters",
    },
    {
      title: "Published Events",
      value: stats.events,
      icon: Calendar,
      href: "/",
      description: "Total published events",
    },
    {
      title: "Users",
      value: stats.users,
      icon: Users,
      href: "#",
      description: "Registered users",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage organizers, extract events from posters, and monitor activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative rounded-lg border bg-card p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <card.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                {card.value !== null ? (
                  <p className="text-2xl font-bold">{card.value}</p>
                ) : (
                  <p className="text-sm text-primary font-medium">Go →</p>
                )}
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/organizers/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Building2 className="w-4 h-4" />
            Add Organizer
          </Link>
          <Link
            href="/admin/extract"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Extract from Poster
          </Link>
        </div>
      </div>
    </div>
  );
}
