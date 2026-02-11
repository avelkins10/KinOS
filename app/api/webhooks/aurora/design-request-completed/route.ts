import { NextRequest, NextResponse } from "next/server";
import { handleDesignCompleted } from "@/lib/integrations/aurora/service";

export async function GET(request: NextRequest) {
  try {
    // Aurora sends data as query params on GET request
    const searchParams = request.nextUrl.searchParams;
    const designRequestId = searchParams.get("design_request_id");
    const status = searchParams.get("status");

    // Verify webhook token (Aurora sends this in header)
    const token = request.headers.get("x-aurora-webhook-token");
    if (token !== process.env.AURORA_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!designRequestId || status !== "completed") {
      return NextResponse.json(
        { error: "Missing or invalid params" },
        { status: 400 },
      );
    }

    // Process async — return 200 immediately to Aurora
    // (Aurora has 10 second timeout)
    handleDesignCompleted(designRequestId).catch((err) => {
      console.error("Error handling design completed:", err);
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Aurora webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
