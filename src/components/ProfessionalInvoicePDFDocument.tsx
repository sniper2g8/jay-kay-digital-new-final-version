"use client";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image, Font, pdf } from '@react-pdf/renderer';

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  job_no?: string;
  notes?: string;
}

interface Customer {
  business_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

interface InvoiceData {
  id: string;
  invoiceNo?: string;
  created_at: string;
  invoice_date?: string;
  invoice_status?: string;
  payment_status?: string;
  terms_days?: number;
  notes?: string;
  subtotal?: number;
  tax?: number;
  tax_rate?: number;
  discount?: number;
  total?: number;
  amountPaid?: number;
  currency?: string;
}

export interface InvoicePDFDocumentProps {
  invoice: InvoiceData;
  customer?: Customer;
  items: InvoiceItem[];
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  watermark: {
    position: 'absolute',
    top: '35%',
    left: '15%',
    width: '70%','height':'auto',
    opacity: 0.06,
  },
  company: { fontSize: 16, fontWeight: 700 },
  small: { color: '#4b5563', marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8 },
  cell: { flex: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: 6, borderTop: 1, borderColor: '#e5e7eb' },
  th: { flex: 1, fontWeight: 700 },
  tableRow: { flexDirection: 'row', padding: 6, borderTop: 1, borderColor: '#e5e7eb' },
  td: { flex: 1 },
  right: { textAlign: 'right' },
  totals: { marginLeft: 'auto', width: 220, marginTop: 8 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
});

export function InvoicePDFDocument({ invoice, customer, items }: InvoicePDFDocumentProps) {
  const subtotal = invoice.subtotal ?? items.reduce((s, i) => s + (Number(i.total_price) || 0), 0);
  const taxRate = Number(invoice.tax_rate) || 0;
  const tax = invoice.tax ?? subtotal * taxRate / 100;
  const discount = Number(invoice.discount) || 0;
  const total = invoice.total ?? subtotal + tax - discount;
  const amountPaid = Number(invoice.amountPaid) || 0;
  const amountDue = total - amountPaid;
  const invDate = new Date(invoice.invoice_date || invoice.created_at);
  const dueDate = new Date(invDate); dueDate.setDate(dueDate.getDate() + (invoice.terms_days || 30));

  const normalizeCurrencyCode = (code?: string) => {
    if (!code) return 'SLL';
    const raw = String(code).trim();
    const upper = raw.toUpperCase();
    const map: Record<string, string> = {
      'LE': 'SLL',
      'SLE': 'SLL',
      'SLL': 'SLL',
      'LEONE': 'SLL',
      'LEONES': 'SLL',
      'SL': 'SLL',
      'SIERRA LEONE LEONE': 'SLL',
    };
    const candidate = map[upper] || upper;
    try {
      // Validate candidate
      new Intl.NumberFormat(undefined, { style: 'currency', currency: candidate }).format(1);
      return candidate;
    } catch {
      // Fallback to a safe default
      return 'USD';
    }
  };

  const currencyCode = normalizeCurrencyCode(invoice.currency);
  const fmt = (n: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode, currencyDisplay: 'code' }).format(n);
  const fmtDate = (d: Date) => d.toISOString().split('T')[0];

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Watermark */}
        <Image style={styles.watermark} src="/jaykay_logo.png" />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.company}>JAY KAY DIGITAL PRESS</Text>
            <Text style={styles.small}>Professional Printing & Digital Services</Text>
            <Text style={styles.small}>Freetown, Sierra Leone</Text>
            <Text style={styles.small}>Tel: +232 34 788711 | +232 30 741062</Text>
            <Text style={styles.small}>Email: info@jaykaydigitalpress.com</Text>
          </View>
          <View>
            <Text style={{ fontSize: 18, fontWeight: 700, textAlign: 'right' }}>INVOICE</Text>
            <Text style={{ textAlign: 'right', marginTop: 6 }}>Invoice No: #{invoice.invoiceNo || `JKDP-INV-${invoice.id.slice(0, 8)}`}</Text>
            <Text style={{ textAlign: 'right' }}>Issue Date: {fmtDate(invDate)}</Text>
            <Text style={{ textAlign: 'right' }}>Due Date: {fmtDate(dueDate)}</Text>
          </View>
        </View>

        {/* Bill To */}
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          {customer ? (
            <View>
              <Text style={{ fontWeight: 700 }}>{customer.business_name}</Text>
              {customer.contact_person && <Text>Contact: {customer.contact_person}</Text>}
              {customer.address && <Text>Address: {customer.address}</Text>}
              {(customer.city || customer.state || customer.zip_code) && (
                <Text>{[customer.city, customer.state, customer.zip_code].filter(Boolean).join(', ')}</Text>
              )}
              {customer.country && <Text>{customer.country}</Text>}
              {customer.phone && <Text>Phone: {customer.phone}</Text>}
              {customer.email && <Text>Email: {customer.email}</Text>}
            </View>
          ) : (
            <Text>No customer information</Text>
          )}
        </View>

        {/* Items Table */}
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1.2 }]}>Job No</Text>
            <Text style={[styles.th, { flex: 3 }]}>Description</Text>
            <Text style={[styles.th, styles.right]}>Qty</Text>
            <Text style={[styles.th, styles.right]}>Unit Price</Text>
            <Text style={[styles.th, styles.right]}>Total</Text>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 1.2 }]}>{item.job_no || '-'}</Text>
              <Text style={[styles.td, { flex: 3 }]}>{item.description}{item.notes ? `\n${item.notes}` : ''}</Text>
              <Text style={[styles.td, styles.right]}>{Number(item.quantity).toLocaleString()}</Text>
              <Text style={[styles.td, styles.right]}>{fmt(Number(item.unit_price) || 0)}</Text>
              <Text style={[styles.td, styles.right]}>{fmt(Number(item.total_price) || 0)}</Text>
            </View>
          ))}
          {items.length === 0 && (
            <View style={styles.tableRow}>
              <Text>No items found on this invoice.</Text>
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalsRow}><Text>Subtotal:</Text><Text>{fmt(subtotal)}</Text></View>
          {tax > 0 && <View style={styles.totalsRow}><Text>Tax {taxRate ? `(${taxRate}%)` : ''}:</Text><Text>{fmt(tax)}</Text></View>}
          {discount > 0 && <View style={styles.totalsRow}><Text>Discount:</Text><Text>-{fmt(discount)}</Text></View>}
          <View style={[styles.totalsRow, { borderTopWidth: 1, borderColor: '#e5e7eb', marginTop: 4, paddingTop: 4 }]}>
            <Text style={{ fontWeight: 700 }}>Total:</Text><Text style={{ fontWeight: 700 }}>{fmt(total)}</Text>
          </View>
          {amountPaid > 0 && (
            <>
              <View style={styles.totalsRow}><Text>Amount Paid:</Text><Text>{fmt(amountPaid)}</Text></View>
              <View style={styles.totalsRow}><Text>Amount Due:</Text><Text>{fmt(amountDue)}</Text></View>
            </>
          )}
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={{ marginTop: 12, borderTopWidth: 1, borderColor: '#e5e7eb', paddingTop: 8 }}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function downloadInvoicePDF(invoice: InvoiceData, customer: Customer | undefined, items: InvoiceItem[]) {
  const blob = await pdf(<InvoicePDFDocument invoice={invoice} customer={customer} items={items} />).toBlob();
  const fileName = `Invoice_${invoice.invoiceNo || invoice.id.slice(0, 8)}_${(invoice.invoice_date || invoice.created_at).slice(0,10)}.pdf`;
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}


