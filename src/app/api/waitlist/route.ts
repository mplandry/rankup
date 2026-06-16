import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, exam_type } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("waitlist")
      .upsert({ email: email.toLowerCase().trim(), exam_type: exam_type || null }, { onConflict: "email" });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ error: "Failed to save email" }, { status: 500 });
  }
}
