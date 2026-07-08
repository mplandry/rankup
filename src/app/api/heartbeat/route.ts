import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Lightweight endpoint pinged periodically by logged-in clients (see
// ClientAppLayout) so we can tell who's actively using the app right now,
// as opposed to last_sign_in_at which only updates once, at login.
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
