import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  try {
    // Lazy import to avoid bundling in edge
    const puppeteer = await import('puppeteer');

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    } as any);
    const page = await browser.newPage();

    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = `${base}/invoice/print/${id}`;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });

    await browser.close();

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating exact PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}


