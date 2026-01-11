import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Building2, Sparkles, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = await getProfile(user.id);

  // Only admin and contributor can access admin section
  if (!profile || !["admin", "contributor"].includes(profile.role)) {
    redirect("/");
  }

  const isAdmin = profile.role === "admin";

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: Shield },
    { href: "/admin/organizers", label: "Organizers", icon: Building2 },
    { href: "/admin/extract", label: "AI Extract", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin Header */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between mx-auto px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">dalat.app</span>
            </Link>
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">
              <Shield className="w-3 h-3" />
              {isAdmin ? "Admin" : "Contributor"}
            </div>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
