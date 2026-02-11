import { NextRequest, NextResponse } from "next/server";
import {
  createAuroraProject,
  saveConsumptionProfile,
  submitDesignRequest,
} from "@/lib/integrations/aurora/service";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: dealId } = await params;
    const body = await request.json();
    const { action } = body;

    // Auth: createClient from server.ts uses createServerClient (cookies), not browser client
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    switch (action) {
      case "create_project": {
        const projectId = await createAuroraProject(dealId);
        return NextResponse.json({ aurora_project_id: projectId });
      }

      case "save_consumption": {
        const result = await saveConsumptionProfile(dealId, {
          monthly_kwh: body.monthly_kwh,
          annual_kwh: body.annual_kwh,
          utility_company: body.utility_company,
          utility_tariff: body.utility_tariff,
          monthly_bill: body.monthly_bill,
        });
        return NextResponse.json(result);
      }

      case "submit_design_request": {
        const result = await submitDesignRequest(dealId, {
          design_request_type: body.design_request_type,
          target_offset: body.target_offset,
          preferred_module_id: body.preferred_module_id,
          preferred_inverter_id: body.preferred_inverter_id,
          mounting_type: body.mounting_type,
          roof_material: body.roof_material,
          notes: body.notes,
          requested_by: user.id,
        });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("Aurora API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal error",
      },
      { status: 500 },
    );
  }
}
