import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// The department rate was retired. This endpoint is kept as a stub (instead of
// being deleted) so old cached pages get a clear error, and so it can no
// longer be used to send email.
export async function POST() {
  return NextResponse.json(
    { error: "Department rate inquiries are closed" },
    { status: 410 },
  );
}
