import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./user-menu";

export async function AuthButton() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href="/auth/login">Sign in</Link>
      </Button>
    );
  }

  // Fetch profile for avatar
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, display_name, username")
    .eq("id", user.id)
    .single();

  return (
    <UserMenu
      avatarUrl={profile?.avatar_url || null}
      displayName={profile?.display_name || null}
      username={profile?.username || null}
    />
  );
}
