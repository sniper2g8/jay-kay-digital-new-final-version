import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-admin'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Log environment variables for debugging
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("Supabase Secret/Service Role Key exists:", !!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
  
  // Sanity-check that the URL's project ref matches the key's issuer project
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const projectRefFromUrl = url.split('https://')[1]?.split('.')[0]
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY) as string | undefined
    if (serviceKey) {
      const parts = serviceKey.split('.')
      if (parts.length >= 2) {
        const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8')
        const payload = JSON.parse(payloadJson)
        const iss: string | undefined = payload?.iss
        const role: string | undefined = payload?.role
        const projectRefFromKey = iss?.split('https://')[1]?.split('.')[0]
        console.log("Supabase projectRef (url, key):", projectRefFromUrl, projectRefFromKey, "role:", role)
        if (projectRefFromUrl && projectRefFromKey && projectRefFromUrl !== projectRefFromKey) {
          console.error("Supabase URL and key belong to different projects")
          return NextResponse.json(
            {
              error: "Supabase credentials mismatch",
              details: "The configured URL and service role key are from different Supabase projects.",
            },
            { status: 500 },
          )
        }
      }
    }
  } catch (e) {
    console.warn("Supabase key inspection failed (non-fatal):", (e as Error).message)
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.error("Missing Supabase environment variables");
    return NextResponse.json(
      { 
        error: "Server configuration error",
        details: "Missing Supabase environment variables"
      },
      { status: 500 },
    );
  }
  
  // Create a service role client using the new API key system
  const supabase = createServiceRoleClient();
  
  try {
    console.log(`Fetching invoice items for invoice ID: ${id}`);
    
    // First, check if the invoice exists
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('id')
      .eq('id', id)
      .single();
      
    if (invoiceError) {
      console.error("Error fetching invoice:", invoiceError);
      return NextResponse.json(
        { 
          error: "Invoice not found",
          details: invoiceError.message
        },
        { status: 404 },
      );
    }
    
    if (!invoiceData) {
      console.error("Invoice not found");
      return NextResponse.json(
        { 
          error: "Invoice not found",
          details: "No invoice found with the provided ID"
        },
        { status: 404 },
      );
    }
    
    // Now fetch the invoice items
    console.log("Fetching invoice items...");
    const { data, error, count } = await supabase
      .from('invoice_items')
      .select('*', { count: 'exact' })
      .eq('invoice_id', id);
      
    console.log("Query result:", { data, error, count });
    
    if (error) {
      console.error("Database error:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      });
      return NextResponse.json(
        { 
          error: "Database error",
          details: error.message,
          code: error.code
        },
        { status: 500 },
      );
    }
    
    // Enrich missing job_no by looking up jobs if needed
    let enriched = data || [];
    try {
      const missingJobNoIds = (enriched || [])
        .filter((row: any) => !row.job_no && row.job_id)
        .map((row: any) => row.job_id);
      const uniqueJobIds = Array.from(new Set(missingJobNoIds));
      if (uniqueJobIds.length > 0) {
        const { data: jobs, error: jobsErr } = await supabase
          .from('jobs')
          .select('id, jobNo')
          .in('id', uniqueJobIds);
        if (!jobsErr && jobs) {
          const jobMap = new Map<string, string>();
          for (const j of jobs as any[]) {
            if (j?.id) jobMap.set(j.id, j.jobNo || null);
          }
          enriched = enriched.map((row: any) => ({
            ...row,
            job_no: row.job_no || (row.job_id ? jobMap.get(row.job_id) || null : null),
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to enrich job_no for invoice items:', (e as Error).message);
    }
    
    console.log(`Found ${count} invoice items`);
    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message || "An unexpected error occurred"
      },
      { status: 500 },
    );
  }
}