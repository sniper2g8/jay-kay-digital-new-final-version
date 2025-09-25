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
    console.error("[PRODUCTION ERROR] Missing Supabase environment variables");
    console.error("[PRODUCTION ERROR] Available env vars:", {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SECRET_KEY: !!process.env.SUPABASE_SECRET_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV
    });
    return NextResponse.json(
      { 
        error: "Server configuration error",
        details: "Missing Supabase environment variables",
        debug_info: {
          SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          SUPABASE_SECRET_KEY: !!process.env.SUPABASE_SECRET_KEY,
          SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          NODE_ENV: process.env.NODE_ENV
        }
      },
      { status: 500 },
    );
  }
  
  // Create a service role client using the new API key system
  const supabase = createServiceRoleClient();
  
  try {
    console.log(`[PRODUCTION DEBUG] Fetching invoice items for invoice ID: ${id}`);
    console.log('[PRODUCTION DEBUG] Environment check:', {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      publishable: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
      service: !!process.env.SUPABASE_SERVICE_ROLE_KEY || !!process.env.SUPABASE_SECRET_KEY
    });
    
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
        .filter((row: any) => (!row.job_no || String(row.job_no).trim() === '') && row.job_id)
        .map((row: any) => String(row.job_id));
      const uniqueJobIds = Array.from(new Set(missingJobNoIds));
      if (uniqueJobIds.length > 0) {
        console.log(`Enriching job_no for ${uniqueJobIds.length} invoice items missing job numbers`);
        console.log('Job IDs to look up:', uniqueJobIds);
        
        // Convert text job_ids to UUIDs for the lookup
        const { data: jobs, error: jobsErr } = await supabase
          .from('jobs')
          .select('id, jobNo')
          .in('id', uniqueJobIds);
          
        if (jobsErr) {
          console.error('Error fetching jobs:', jobsErr);
        } else if (jobs) {
          const jobMap = new Map<string, string>();
          for (const j of jobs as any[]) {
            if (j?.id && j?.jobNo) {
              jobMap.set(String(j.id), j.jobNo);
            }
          }
          console.log(`Found ${jobMap.size} job numbers to enrich:`, Array.from(jobMap.entries()));
          enriched = enriched.map((row: any) => ({
            ...row,
            job_no: (row.job_no && String(row.job_no).trim() !== '') ? row.job_no : (row.job_id ? jobMap.get(String(row.job_id)) || null : null),
          }));
        }
      }
      
      // Also try to enrich based on description matching if job_id is missing
      // This is a fallback for cases where job_id wasn't stored properly
      const itemsStillMissingJobNo = enriched.filter((row: any) => !row.job_no);
      if (itemsStillMissingJobNo.length > 0) {
        console.log(`${itemsStillMissingJobNo.length} items still missing job numbers, attempting description-based matching`);
        
        // Try to extract job numbers from descriptions like "Job: JKDP-JOB-0001" or "JKDP-JOB-0001"
        for (const item of itemsStillMissingJobNo) {
          if (item.description) {
            const jobNoMatch = item.description.match(/JKDP-JOB-\d+/);
            if (jobNoMatch) {
              const potentialJobNo = jobNoMatch[0];
              // Verify this job number exists in the jobs table
              const { data: matchingJob } = await supabase
                .from('jobs')
                .select('id, jobNo')
                .eq('jobNo', potentialJobNo)
                .single();
              
              if (matchingJob) {
                item.job_no = matchingJob.jobNo;
                item.job_id = matchingJob.id;
                console.log(`Enriched item ${item.id} with job number ${matchingJob.jobNo} from description`);
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to enrich job_no for invoice items:', (e as Error).message);
    }
    
    console.log(`Found ${count} invoice items`);    
    console.log('Sample enriched items:', enriched.slice(0, 3).map(item => ({
      id: item.id,
      job_id: item.job_id,
      job_no: item.job_no,
      description: item.description?.substring(0, 50)
    })));
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