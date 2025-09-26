import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-admin'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Environment variables are checked internally
  
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
        // Project reference validation
        if (projectRefFromUrl && projectRefFromKey && projectRefFromUrl !== projectRefFromKey) {

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

  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {

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

    
    // First, check if the invoice exists
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('id')
      .eq('id', id)
      .single();
      
    if (invoiceError) {

      return NextResponse.json(
        { 
          error: "Invoice not found",
          details: invoiceError.message
        },
        { status: 404 },
      );
    }
    
    if (!invoiceData) {

      return NextResponse.json(
        { 
          error: "Invoice not found",
          details: "No invoice found with the provided ID"
        },
        { status: 404 },
      );
    }
    
    // Now fetch the invoice items
    const { data, error, count } = await supabase
      .from('invoice_items')
      .select('*', { count: 'exact' })
      .eq('invoice_id', id);
      

    
    if (error) {

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

        
        // Convert text job_ids to UUIDs for the lookup
        const { data: jobs, error: jobsErr } = await supabase
          .from('jobs')
          .select('id, jobNo')
          .in('id', uniqueJobIds);
          
        if (jobsErr) {

        } else if (jobs) {
          const jobMap = new Map<string, string>();
          for (const j of jobs as any[]) {
            if (j?.id && j?.jobNo) {
              jobMap.set(String(j.id), j.jobNo);
            }
          }

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

              }
            }
          }
        }
      }
    } catch (e) {

    }
    

    return NextResponse.json(enriched);
  } catch (error: any) {

    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message || "An unexpected error occurred"
      },
      { status: 500 },
    );
  }
}