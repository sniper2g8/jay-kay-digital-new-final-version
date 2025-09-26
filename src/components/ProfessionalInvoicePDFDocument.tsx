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
    padding: 25,
    fontSize: 7,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '25%',
    width: '50%',
    height: 'auto',
    opacity: 0.02,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 6
  },
  company: { 
    fontSize: 10, 
    fontWeight: 400,
    color: '#111827',
    marginBottom: 1
  },
  companyInfo: {
    fontSize: 6,
    color: '#6B7280',
    marginBottom: 1
  },
  sectionTitle: { 
    fontSize: 8, 
    fontWeight: 700, 
    marginBottom: 4,
    color: '#111827'
  },
  row: { 
    flexDirection: 'row', 
    gap: 4 
  },
  cell: { 
    flex: 1 
  },
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#F9FAFB', 
    padding: 4, 
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB'
  },
  th: { 
    flex: 1, 
    fontWeight: 700,
    fontSize: 7,
    color: '#374151'
  },
  tableRow: { 
    flexDirection: 'row', 
    padding: 4, 
    borderBottomWidth: 1, 
    borderColor: '#E5E7EB'
  },
  td: { 
    flex: 1,
    fontSize: 6,
    color: '#111827'
  },
  right: { 
    textAlign: 'right' 
  },
  totalsContainer: {
    marginLeft: 'auto',
    width: 160,
    marginTop: 8
  },
  totalsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 1 
  },
  bold: {
    fontWeight: 400
  },
  billToContainer: {
    marginBottom: 10
  },
  billToContent: {
    fontSize: 6,
    color: '#111827'
  },
  billToLabel: {
    fontWeight: 700,
    marginBottom: 1
  },
  notesContainer: {
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#E5E7EB'
  },
  invoiceDetails: {
    textAlign: 'right'
  },
  invoiceTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 4
  },
  invoiceDetail: {
    fontSize: 6,
    marginBottom: 1,
    color: '#111827'
  },
  invoiceDetailLabel: {
    color: '#6B7280'
  }
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
            <Image style={styles.logo} src="/JK_Logo.jpg" />
            <Text style={styles.company}>JAY KAY DIGITAL PRESS</Text>
            <Text style={styles.companyInfo}>Professional Printing & Digital Services</Text>
            <Text style={styles.companyInfo}>Freetown, Sierra Leone</Text>
            <Text style={styles.companyInfo}>Tel: +232 34 788711 | +232 30 741062</Text>
            <Text style={styles.companyInfo}>Email: info@jaykaydigitalpress.com</Text>
          </View>
          <View style={styles.invoiceDetails}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceDetail}>Invoice No: <Text style={styles.bold}>#{invoice.invoiceNo || `JKDP-INV-${invoice.id.slice(0, 8)}`}</Text></Text>
            <Text style={styles.invoiceDetail}>Issue Date: <Text style={styles.bold}>{fmtDate(invDate)}</Text></Text>
            <Text style={styles.invoiceDetail}>Due Date: <Text style={styles.bold}>{fmtDate(dueDate)}</Text></Text>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.billToContainer}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          {customer ? (
            <View>
              <Text style={[styles.billToContent, styles.billToLabel]}>{customer.business_name}</Text>
              {customer.contact_person && <Text style={styles.billToContent}>Contact: {customer.contact_person}</Text>}
              {customer.address && <Text style={styles.billToContent}>Address: {customer.address}</Text>}
              {(customer.city || customer.state || customer.zip_code) && (
                <Text style={styles.billToContent}>{[customer.city, customer.state, customer.zip_code].filter(Boolean).join(', ')}</Text>
              )}
              {customer.country && <Text style={styles.billToContent}>{customer.country}</Text>}
              {customer.phone && <Text style={styles.billToContent}>Phone: {customer.phone}</Text>}
              {customer.email && <Text style={styles.billToContent}>Email: {customer.email}</Text>
}
            </View>
          ) : (
            <Text style={styles.billToContent}>No customer information</Text>
          )}
        </View>

        {/* Items Table */}
        <View>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 0.8 }]}>Job No</Text>
            <Text style={[styles.th, { flex: 2.5 }]}>Description</Text>
            <Text style={[styles.th, styles.right]}>Qty</Text>
            <Text style={[styles.th, styles.right]}>Unit Price</Text>
            <Text style={[styles.th, styles.right]}>Total</Text>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 0.8 }]}>{item.job_no || '-'}</Text>
              <Text style={[styles.td, { flex: 2.5 }]}>{item.description}{item.notes ? `\n${item.notes}` : ''}</Text>
              <Text style={[styles.td, styles.right]}>{Number(item.quantity).toLocaleString()}</Text>
              <Text style={[styles.td, styles.right]}>{fmt(Number(item.unit_price) || 0)}</Text>
              <Text style={[styles.td, styles.right]}>{fmt(Number(item.total_price) || 0)}</Text>
            </View>
          ))}
          {items.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.td}>No items found on this invoice.</Text>
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsRow}>
            <Text style={styles.td}>Subtotal:</Text>
            <Text style={styles.td}>{fmt(subtotal)}</Text>
          </View>
          {tax > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.td}>Tax {taxRate ? `(${taxRate}%)` : ''}:</Text>
              <Text style={styles.td}>{fmt(tax)}</Text>
            </View>
          )}
          {discount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.td}>Discount:</Text>
              <Text style={styles.td}>-{fmt(discount)}</Text>
            </View>
          )}
          <View style={[styles.totalsRow, { borderTopWidth: 1, borderColor: '#E5E7EB', marginTop: 4, paddingTop: 4 }]}>
            <Text style={[styles.td, styles.bold]}>Total:</Text>
            <Text style={[styles.td, styles.bold]}>{fmt(total)}</Text>
          </View>
          {amountPaid > 0 && (
            <>
              <View style={styles.totalsRow}>
                <Text style={styles.td}>Amount Paid:</Text>
                <Text style={[styles.td]}>{fmt(amountPaid)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={[styles.td, styles.bold]}>Amount Due:</Text>
                <Text style={[styles.td, styles.bold]}>{fmt(amountDue)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.billToContent}>{invoice.notes}</Text>
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