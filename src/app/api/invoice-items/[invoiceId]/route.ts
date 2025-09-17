import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    const { rows } = await client.query(`
      SELECT 
        id,
        invoice_id,
        description,
        quantity,
        unit_price,
        total_price,
        job_id,
        job_no,
        notes,
        created_at,
        updated_at
      FROM invoice_items 
      WHERE invoice_id = $1 
      ORDER BY id
    `, [params.invoiceId]);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching invoice items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice items' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}