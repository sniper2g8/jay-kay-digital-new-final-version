// Helper functions to transform invoice data from the actual database structure

// Firebase timestamp interface
interface FirebaseTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

// Invoice item interface
interface InvoiceItem {
  jobId: string;
  jobNo: string;
  quantity: number;
  lineAmount: number;
  description: string;
  unitPerItem: number;
}

export interface RawInvoiceFromDB {
  id: string;
  invoiceNo: string | null;
  customer_id: string | null;
  customerName: string | null;
  amountDue: number | null;
  amountPaid: number | null;
  subtotal: number | null;
  tax: number | null;
  taxRate: number | null;
  total: number | null;
  grandTotal: number | null;
  currency: string | null;
  status: string | null;
  payment_status: string | null;
  invoice_status: string | null;
  issueDate: FirebaseTimestamp | string | null;
  dueDate: FirebaseTimestamp | string | null;
  notes: string | null;
  items: InvoiceItem[] | null;
  created_at: string | null;
  updated_at: string | null;
  invoice_date: string | null;
  due_date: string | null;
  terms_days: number | null;
}

export interface TransformedInvoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  customer_name: string | null;
  amount_due: number;
  amount_paid: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  payment_status: string;
  invoice_status: string;
  issue_date: string | null;
  due_date: string | null;
  notes: string | null;
  items: InvoiceItem[];
  created_at: string | null;
  updated_at: string | null;
  terms_days: number;
}

// Transform Firebase timestamp to ISO string
export function transformFirebaseTimestamp(timestamp: FirebaseTimestamp | string | null): string | null {
  if (!timestamp) return null;
  
  if (typeof timestamp === 'object' && timestamp && '_seconds' in timestamp) {
    // Firebase timestamp format: { _seconds: number, _nanoseconds: number }
    const firebaseTimestamp = timestamp as FirebaseTimestamp;
    const date = new Date(firebaseTimestamp._seconds * 1000 + firebaseTimestamp._nanoseconds / 1000000);
    return date.toISOString();
  }
  
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  
  return null;
}

// Transform raw invoice from database to standardized format
export function transformRawInvoice(rawInvoice: RawInvoiceFromDB): TransformedInvoice {
  return {
    id: rawInvoice.id,
    invoice_number: rawInvoice.invoiceNo || 'N/A',
    customer_id: rawInvoice.customer_id,
    customer_name: rawInvoice.customerName || 'Unknown Customer',
    amount_due: Number(rawInvoice.amountDue || 0),
    amount_paid: Number(rawInvoice.amountPaid || 0),
    subtotal: Number(rawInvoice.subtotal || 0),
    tax: Number(rawInvoice.tax || 0),
    total: Number(rawInvoice.total || rawInvoice.grandTotal || 0),
    currency: rawInvoice.currency || 'SLL',
    status: rawInvoice.status || 'draft',
    payment_status: rawInvoice.payment_status || 'pending',
    invoice_status: rawInvoice.invoice_status || 'draft',
    issue_date: transformFirebaseTimestamp(rawInvoice.issueDate) || rawInvoice.invoice_date,
    due_date: transformFirebaseTimestamp(rawInvoice.dueDate) || rawInvoice.due_date,
    notes: rawInvoice.notes,
    items: Array.isArray(rawInvoice.items) ? rawInvoice.items : [],
    created_at: rawInvoice.created_at,
    updated_at: rawInvoice.updated_at,
    terms_days: rawInvoice.terms_days || 30,
  };
}

// Format currency amounts
export function formatCurrency(amount: number, currency: string = 'SLL'): string {
  if (currency === 'SLL' || currency === 'Le') {
    return `Le ${amount.toLocaleString()}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

// Format date strings
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
}

// Calculate days overdue
export function getDaysOverdue(dueDateString: string | null): number {
  if (!dueDateString) return 0;
  
  try {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  } catch {
    return 0;
  }
}

// Get status colors for badges
export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'partial':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'sent':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'draft':
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
}

export function getPaymentStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'partial':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}