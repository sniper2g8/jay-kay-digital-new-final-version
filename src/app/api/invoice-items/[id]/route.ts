import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Environment variables are checked internally

  // Sanity-check that the URL's project ref matches the key's issuer project
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const projectRefFromUrl = url.split("https://")[1]?.split(".")[0];
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY) as string | undefined;
    if (serviceKey) {
      const parts = serviceKey.split(".");
      if (parts.length >= 2) {
        const payloadJson = Buffer.from(parts[1], "base64url").toString("utf8");
        const payload = JSON.parse(payloadJson);
        const iss: string | undefined = payload?.iss;
        const _role: string | undefined = payload?.role;
        const projectRefFromKey = iss?.split("https://")[1]?.split(".")[0];
        // Project reference validation
        if (
          projectRefFromUrl &&
          projectRefFromKey &&
          projectRefFromUrl !== projectRefFromKey
        ) {
          return NextResponse.json(
            {
              error: "Supabase credentials mismatch",
              details:
                "The configured URL and service role key are from different Supabase projects.",
            },
            { status: 500 },
          );
        }
      }
    }
  } catch {
    // Intentionally ignore this error - if JWT parsing fails, we'll validate via env vars
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
  ) {
    return NextResponse.json(
      {
        error: "Server configuration error",
        details: "Missing required server configuration",
      },
      { status: 500 },
    );
  }

  // Create a service role client using the new API key system
  const supabase = createServiceRoleClient();

  try {
    // First, check if the invoice exists
    const { data: invoiceData, error: invoiceError } = await supabase
      .from("invoices")
      .select("id")
      .eq("id", id)
      .single();

    if (invoiceError) {
      return NextResponse.json(
        {
          error: "Invoice not found",
          details: invoiceError.message,
        },
        { status: 404 },
      );
    }

    if (!invoiceData) {
      return NextResponse.json(
        {
          error: "Invoice not found",
          details: "No invoice found with the provided ID",
        },
        { status: 404 },
      );
    }

    // Now fetch the invoice items
    const { data, error, count: _count } = await supabase
      .from("invoice_items")
      .select("*", { count: "exact" })
      .eq("invoice_id", id);

    if (error) {
      return NextResponse.json(
        {
          error: "Database error",
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      );
    }

    // Enrich missing job_no by looking up jobs if needed
    let enriched = data || [];
    try {
      const missingJobNoIds = (enriched || [])
        .filter(
          (row: any) =>
            (!row.job_no || String(row.job_no).trim() === "") && row.job_id,
        )
        .map((row: any) => String(row.job_id));
      const uniqueJobIds = Array.from(new Set(missingJobNoIds));
      if (uniqueJobIds.length > 0) {
        // Convert text job_ids to UUIDs for the lookup
        const { data: jobs, error: jobsErr } = await supabase
          .from("jobs")
          .select("id, jobNo")
          .in("id", uniqueJobIds);

        if (jobsErr) {
          // Silently ignore job lookup errors - we'll just leave job_no empty
        } else if (jobs) {
          const jobMap = new Map<string, string>();
          for (const j of jobs as any[]) {
            if (j?.id && j?.jobNo) {
              jobMap.set(String(j.id), j.jobNo);
            }
          }

          enriched = enriched.map((row: any) => ({
            ...row,
            job_no:
              row.job_no && String(row.job_no).trim() !== ""
                ? row.job_no
                : row.job_id
                  ? jobMap.get(String(row.job_id)) || null
                  : null,
          }));
        }
      }

      // Also try to enrich based on description matching if job_id is missing
      // This is a fallback for cases where job_id wasn't stored properly
      const itemsStillMissingJobNo = enriched.filter((row: any) => !row.job_no);
      if (itemsStillMissingJobNo.length > 0) {
        // Extract all potential job numbers from descriptions and batch-lookup
        const jobNoRegex = /JKDP-JOB-\d+/g;
        const potentialJobNos = Array.from(
          new Set(
            itemsStillMissingJobNo.flatMap((item: any) => {
              if (!item?.description || typeof item.description !== "string")
                return [] as string[];
              const matches = item.description.match(jobNoRegex);
              return matches ? matches : [];
            }),
          ),
        );

        if (potentialJobNos.length > 0) {
          const { data: jobsByNo } = await supabase
            .from("jobs")
            .select("id, jobNo")
            .in("jobNo", potentialJobNos);

          const jobByNoMap = new Map<string, { id: string; jobNo: string }>();
          (jobsByNo || []).forEach((j: any) => {
            if (j?.jobNo && j?.id)
              jobByNoMap.set(j.jobNo, { id: j.id, jobNo: j.jobNo });
          });

          itemsStillMissingJobNo.forEach((item: any) => {
            if (!item?.description || typeof item.description !== "string")
              return;
            const match = item.description.match(jobNoRegex)?.[0];
            if (!match) return;
            const job = jobByNoMap.get(match);
            if (job) {
              item.job_no = job.jobNo;
              item.job_id = job.id;
            }
          });
        }
      }
    } catch {
      // Silently ignore enrichment errors - we'll just leave job_no empty
    }

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
