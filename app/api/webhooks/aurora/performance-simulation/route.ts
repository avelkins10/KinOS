import { NextRequest, NextResponse } from "next/server";
import { auroraClient } from "@/lib/integrations/aurora/client";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const designId = searchParams.get("design_id");
    const status = searchParams.get("status");

    const token = request.headers.get("x-aurora-webhook-token");
    if (token !== process.env.AURORA_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!designId || status !== "completed") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Pull updated design summary with simulation results
    (async () => {
      try {
        const summary = await auroraClient.getDesignSummary(designId);
        const design = summary.design;

        await supabaseAdmin
          .from("deals")
          .update({
            annual_production_kwh: design.annual_energy_production,
            offset_percentage: design.offset * 100,
            updated_at: new Date().toISOString(),
          })
          .eq("aurora_design_id", designId);

        await supabaseAdmin.from("webhook_events").insert({
          source: "aurora",
          event_type: "performance_simulation_completed",
          payload: { design_id: designId },
          status: "processed",
        });
      } catch (err) {
        console.error("Error handling perf simulation:", err);
      }
    })();

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Aurora webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
