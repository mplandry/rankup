import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY || "");
}

export async function POST() {
  try {
    const resend = getResendClient();
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find students inactive for 30+ days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: inactiveStudents, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, last_sign_in_at")
      .eq("role", "student")
      .or(
        `last_sign_in_at.is.null,last_sign_in_at.lt.${thirtyDaysAgo.toISOString()}`,
      );

    if (error) throw error;

    // Send emails
    let sentCount = 0;
    for (const student of inactiveStudents || []) {
      try {
        await resend.emails.send({
          from: "RankUp <onboarding@resend.dev>",
          to: student.email,
          subject: "We miss you at RankUp! 🔥",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Hey ${student.full_name || "there"}! 👋</h2>
              <p>We noticed you haven't been on RankUp in a while. Your promotional exam is coming up soon!</p>
              <p><strong>Don't let your study streak break!</strong></p>
              <ul>
                <li>📚 Your question bank is waiting</li>
                <li>📝 Practice exams ready to go</li>
                <li>🎯 Track your progress toward passing</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="https://rankupfire.com" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  Get Back to Studying 🔥
                </a>
              </p>
              <p style="color: #666; font-size: 12px; margin-top: 40px;">
                You're receiving this because you're registered for RankUp. 
                ${
                  student.last_sign_in_at
                    ? `Last active: ${new Date(student.last_sign_in_at).toLocaleDateString()}`
                    : "You haven't logged in yet!"
                }
              </p>
            </div>
          `,
        });
        sentCount++;
      } catch (emailError) {
        console.error(`Failed to email ${student.email}:`, emailError);
      }
    }

    return NextResponse.json({
      success: true,
      count: sentCount,
      total: inactiveStudents?.length || 0,
    });
  } catch (error) {
    console.error("Error emailing inactive students:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 },
    );
  }
}
