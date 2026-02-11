import { NextRequest, NextResponse } from "next/server";
import { handleDesignRejected } from "@/lib/integrations/aurora/service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const designRequestId = searchParams.get("design_request_id");
    const status = searchParams.get("status");
    const reason = searchParams.get("reason") ?? undefined;

    const token = request.headers.get("x-aurora-webhook-token");
    if (token !== process.env.AURORA_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!designRequestId || status !== "rejected") {
      return NextResponse.json(
        { error: "Missing or invalid params" },
        { status: 400 },
      );
    }

    handleDesignRejected(designRequestId, reason).catch((err) => {
      console.error("Error handling design rejected:", err);
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Aurora webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
