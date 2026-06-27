import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { name, email, department, count, message } = await request.json();

    if (!name || !email || !department || !count) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await resend.emails.send({
      from: "RankUp <support@rankupfire.com>",
      to: "mplandry77@gmail.com",
      replyTo: email,
      subject: `Department Rate Inquiry — ${department}`,
      html: `
        <h2>New Department Rate Inquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Department:</strong> ${department}</p>
        <p><strong>Number of Firefighters:</strong> ${count}</p>
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending contact email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
