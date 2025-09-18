import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Await the params Promise in Next.js 15
    const resolvedParams = await params;

    const { rows } = await client.query(
      `
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
    `,
      [resolvedParams.id],
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching invoice items:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice items" },
      { status: 500 },
    );
  } finally {
    await client.end();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Await the params Promise in Next.js 15
    const resolvedParams = await params;
    const invoiceId = resolvedParams.id;

    // Parse the request body
    const items = await request.json();

    // Start a transaction
    await client.query('BEGIN');

    // Delete existing items for this invoice
    await client.query(
      'DELETE FROM invoice_items WHERE invoice_id = $1',
      [invoiceId]
    );

    // Insert new items
    if (items && items.length > 0) {
      for (const item of items) {
        await client.query(
          `
          INSERT INTO invoice_items (
            invoice_id, 
            description, 
            quantity, 
            unit_price, 
            total_price, 
            job_no,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          `,
          [
            invoiceId,
            item.description || '',
            item.quantity || 1,
            item.unit_price || 0,
            item.total_price || 0,
            item.job_no || null
          ]
        );
      }
    }

    // Commit the transaction
    await client.query('COMMIT');

    return NextResponse.json({ success: true, message: 'Invoice items updated successfully' });

  } catch (error) {
    // Rollback the transaction on error
    await client.query('ROLLBACK');
    console.error("Error updating invoice items:", error);
    return NextResponse.json(
      { error: "Failed to update invoice items" },
      { status: 500 },
    );
  } finally {
    await client.end();
  }
}