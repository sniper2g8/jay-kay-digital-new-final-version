import { createServiceRoleClient } from '@/lib/supabase-admin';
import { ProfessionalInvoicePDF } from '@/components/ProfessionalInvoicePDF';

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ id: string }>;
}

export default async function PrintableInvoicePage({ params }: Params) {
  const admin = createServiceRoleClient();
  const { id } = await params;

  const { data: invoice } = await admin
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  const { data: customer } = await admin
    .from('customers')
    .select('*')
    .eq('id', invoice?.customer_id ?? '')
    .maybeSingle();

  const { data: items } = await admin
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id);

  const invoiceProps = {
    id: invoice?.id ?? id,
    invoiceNo: invoice?.invoiceNo ?? `JKDP-INV-${String(id).slice(0,8)}`,
    created_at: invoice?.created_at ?? new Date().toISOString(),
    invoice_date: invoice?.created_at ?? new Date().toISOString(),
    invoice_status: invoice?.status ?? 'draft',
    payment_status: invoice?.payment_status ?? 'pending',
    terms_days: 30,
    notes: invoice?.notes ?? undefined,
    total: invoice?.total ?? 0,
    amountPaid: invoice?.amountPaid ?? 0,
    currency: invoice?.currency ?? 'SLL',
  };

  const customerProps = customer
    ? {
        business_name: customer.business_name,
        contact_person: customer.contact_person ?? undefined,
        email: customer.email ?? undefined,
        phone: customer.phone ?? undefined,
        address: customer.address ?? undefined,
        city: customer.city ?? undefined,
        state: customer.state ?? undefined,
        zip_code: customer.zip_code ?? undefined,
      }
    : undefined;

  const itemsProps = (items ?? []).map((i: any) => ({
    id: i.id,
    description: i.description ?? 'No description',
    quantity: Number(i.quantity) || 1,
    unit_price: Number(i.unit_price) || 0,
    total_price: Number(i.total_price) || 0,
    job_no: i.job_no ?? undefined,
    notes: i.notes ?? undefined,
  }));

  return (
    <div className="p-6">
      <ProfessionalInvoicePDF invoice={invoiceProps} customer={customerProps} items={itemsProps} showActions={false} />
    </div>
  );
}


